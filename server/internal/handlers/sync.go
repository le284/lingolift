package handlers

import (
	"fmt"
	"net/http"
	"time"

	"lingolift-server/internal/db"
	"lingolift-server/internal/models"

	"github.com/gin-gonic/gin"
)

func SyncHandler(c *gin.Context) {
	userID := getUserID(c)
	var req models.SyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Process Upstream Changes
	fmt.Printf("Debug: Received %d CreatedCards, %d ModifiedCards, %d DeletedCards, %d DeletedLessons\n", len(req.Changes.CreatedCards), len(req.Changes.ModifiedCards), len(req.Changes.DeletedCardIDs), len(req.Changes.DeletedLessonIDs))

	// A. Created Cards
	for _, newUserCard := range req.Changes.CreatedCards {
		fmt.Printf("Debug: Processing new card %s for lesson %s\n", newUserCard.Card.ID, newUserCard.LessonID)
		// Verify lesson exists and belongs to user
		var lesson models.Lesson
		if err := db.DB.First(&lesson, "id = ? AND user_id = ?", newUserCard.LessonID, userID).Error; err != nil {
			fmt.Printf("Debug: Lesson %s not found or not owned by user, skipping card\n", newUserCard.LessonID)
			continue // Skip if lesson not found
		}

		card := newUserCard.Card
		card.LessonID = newUserCard.LessonID

		// Check if card already exists
		var existingCard models.Flashcard
		if err := db.DB.Where("id = ?", card.ID).First(&existingCard).Error; err == nil {
			// Ensure existing card belongs to a lesson owned by user
			var existingLesson models.Lesson
			if err := db.DB.First(&existingLesson, "id = ? AND user_id = ?", existingCard.LessonID, userID).Error; err != nil {
				fmt.Printf("Debug: Existing card %s belongs to another user's lesson, skipping\n", card.ID)
				continue
			}

			fmt.Printf("Debug: Card %s exists. Client updated: %d, Server updated: %d\n", card.ID, card.LastUpdated, existingCard.LastUpdated)
			// Card exists. Check timestamp.
			if card.LastUpdated > existingCard.LastUpdated {
				// App is newer, update server
				card.ID = existingCard.ID
				card.LessonID = existingCard.LessonID
				db.DB.Save(&card)
				fmt.Println("Debug: Updated existing card with client data")
			}
		} else {
			// Card does not exist, create it
			if err := db.DB.Create(&card).Error; err != nil {
				fmt.Printf("Debug: Failed to create card: %v\n", err)
			} else {
				fmt.Println("Debug: Created new card")
			}
		}
	}

	// B. Modified Cards (Content Updates)
	for _, modifiedCard := range req.Changes.ModifiedCards {
		var card models.Flashcard
		// Join with Lesson to check UserID
		if err := db.DB.Joins("JOIN lessons ON lessons.id = flashcards.lesson_id").
			Where("flashcards.id = ? AND lessons.user_id = ?", modifiedCard.ID, userID).
			First(&card).Error; err == nil {

			// Conflict Resolution: Last Write Wins
			if modifiedCard.LastUpdated > card.LastUpdated {
				card.Front = modifiedCard.Front
				card.Back = modifiedCard.Back
				card.LastUpdated = modifiedCard.LastUpdated
				db.DB.Save(&card)
			}
		}
	}

	// C. Deleted Cards
	if len(req.Changes.DeletedCardIDs) > 0 {
		now := time.Now().UnixMilli()
		// Only delete cards belonging to user's lessons
		// We use a subquery or join
		db.DB.Exec(`
			UPDATE flashcards 
			SET deleted_at = ?, last_updated = ? 
			WHERE id IN ? AND lesson_id IN (SELECT id FROM lessons WHERE user_id = ?)
		`, now, now, req.Changes.DeletedCardIDs, userID)
	}

	// C2. Deleted Lessons
	if len(req.Changes.DeletedLessonIDs) > 0 {
		now := time.Now().UnixMilli()
		// Only delete lessons belonging to user
		db.DB.Model(&models.Lesson{}).
			Where("id IN ? AND user_id = ?", req.Changes.DeletedLessonIDs, userID).
			Updates(map[string]interface{}{"deleted_at": now})
	}

	// D. Progress Updates
	for _, progress := range req.Changes.ProgressUpdates {
		var card models.Flashcard
		if err := db.DB.Joins("JOIN lessons ON lessons.id = flashcards.lesson_id").
			Where("flashcards.id = ? AND lessons.user_id = ?", progress.CardID, userID).
			First(&card).Error; err == nil {

			if progress.LastUpdated > card.LastUpdated {
				card.Interval = progress.Interval
				card.Repetition = progress.Repetition
				card.EFactor = progress.EFactor
				card.NextReview = progress.NextReview
				card.LastUpdated = progress.LastUpdated
				db.DB.Save(&card)
			}
		}
	}

	// 2. Fetch Downstream Updates
	var lessons []models.Lesson

	if req.LastSyncTimestamp == 0 {
		// Initial Sync: Fetch ALL non-deleted lessons for USER
		db.DB.Preload("Flashcards", "deleted_at = 0").Where("user_id = ? AND deleted_at = 0", userID).Find(&lessons)
	} else {
		// Incremental Sync

		// Incremental Sync

		// Subquery to find IDs of lessons with modified cards (scoped to user)
		// We use a subquery to avoid fetching thousands of IDs and hitting the SQL variable limit (999 in SQLite)
		subQuery := db.DB.Table("flashcards").
			Select("lesson_id").
			Joins("JOIN lessons ON lessons.id = flashcards.lesson_id").
			Where("flashcards.last_updated > ? AND flashcards.deleted_at = 0 AND lessons.user_id = ?", req.LastSyncTimestamp, userID)

		// Fetch lessons (New OR Modified OR Modified Flashcards)
		db.DB.Preload("Flashcards", "deleted_at = 0").
			Where("user_id = ? AND (created_at > ? OR last_updated > ? OR id IN (?)) AND deleted_at = 0", userID, req.LastSyncTimestamp, req.LastSyncTimestamp, subQuery).
			Find(&lessons)
	}

	// Fetch Deleted Lessons
	var deletedLessons []models.Lesson
	db.DB.Where("user_id = ? AND deleted_at > ?", userID, req.LastSyncTimestamp).Find(&deletedLessons)
	deletedLessonIDs := make([]string, len(deletedLessons))
	for i, l := range deletedLessons {
		deletedLessonIDs[i] = l.ID
	}

	// Fetch Deleted Cards (Global for User)
	var deletedCards []models.Flashcard
	db.DB.Joins("JOIN lessons ON lessons.id = flashcards.lesson_id").
		Where("lessons.user_id = ? AND flashcards.deleted_at > ?", userID, req.LastSyncTimestamp).
		Find(&deletedCards)
	deletedCardIDs := make([]string, len(deletedCards))
	for i, c := range deletedCards {
		deletedCardIDs[i] = c.ID
	}

	// Fetch Remote Progress (Cards updated by other devices)
	var updatedCards []models.Flashcard
	db.DB.Joins("JOIN lessons ON lessons.id = flashcards.lesson_id").
		Where("lessons.user_id = ? AND flashcards.last_updated > ? AND flashcards.deleted_at = 0", userID, req.LastSyncTimestamp).
		Find(&updatedCards)

	remoteProgress := make([]models.CardProgress, 0)
	for _, card := range updatedCards {
		remoteProgress = append(remoteProgress, models.CardProgress{
			CardID:      card.ID,
			Interval:    card.Interval,
			Repetition:  card.Repetition,
			EFactor:     card.EFactor,
			NextReview:  card.NextReview,
			LastUpdated: card.LastUpdated,
		})
	}

	// Initialize slices
	if lessons == nil {
		lessons = make([]models.Lesson, 0)
	}
	if remoteProgress == nil {
		remoteProgress = make([]models.CardProgress, 0)
	}
	// Initialize slices if nil (though make() ensures they aren't nil, this is just for safety/clarity if logic changes)
	if lessons == nil {
		lessons = make([]models.Lesson, 0)
	}
	if remoteProgress == nil {
		remoteProgress = make([]models.CardProgress, 0)
	}
	// deletedLessonIDs and deletedCardIDs are initialized with make(), so they are never nil.
	// We can skip the checks.

	response := models.SyncResponse{
		ServerTimestamp: time.Now().UnixMilli(),
	}
	response.Updates.Lessons = lessons
	response.Updates.RemoteProgress = remoteProgress
	response.Updates.DeletedLessonIDs = deletedLessonIDs
	response.Updates.DeletedCardIDs = deletedCardIDs

	c.JSON(http.StatusOK, response)
}
