package middleware

import (
	"net/http"
	"strings"

	"lingolift-server/internal/db"
	"lingolift-server/internal/models"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Check Authorization Header (API Key for Mobile)
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				apiKeyStr := parts[1]
				var apiKey models.APIKey
				if err := db.DB.Where("key = ?", apiKeyStr).First(&apiKey).Error; err == nil {
					c.Set("userID", apiKey.UserID)
					c.Next()
					return
				}
			}
		}

		// 2. Check Cookie (Session for Web)
		userID, err := c.Cookie("auth_token")
		if err == nil && userID != "" {
			// Verify user exists (optional but recommended)
			// For performance, we might skip DB check on every request if we trust the cookie,
			// but since it's a raw ID, we MUST verify it exists to prevent spoofing if IDs were guessable (UUIDs are hard to guess but still).
			// A better approach is signed cookies or JWT.
			// For this MVP, we'll check DB.
			var user models.User
			if err := db.DB.First(&user, "id = ?", userID).Error; err == nil {
				c.Set("userID", user.ID)
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
	}
}
