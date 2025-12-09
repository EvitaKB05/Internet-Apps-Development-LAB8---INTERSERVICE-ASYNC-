package ds

import "time"

// Ответы для API

type APIResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type PvlcMedFormulaResponse struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Formula     string `json:"formula"`
	ImageURL    string `json:"image_url"`
	Category    string `json:"category"`
	Gender      string `json:"gender"`
	MinAge      int    `json:"min_age"`
	MaxAge      int    `json:"max_age"`
	IsActive    bool   `json:"is_active"`
}

type PvlcMedCardResponse struct {
	ID              uint                           `json:"id"`
	Status          string                         `json:"status"`
	CreatedAt       time.Time                      `json:"created_at"`
	UpdatedAt       time.Time                      `json:"updated_at"` // ДОБАВЛЕНО
	PatientName     string                         `json:"patient_name"`
	DoctorName      string                         `json:"doctor_name"`
	FinalizedAt     *time.Time                     `json:"finalized_at,omitempty"`
	CompletedAt     *time.Time                     `json:"completed_at,omitempty"`
	TotalResult     float64                        `json:"total_result"`
	MedCalculations []MedMmPvlcCalculationResponse `json:"med_calculations"`
	// ==================== ДОБАВЛЯЕМ НОВЫЕ ПОЛЯ ====================
	// Для отображения прогресса асинхронных вычислений во фронтенде

	// CalculatedCount - количество рассчитанных формул
	// Отправляется во фронтенд для отображения прогресса
	CalculatedCount int `json:"calculated_count"`

	// AsyncCalculated - флаг асинхронного расчета
	// Во фронтенде по этому полю можно показать "расчет завершен"
	AsyncCalculated bool `json:"async_calculated"`

	// CalculationProgress - прогресс вычислений в процентах (0-100)
	// Рассчитывается на лету: (CalculatedCount / общее количество формул) * 100
	// Не хранится в БД, только в ответе API
	CalculationProgress float64 `json:"calculation_progress,omitempty"`
}

type MedMmPvlcCalculationResponse struct {
	PvlcMedFormulaID uint    `json:"pvlc_med_formula_id"`
	Title            string  `json:"title"`
	Description      string  `json:"description"`
	Formula          string  `json:"formula"`
	ImageURL         string  `json:"image_url"`
	InputHeight      float64 `json:"input_height"`
	FinalResult      float64 `json:"final_result"`
}

type CartIconResponse struct {
	MedCardID    uint `json:"med_card_id"`
	MedItemCount int  `json:"med_item_count"`
}

type MedUserResponse struct {
	ID          uint   `json:"id"`
	Login       string `json:"login"`
	IsModerator bool   `json:"is_moderator"`
}

// ==================== ДОБАВЛЯЕМ НОВУЮ СТРУКТУРУ ====================
// Для обработки запросов от Django сервиса

type AsyncResultUpdateRequest struct {
	// TotalResult - результат расчета ДЖЕЛ от Django
	TotalResult float64 `json:"total_result" binding:"required"`

	// CalculatedCount - сколько формул рассчитано
	CalculatedCount int `json:"calculated_count"`

	// AsyncCalculated - флаг что расчет асинхронный
	AsyncCalculated bool `json:"async_calculated"`

	// AsyncKey - ключ для авторизации (ОБЯЗАТЕЛЬНОЕ ПОЛЕ!)
	// Django должен отправлять тот же ключ что и в константе AsyncServiceKey
	AsyncKey string `json:"async_key" binding:"required"`
}
