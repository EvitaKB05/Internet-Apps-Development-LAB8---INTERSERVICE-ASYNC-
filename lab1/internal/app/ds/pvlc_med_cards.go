// internal/app/ds/pvlc_med_cards.go
package ds

import "time"

// Статусы медицинской карты
const (
	PvlcMedCardStatusDraft     = "черновик"
	PvlcMedCardStatusFormed    = "сформирован"
	PvlcMedCardStatusCompleted = "завершен"
	PvlcMedCardStatusRejected  = "отклонен"
	PvlcMedCardStatusDeleted   = "удален"
)

// ==================== ДОБАВЛЯЕМ НОВУЮ КОНСТАНТУ ====================
// Ключ для асинхронного сервиса (8 байт = 16 символов)
const AsyncServiceKey = "lab8key12345678" // ДОЛЖЕН СОВПАДАТЬ С КЛЮЧОМ В DJANGO!

type PvlcMedCard struct {
	ID           uint      `gorm:"primaryKey"`
	Status       string    `gorm:"not null; default:'черновик'"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
	PatientName  string    `gorm:"not null"`
	DoctorName   string    `gorm:"type:varchar(100); default:'Иванов И.И.'"`
	FinalizedAt  *time.Time
	CompletedAt  *time.Time
	ModeratorID  *uint
	Moderator    MedUser                `gorm:"foreignKey:ModeratorID; constraint:OnDelete:SET NULL"`
	TotalResult  float64                `gorm:"type:decimal(10,2)"`
	Calculations []MedMmPvlcCalculation `gorm:"foreignKey:PvlcMedCardID"`
	UserID       uint                   `gorm:"not null; default:1"`
	User         MedUser                `gorm:"foreignKey:UserID; constraint:OnDelete:CASCADE"`

	// ==================== ДОБАВЛЯЕМ НОВЫЕ ПОЛЯ ====================
	// Для отслеживания асинхронных вычислений

	// CalculatedCount - количество рассчитанных формул
	// Когда модератор завершает заявку, сначала = 0
	// Потом постепенно увеличивается по мере расчета формул
	CalculatedCount int `gorm:"default:0"`

	// AsyncCalculated - флаг что расчет был асинхронным
	// false = расчет еще не завершен или был синхронным
	// true = асинхронный расчет завершен
	AsyncCalculated bool `gorm:"default:false"`
}
