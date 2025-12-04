package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"lingolift-server/internal/db"
	"lingolift-server/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func RegisterHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	var count int64
	db.DB.Model(&models.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Generate Initial API Key
	apiKeyStr := generateAPIKey()
	userID := uuid.New().String()

	user := models.User{
		ID:        userID,
		Username:  req.Username,
		Password:  string(hashedPassword),
		CreatedAt: time.Now().UnixMilli(),
	}

	initialKey := models.APIKey{
		ID:        uuid.New().String(),
		UserID:    userID,
		Key:       apiKeyStr,
		Name:      "Default",
		CreatedAt: time.Now().UnixMilli(),
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	if err := db.DB.Create(&initialKey).Error; err != nil {
		// Cleanup user if key creation fails (optional but good)
		db.DB.Delete(&user)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create api key"})
		return
	}

	// Set session/cookie (simplified for now, just return success)
	// In a real app, we'd set a secure cookie here.
	// For this iteration, we'll rely on the client to login immediately or we can set it here.
	setAuthCookie(c, user.ID)

	c.JSON(http.StatusCreated, gin.H{"message": "User created", "user": user})
}

func LoginHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := db.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	setAuthCookie(c, user.ID)
	c.JSON(http.StatusOK, gin.H{"message": "Logged in", "user": user})
}

func LogoutHandler(c *gin.Context) {
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func GetProfileHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := db.DB.Preload("APIKeys").First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func GenerateAPIKeyHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Name = "New Key" // Default name
	}
	if req.Name == "" {
		req.Name = "New Key"
	}

	newKeyStr := generateAPIKey()
	newKey := models.APIKey{
		ID:        uuid.New().String(),
		UserID:    userID.(string),
		Key:       newKeyStr,
		Name:      req.Name,
		CreatedAt: time.Now().UnixMilli(),
	}

	if err := db.DB.Create(&newKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create API key"})
		return
	}

	c.JSON(http.StatusOK, newKey)
}

func DeleteAPIKeyHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	keyID := c.Param("id")

	if err := db.DB.Where("id = ? AND user_id = ?", keyID, userID).Delete(&models.APIKey{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key deleted"})
}

// Helper functions

func generateAPIKey() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return uuid.New().String() // Fallback
	}
	return hex.EncodeToString(bytes)
}

func setAuthCookie(c *gin.Context, userID string) {
	// Simple cookie for now. In production, use a signed session or JWT.
	// MaxAge: 30 days
	c.SetCookie("auth_token", userID, 3600*24*30, "/", "", false, true)
}
