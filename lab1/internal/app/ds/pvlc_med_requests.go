package ds

// Запросы для API

type CreatePvlcMedFormulaRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Formula     string `json:"formula" binding:"required"`
	Category    string `json:"category" binding:"required"`
	Gender      string `json:"gender" binding:"required"`
	MinAge      int    `json:"min_age" binding:"required"`
	MaxAge      int    `json:"max_age" binding:"required"`
}

type UpdatePvlcMedFormulaRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Formula     string `json:"formula"`
	Category    string `json:"category"`
	Gender      string `json:"gender"`
	MinAge      int    `json:"min_age"`
	MaxAge      int    `json:"max_age"`
	IsActive    *bool  `json:"is_active"`
}

type PvlcMedCardFilter struct {
	Status          string `form:"status"`
	DateFrom        string `form:"date_from"`         // для created_at
	DateTo          string `form:"date_to"`           // для created_at
	UpdatedDateFrom string `form:"updated_date_from"` // для updated_at
	UpdatedDateTo   string `form:"updated_date_to"`   // для updated_at
}

type PvlcMedFormulaFilter struct {
	Category string `form:"category"`
	Gender   string `form:"gender"`
	MinAge   int    `form:"min_age"`
	MaxAge   int    `form:"max_age"`
	Active   *bool  `form:"active"`
}

type UpdateMedMmPvlcCalculationRequest struct {
	InputHeight float64 `json:"input_height" binding:"required"`
}

// ДОБАВЛЕНО: структура для API запроса обновления расчета
type UpdateMedMmPvlcCalculationAPIRequest struct {
	CardID           uint                              `json:"card_id" binding:"required"`
	PvlcMedFormulaID uint                              `json:"pvlc_med_formula_id" binding:"required"`
	Data             UpdateMedMmPvlcCalculationRequest `json:"data" binding:"required"`
}

// ДОБАВЛЕНО: структура для API запроса удаления расчета
type DeleteMedMmPvlcCalculationRequest struct {
	CardID           uint `json:"card_id" binding:"required"`
	PvlcMedFormulaID uint `json:"pvlc_med_formula_id" binding:"required"`
}

type MedUserRegistrationRequest struct {
	Login       string `json:"login" binding:"required"`
	Password    string `json:"password" binding:"required"`
	IsModerator bool   `json:"is_moderator"`
}

type UpdateMedUserRequest struct {
	Password string `json:"password"`
}

// ДОБАВЛЕНО: структура для API запроса входа (старый endpoint)
type LoginMedUserRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// UpdatePvlcMedCardRequest - запрос на обновление заявки
type UpdatePvlcMedCardRequest struct {
	PatientName string `json:"patient_name"`
	DoctorName  string `json:"doctor_name"`
}

// CompletePvlcMedCardRequest - запрос на завершение заявки
type CompletePvlcMedCardRequest struct {
	Action string `json:"action" binding:"required"` // "complete" или "reject"
}

// ДОБАВЛЕНО: структура для API запроса выхода (старый endpoint)
type LogoutMedUserRequest struct {
	// Пустая структура, так как запрос не требует тела
}

// ДОБАВЛЕНО: структура для проверки существования заявки
type CheckPvlcMedCardExistsRequest struct {
	CardID uint `json:"card_id" binding:"required"`
}

// ==================== ДОБАВЛЯЕМ НОВУЮ СТРУКТУРУ ====================
// Для вызова Django сервиса (необязательно, но полезно)

type AsyncCalculationRequest struct {
	CardID       uint              `json:"card_id" binding:"required"`
	Calculations []CalculationData `json:"calculations"`
}

type CalculationData struct {
	FormulaID   uint    `json:"formula_id"`
	Formula     string  `json:"formula"`
	InputHeight float64 `json:"input_height"`
	Title       string  `json:"title"`
}
