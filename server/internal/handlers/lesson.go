package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"lingolift-server/internal/db"
	"lingolift-server/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreateLessonHandler(c *gin.Context) {
	userID := getUserID(c)
	// Parse Multipart Form
	// 32 MB max memory
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	title := c.PostForm("title")
	description := c.PostForm("description")

	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}

	lessonID := uuid.New().String()
	lesson := models.Lesson{
		ID:          lessonID,
		UserID:      userID,
		Title:       title,
		Description: description,
		CreatedAt:   time.Now().UnixMilli(),
		LastUpdated: time.Now().UnixMilli(),
		Flashcards:  []models.Flashcard{}, // Empty initially
	}

	// Handle Audio Upload
	audioFile, err := c.FormFile("audio")
	if err == nil {
		ext := filepath.Ext(audioFile.Filename)
		filename := fmt.Sprintf("%s_audio%s", lessonID, ext)
		savePath := filepath.Join("uploads", filename)

		// Ensure uploads directory exists
		os.MkdirAll("uploads", os.ModePerm)

		if err := c.SaveUploadedFile(audioFile, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save audio file"})
			return
		}
		lesson.AudioURL = "/uploads/" + filename
	}

	// Handle PDF Upload
	pdfFile, err := c.FormFile("pdf")
	if err == nil {
		ext := filepath.Ext(pdfFile.Filename)
		filename := fmt.Sprintf("%s_pdf%s", lessonID, ext)
		savePath := filepath.Join("uploads", filename)

		// Ensure uploads directory exists
		os.MkdirAll("uploads", os.ModePerm)

		if err := c.SaveUploadedFile(pdfFile, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save PDF file"})
			return
		}
		lesson.PDFURL = "/uploads/" + filename
	}

	// Handle Markdown Content (Text)
	markdownContent := c.PostForm("markdown")
	if markdownContent != "" {
		lesson.MarkdownContent = markdownContent
	}

	// Handle Tags
	tagsStr := c.PostForm("tags")
	if tagsStr != "" {
		// Simple comma-separated parsing
		// In a real app, we might want to trim spaces
		lesson.Tags = strings.Split(tagsStr, ",")
		for i := range lesson.Tags {
			lesson.Tags[i] = strings.TrimSpace(lesson.Tags[i])
		}
	}

	if err := db.DB.Create(&lesson).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lesson"})
		return
	}

	c.JSON(http.StatusCreated, lesson)
}

func UpdateLessonHandler(c *gin.Context) {
	userID := getUserID(c)
	id := c.Param("id")
	var lesson models.Lesson
	if err := db.DB.First(&lesson, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lesson not found"})
		return
	}

	// Parse Multipart Form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	title := c.PostForm("title")
	description := c.PostForm("description")

	if title != "" {
		lesson.Title = title
	}
	lesson.Description = description // Allow clearing description

	// Handle Audio Upload
	audioFile, err := c.FormFile("audio")
	if err == nil {
		ext := filepath.Ext(audioFile.Filename)
		filename := fmt.Sprintf("%s_audio_%d%s", id, time.Now().Unix(), ext) // Append timestamp to avoid cache issues
		savePath := filepath.Join("uploads", filename)

		os.MkdirAll("uploads", os.ModePerm)

		if err := c.SaveUploadedFile(audioFile, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save audio file"})
			return
		}
		lesson.AudioURL = "/uploads/" + filename
	}

	// Handle PDF Upload
	pdfFile, err := c.FormFile("pdf")
	if err == nil {
		ext := filepath.Ext(pdfFile.Filename)
		filename := fmt.Sprintf("%s_pdf_%d%s", id, time.Now().Unix(), ext)
		savePath := filepath.Join("uploads", filename)

		os.MkdirAll("uploads", os.ModePerm)

		if err := c.SaveUploadedFile(pdfFile, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save PDF file"})
			return
		}
		lesson.PDFURL = "/uploads/" + filename
	}

	// Handle Markdown Content
	markdownContent := c.PostForm("markdown")
	lesson.MarkdownContent = markdownContent

	// Handle Tags
	tagsStr := c.PostForm("tags")
	if tagsStr != "" {
		lesson.Tags = strings.Split(tagsStr, ",")
		for i := range lesson.Tags {
			lesson.Tags[i] = strings.TrimSpace(lesson.Tags[i])
		}
	} else {
		lesson.Tags = []string{}
	}

	lesson.LastUpdated = time.Now().UnixMilli()

	if err := db.DB.Save(&lesson).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update lesson"})
		return
	}

	c.JSON(http.StatusOK, lesson)
}

func DeleteLessonHandler(c *gin.Context) {
	userID := getUserID(c)
	id := c.Param("id")
	now := time.Now().UnixMilli()
	if err := db.DB.Model(&models.Lesson{}).Where("id = ? AND user_id = ?", id, userID).Update("deleted_at", now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete lesson"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lesson deleted"})
}

func GetLessonsHandler(c *gin.Context) {
	userID := getUserID(c)
	var lessons []models.Lesson
	if err := db.DB.Preload("Flashcards", "deleted_at = 0").Where("user_id = ? AND deleted_at = 0", userID).Find(&lessons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lessons"})
		return
	}
	c.JSON(http.StatusOK, lessons)
}

func GetDeletedLessonsHandler(c *gin.Context) {
	userID := getUserID(c)
	var lessons []models.Lesson
	if err := db.DB.Preload("Flashcards", "deleted_at = 0").Where("user_id = ? AND deleted_at > 0", userID).Find(&lessons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deleted lessons"})
		return
	}
	c.JSON(http.StatusOK, lessons)
}

func RestoreLessonHandler(c *gin.Context) {
	userID := getUserID(c)
	id := c.Param("id")
	if err := db.DB.Model(&models.Lesson{}).Where("id = ? AND user_id = ?", id, userID).Update("deleted_at", 0).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restore lesson"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lesson restored"})
}
