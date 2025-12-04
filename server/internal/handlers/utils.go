package handlers

import "github.com/gin-gonic/gin"

func getUserID(c *gin.Context) string {
	return c.GetString("userID")
}
