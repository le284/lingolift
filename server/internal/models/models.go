package models

type User struct {
	ID        string   `gorm:"primaryKey;type:uuid" json:"id"`
	Username  string   `gorm:"uniqueIndex" json:"username"`
	Password  string   `json:"-"` // Don't return password in JSON
	APIKeys   []APIKey `gorm:"foreignKey:UserID" json:"apiKeys"`
	CreatedAt int64    `json:"createdAt"`
}

type APIKey struct {
	ID        string `gorm:"primaryKey;type:uuid" json:"id"`
	UserID    string `gorm:"index" json:"userId"`
	Key       string `gorm:"uniqueIndex" json:"key"`
	Name      string `json:"name"` // e.g. "Mobile", "Tablet"
	CreatedAt int64  `json:"createdAt"`
}

type Lesson struct {
	ID              string      `gorm:"primaryKey;type:uuid" json:"id"`
	UserID          string      `gorm:"index" json:"userId"` // Foreign key
	Title           string      `json:"title"`
	Description     string      `json:"description"`
	CreatedAt       int64       `json:"createdAt"`
	AudioURL        string      `json:"audioUrl"`
	PDFURL          string      `json:"pdfUrl"`
	MarkdownContent string      `json:"markdownContent"`
	Tags            []string    `json:"tags" gorm:"serializer:json"`
	DeletedAt       int64       `json:"deletedAt"`
	Flashcards      []Flashcard `gorm:"foreignKey:LessonID" json:"flashcards"`
}

type Flashcard struct {
	ID            string  `gorm:"primaryKey;type:uuid" json:"id"`
	LessonID      string  `gorm:"index" json:"lessonId"` // Foreign key
	Front         string  `json:"front"`
	Back          string  `json:"back"`
	IsUserCreated bool    `json:"isUserCreated"`
	Interval      int     `json:"interval"`
	Repetition    int     `json:"repetition"`
	EFactor       float64 `json:"efactor"`
	NextReview    int64   `json:"nextReview"`
	LastUpdated   int64   `json:"lastUpdated"`
	DeletedAt     int64   `json:"deletedAt"`
}

// Sync structures
type SyncRequest struct {
	LastSyncTimestamp int64 `json:"lastSyncTimestamp"`
	Changes           struct {
		CreatedCards     []NewUserCard  `json:"createdCards"`
		ModifiedCards    []Flashcard    `json:"modifiedCards"`
		DeletedCardIDs   []string       `json:"deletedCardIds"`
		DeletedLessonIDs []string       `json:"deletedLessonIds"`
		ProgressUpdates  []CardProgress `json:"progressUpdates"`
	} `json:"changes"`
}

type NewUserCard struct {
	LessonID string    `json:"lessonId"`
	Card     Flashcard `json:"card"`
}

type CardProgress struct {
	CardID      string  `json:"cardId"`
	Interval    int     `json:"interval"`
	Repetition  int     `json:"repetition"`
	EFactor     float64 `json:"efactor"`
	NextReview  int64   `json:"nextReview"`
	LastUpdated int64   `json:"lastUpdated"`
}

type SyncResponse struct {
	ServerTimestamp int64 `json:"serverTimestamp"`
	Updates         struct {
		Lessons          []Lesson       `json:"lessons"`
		DeletedLessonIDs []string       `json:"deletedLessonIds"`
		RemoteProgress   []CardProgress `json:"remoteProgress"`
		DeletedCardIDs   []string       `json:"deletedCardIds"`
	} `json:"updates"`
}
