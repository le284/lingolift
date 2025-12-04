package routes

import (
	"lingolift-server/internal/handlers"
	"lingolift-server/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// API Routes
	apiGroup := r.Group("/api")
	{
		// Public Routes
		apiGroup.POST("/auth/register", handlers.RegisterHandler)
		apiGroup.POST("/auth/login", handlers.LoginHandler)
		apiGroup.POST("/auth/logout", handlers.LogoutHandler)

		// Protected Routes
		protected := apiGroup.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/auth/profile", handlers.GetProfileHandler)
			protected.POST("/auth/apikey", handlers.GenerateAPIKeyHandler)
			protected.DELETE("/auth/apikey/:id", handlers.DeleteAPIKeyHandler)

			protected.GET("/lessons", handlers.GetLessonsHandler)
			protected.POST("/lessons", handlers.CreateLessonHandler)
			protected.PUT("/lessons/:id", handlers.UpdateLessonHandler)
			protected.DELETE("/lessons/:id", handlers.DeleteLessonHandler)
			protected.GET("/lessons/trash", handlers.GetDeletedLessonsHandler)
			protected.POST("/lessons/:id/restore", handlers.RestoreLessonHandler)
			protected.POST("/sync", handlers.SyncHandler)
			protected.POST("/cards", handlers.CreateCardHandler)
			protected.DELETE("/cards/:id", handlers.DeleteCardHandler)
			protected.PUT("/cards/:id", handlers.UpdateCardHandler)
		}
	}
}
