package main

import (
	"embed"
	"io"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"lingolift-server/internal/db"
	"lingolift-server/internal/routes"

	"github.com/gin-gonic/gin"
)

//go:embed web/dist/*
var webFSEmbed embed.FS

func main() {
	// Initialize Database
	db.InitDB()

	webFS, err := fs.Sub(webFSEmbed, "web/dist")
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Setup Routes
	routes.SetupRoutes(r)

	// Serve Uploads
	r.Static("/uploads", "./uploads")

	// Serve Static Files from Embedded FS
	// Create a sub-filesystem for assets to map /assets correctly
	assetsFS, err := fs.Sub(webFS, "assets")
	if err != nil {
		log.Fatal("Failed to create assets FS:", err)
	}
	r.StaticFS("/assets", http.FS(assetsFS))

	r.GET("/favicon.ico", func(c *gin.Context) {
		c.FileFromFS("favicon.ico", http.FS(webFS))
	})
	r.GET("/manifest.json", func(c *gin.Context) {
		c.FileFromFS("manifest.json", http.FS(webFS))
	})

	// Read index.html content once
	indexFile, err := webFS.Open("index.html")
	if err != nil {
		log.Fatal("Failed to open index.html:", err)
	}
	indexContent, err := io.ReadAll(indexFile)
	if err != nil {
		log.Fatal("Failed to read index.html:", err)
	}
	indexFile.Close()

	// Serve Index HTML for SPA
	r.NoRoute(func(c *gin.Context) {
		if c.Request.Method == http.MethodGet &&
			!strings.HasPrefix(c.Request.URL.Path, "/api/") &&
			!strings.HasPrefix(c.Request.URL.Path, "/uploads/") {

			c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
			c.Header("Content-Type", "text/html")
			c.String(http.StatusOK, string(indexContent))
			return
		}
	})

	// Run server
	r.Run(":8080") // Listen and serve on 0.0.0.0:8080
}
