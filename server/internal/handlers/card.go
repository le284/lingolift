package handlers

import (
	"net/http"
	"time"

	"lingolift-server/internal/db"
	"lingolift-server/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreateCardHandler(c *gin.Context) {
	userID := getUserID(c)
	var card models.Flashcard
	if err := c.ShouldBindJSON(&card); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if card.ID == "" {
		card.ID = uuid.New().String()
	}
	if card.LessonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "LessonID is required"})
		return
	}

	// Verify lesson belongs to user
	var lesson models.Lesson
	if err := db.DB.First(&lesson, "id = ? AND user_id = ?", card.LessonID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lesson not found"})
		return
	}

	now := time.Now().UnixMilli()
	card.LastUpdated = now
	if card.Interval == 0 {
		card.Interval = 0
		card.Repetition = 0
		card.EFactor = 2.5
		card.NextReview = now
	}

	if err := db.DB.Create(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create card"})
		return
	}
	c.JSON(http.StatusCreated, card)
}

func DeleteCardHandler(c *gin.Context) {
	userID := getUserID(c)
	id := c.Param("id")
	now := time.Now().UnixMilli()

	// Ensure card belongs to user's lesson
	result := db.DB.Exec(`
		UPDATE flashcards 
		SET deleted_at = ?, last_updated = ? 
		WHERE id = ? AND lesson_id IN (SELECT id FROM lessons WHERE user_id = ?)
	`, now, now, id, userID)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete card"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Card deleted"})
}

func UpdateCardHandler(c *gin.Context) {
	userID := getUserID(c)
	id := c.Param("id")
	var req struct {
		Front string `json:"front"`
		Back  string `json:"back"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	now := time.Now().UnixMilli()

	// Ensure card belongs to user's lesson
	result := db.DB.Exec(`
		UPDATE flashcards 
		SET front = ?, back = ?, last_updated = ? 
		WHERE id = ? AND lesson_id IN (SELECT id FROM lessons WHERE user_id = ?)
	`, req.Front, req.Back, now, id, userID)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update card"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Card updated"})
}
