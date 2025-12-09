package repository

import (
	"lab1/internal/app/ds"
	"lab1/internal/app/dsn"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

// ==================== ДОБАВЛЯЕМ НОВЫЙ ПУБЛИЧНЫЙ МЕТОД ====================
// GetDB возвращает доступ к gorm.DB (для использования в API)
func (r *Repository) GetDB() *gorm.DB {
	return r.db
}
func NewRepository() (*Repository, error) {
	_ = godotenv.Load()
	dsnString := dsn.FromEnv()
	db, err := gorm.Open(postgres.Open(dsnString), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return &Repository{db: db}, nil
}

// ==================== МЕТОДЫ ДЛЯ HTML ИНТЕРФЕЙСА ====================

// GetActivePvlcMedFormulas - гет активных формул ДЖЕЛ для HTML (бывший GetServices)
func (r *Repository) GetActivePvlcMedFormulas() ([]ds.PvlcMedFormula, error) {
	var formulas []ds.PvlcMedFormula
	err := r.db.Where("is_active = ?", true).Find(&formulas).Error
	if err != nil {
		return nil, err
	}
	return formulas, nil
}

// GetPvlcMedFormulasByTitle - поиск формул по названию для HTML (бывший GetServicesByTitle)
func (r *Repository) GetPvlcMedFormulasByTitle(title string) ([]ds.PvlcMedFormula, error) {
	var formulas []ds.PvlcMedFormula
	err := r.db.Where("is_active = ? AND title ILIKE ?", true, "%"+title+"%").Find(&formulas).Error
	if err != nil {
		return nil, err
	}
	return formulas, nil
}

// GetPvlcMedFormulaByIDForHTML - гет формулы по ID для HTML интерфейса (бывший GetService)
func (r *Repository) GetPvlcMedFormulaByIDForHTML(id int) (ds.PvlcMedFormula, error) {
	var formula ds.PvlcMedFormula
	err := r.db.Where("is_active = ? AND id = ?", true, id).First(&formula).Error
	if err != nil {
		return ds.PvlcMedFormula{}, err
	}
	return formula, nil
}

// ==================== МЕТОДЫ ДЛЯ МЕДИЦИНСКИХ КАРТ (HTML) ====================

// GetOrCreateDraftPvlcMedCard - находим или создаем черновик медкарты для HTML (бывший GetOrCreateDraftCard)
func (r *Repository) GetOrCreateDraftPvlcMedCard(userID uint) (*ds.PvlcMedCard, error) {
	var card ds.PvlcMedCard

	// пытаемся найти существующий черновик
	err := r.db.Where("status = ?", ds.PvlcMedCardStatusDraft).First(&card).Error

	if err != nil {
		// если черновика нет - создаем новый
		card = ds.PvlcMedCard{
			Status:      ds.PvlcMedCardStatusDraft,
			PatientName: "Врач",        // временное значение
			DoctorName:  "Иванов И.И.", // значение по умолчанию
		}

		err = r.db.Create(&card).Error
		if err != nil {
			return nil, err
		}
	}

	return &card, nil
}

// GetDraftPvlcMedCardID - получаем ID черновика медкарты для HTML (бывший GetDraftCardID)
func (r *Repository) GetDraftPvlcMedCardID() (uint, error) {
	var card ds.PvlcMedCard
	err := r.db.Where("status = ?", ds.PvlcMedCardStatusDraft).First(&card).Error
	if err != nil {
		return 0, err
	}
	return card.ID, nil
}

// CheckPvlcMedCardExists - проверяем существование медкарты для HTML (бывший CheckCardExists)
func (r *Repository) CheckPvlcMedCardExists(cardID uint) (bool, error) {
	var card ds.PvlcMedCard
	err := r.db.Where("id = ? AND status != ?", cardID, ds.PvlcMedCardStatusDeleted).First(&card).Error
	if err != nil {
		// если карта не найдена или удалена - возвращаем false
		return false, nil
	}
	return true, nil
}

// ==================== МЕТОДЫ ДЛЯ РАСЧЕТОВ В КАРТЕ (HTML) ====================

// AddPvlcMedFormulaToCard - добавить формулу в медкарту для HTML (бывший AddCalculationToCard)
func (r *Repository) AddPvlcMedFormulaToCard(cardID uint, formulaID uint) error {
	// проверяем дубликаты
	var existingLink ds.MedMmPvlcCalculation
	err := r.db.Where("pvlc_med_card_id = ? AND pvlc_med_formula_id = ?", cardID, formulaID).First(&existingLink).Error

	// не добавляем если есть дубликат
	if err == nil {
		return nil
	}

	// новая связь
	link := ds.MedMmPvlcCalculation{
		PvlcMedCardID:    cardID,
		PvlcMedFormulaID: formulaID,
		InputHeight:      0, // пока 0
		FinalResult:      0, // пока 0
	}

	return r.db.Create(&link).Error
}

// GetPvlcMedFormulasCount - гет кол-во формул в корзинке для HTML (бывший GetCalculationsCount)
func (r *Repository) GetPvlcMedFormulasCount() (int, error) {
	var count int64

	// найти черновик
	var card ds.PvlcMedCard
	err := r.db.Where("status = ?", ds.PvlcMedCardStatusDraft).First(&card).Error
	if err != nil {
		// нет черновика - 0
		return 0, nil
	}

	// считаем связанные формулы
	err = r.db.Model(&ds.MedMmPvlcCalculation{}).Where("pvlc_med_card_id = ?", card.ID).Count(&count).Error
	if err != nil {
		return 0, err
	}

	return int(count), nil
}

// GetPvlcMedFormulasInCard - гет формул в карте для HTML (старый метод для обратной совместимости) (бывший GetCalculation)
func (r *Repository) GetPvlcMedFormulasInCard() ([]ds.PvlcMedFormula, error) {
	// найти черновик
	var card ds.PvlcMedCard
	err := r.db.Where("status = ?", ds.PvlcMedCardStatusDraft).First(&card).Error
	if err != nil {
		// пустой массив если нет черновика
		return []ds.PvlcMedFormula{}, nil
	}

	// получаем все формулы, связанные с этой картой
	var formulas []ds.PvlcMedFormula
	err = r.db.Table("pvlc_med_formulas").
		Joins("JOIN med_mm_pvlc_calculations ON pvlc_med_formulas.id = med_mm_pvlc_calculations.pvlc_med_formula_id").
		Where("med_mm_pvlc_calculations.pvlc_med_card_id = ?", card.ID).
		Find(&formulas).Error

	if err != nil {
		return nil, err
	}

	return formulas, nil
}

// GetPvlcMedFormulasByCardIDForHTML - гет формул по ID карты для HTML (бывший GetCalculationByCardID)
func (r *Repository) GetPvlcMedFormulasByCardIDForHTML(cardID uint) ([]ds.PvlcMedFormula, error) {
	// проверяем существование карты
	var card ds.PvlcMedCard
	err := r.db.Where("id = ? AND status = ?", cardID, ds.PvlcMedCardStatusDraft).First(&card).Error
	if err != nil {
		// карта не найдена или не черновик
		return []ds.PvlcMedFormula{}, nil
	}

	// получаем все формулы, связанные с этой картой
	var formulas []ds.PvlcMedFormula
	err = r.db.Table("pvlc_med_formulas").
		Joins("JOIN med_mm_pvlc_calculations ON pvlc_med_formulas.id = med_mm_pvlc_calculations.pvlc_med_formula_id").
		Where("med_mm_pvlc_calculations.pvlc_med_card_id = ?", cardID).
		Find(&formulas).Error

	if err != nil {
		return nil, err
	}

	return formulas, nil
}

// GetPvlcMedFormulasWithHeight - формулы с параметром роста для HTML (бывший GetCalculationWithHeight)
func (r *Repository) GetPvlcMedFormulasWithHeight() ([]ds.PvlcMedFormulaWithHeight, error) {
	// найти черновик
	var card ds.PvlcMedCard
	err := r.db.Where("status = ?", ds.PvlcMedCardStatusDraft).First(&card).Error
	if err != nil {
		// нет черновика - возвращаем пустой массив
		return []ds.PvlcMedFormulaWithHeight{}, nil
	}

	// гет формулы с ростом
	var formulas []ds.PvlcMedFormulaWithHeight
	err = r.db.Table("pvlc_med_formulas f").
		Select("f.*, mmc.input_height").
		Joins("JOIN med_mm_pvlc_calculations mmc ON f.id = mmc.pvlc_med_formula_id").
		Where("mmc.pvlc_med_card_id = ?", card.ID).
		Scan(&formulas).Error

	if err != nil {
		return nil, err
	}

	return formulas, nil
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ (HTML) ====================

// GetAvailableDoctors - получаем список доступных врачей для HTML (без изменений)
func (r *Repository) GetAvailableDoctors() []string {
	// возвращаем список врачей (можно потом брать из отдельной таблицы)
	return []string{
		"Иванов Иван Иванович",
		"Петрова Анна Сергеевна",
		"Сидоров Алексей Владимирович",
	}
}

// GetCurrentDoctor - получаем текущего врача для черновика для HTML (без изменений)
func (r *Repository) GetCurrentDoctor() (string, error) {
	var card ds.PvlcMedCard
	err := r.db.Where("status = ?", ds.PvlcMedCardStatusDraft).First(&card).Error
	if err != nil {
		// если черновика нет - возвращаем значение по умолчанию
		return "Иванов И.И.", nil
	}
	return card.DoctorName, nil
}

// DeleteDraftPvlcMedCard - удаляем черновик медкарты для HTML (бывший DeleteDraftCard)
func (r *Repository) DeleteDraftPvlcMedCard() error {
	return r.db.Exec("UPDATE pvlc_med_cards SET status = ? WHERE status = ?",
		ds.PvlcMedCardStatusDeleted, ds.PvlcMedCardStatusDraft).Error
}
