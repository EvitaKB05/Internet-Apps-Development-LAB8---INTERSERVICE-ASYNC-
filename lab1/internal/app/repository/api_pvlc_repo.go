package repository

import (
	"context"
	"fmt"
	"lab1/internal/app/ds"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/sirupsen/logrus"
)

// ==================== МЕТОДЫ ДЛЯ API ФОРМУЛ ДЖЕЛ ====================

// GetPvlcMedFormulasWithFilter - получение формул с фильтрацией для API (бывший GetCalculationsWithFilter)
func (r *Repository) GetPvlcMedFormulasWithFilter(filter ds.PvlcMedFormulaFilter) ([]ds.PvlcMedFormula, error) {
	var formulas []ds.PvlcMedFormula
	query := r.db.Model(&ds.PvlcMedFormula{})

	if filter.Category != "" {
		query = query.Where("category = ?", filter.Category)
	}
	if filter.Gender != "" {
		query = query.Where("gender = ?", filter.Gender)
	}
	if filter.MinAge > 0 {
		query = query.Where("min_age >= ?", filter.MinAge)
	}
	if filter.MaxAge > 0 {
		query = query.Where("max_age <= ?", filter.MaxAge)
	}
	if filter.Active != nil {
		query = query.Where("is_active = ?", *filter.Active)
	}

	err := query.Find(&formulas).Error
	return formulas, err
}

// GetPvlcMedFormulaByID - получение формулы по ID для API (бывший GetCalculationByID)
func (r *Repository) GetPvlcMedFormulaByID(id uint) (ds.PvlcMedFormula, error) {
	var formula ds.PvlcMedFormula
	err := r.db.First(&formula, id).Error
	return formula, err
}

// CreatePvlcMedFormula - создание формулы для API (бывший CreateCalculation)
func (r *Repository) CreatePvlcMedFormula(formula *ds.PvlcMedFormula) error {
	return r.db.Create(formula).Error
}

// UpdatePvlcMedFormula - обновление формулы для API (бывший UpdateCalculation)
func (r *Repository) UpdatePvlcMedFormula(formula *ds.PvlcMedFormula) error {
	return r.db.Save(formula).Error
}

// DeletePvlcMedFormula - удаление формулы для API (бывший DeleteCalculation)
func (r *Repository) DeletePvlcMedFormula(id uint) error {
	return r.db.Delete(&ds.PvlcMedFormula{}, id).Error
}

// ==================== МЕТОДЫ ДЛЯ API МЕДИЦИНСКИХ КАРТ ====================

// GetPvlcMedCardsWithFilter - получение медкарт с фильтрацией для API (бывший GetMedicalCardsWithFilter)
func (r *Repository) GetPvlcMedCardsWithFilter(filter ds.PvlcMedCardFilter) ([]ds.PvlcMedCard, error) {
	var cards []ds.PvlcMedCard
	query := r.db.Where("status != ? AND status != ?",
		ds.PvlcMedCardStatusDeleted, ds.PvlcMedCardStatusDraft)

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	// Фильтрация по created_at
	if filter.DateFrom != "" {
		if dateFrom, err := time.Parse("2006-01-02", filter.DateFrom); err == nil {
			query = query.Where("created_at >= ?", dateFrom)
		}
	}
	if filter.DateTo != "" {
		if dateTo, err := time.Parse("2006-01-02", filter.DateTo); err == nil {
			query = query.Where("created_at <= ?", dateTo.AddDate(0, 0, 1))
		}
	}
	// Фильтрация по updated_at (ДОБАВИТЬ)
	if filter.UpdatedDateFrom != "" {
		if dateFrom, err := time.Parse("2006-01-02", filter.UpdatedDateFrom); err == nil {
			query = query.Where("updated_at >= ?", dateFrom)
		}
	}
	if filter.UpdatedDateTo != "" {
		if dateTo, err := time.Parse("2006-01-02", filter.UpdatedDateTo); err == nil {
			query = query.Where("updated_at <= ?", dateTo.AddDate(0, 0, 1))
		}
	}
	err := query.Preload("Moderator").Find(&cards).Error
	return cards, err
}

// GetPvlcMedCardByID - получение медкарты по ID для API (бывший GetMedicalCardByID)
func (r *Repository) GetPvlcMedCardByID(id uint) (ds.PvlcMedCard, error) {
	var card ds.PvlcMedCard
	err := r.db.Preload("Moderator").First(&card, id).Error
	return card, err
}

// UpdatePvlcMedCard - обновление медкарты для API (бывший UpdateMedicalCard)
func (r *Repository) UpdatePvlcMedCard(card *ds.PvlcMedCard) error {
	return r.db.Save(card).Error
}

// GetDraftPvlcMedCardByUserID - получение черновика по ID пользователя для API (бывший GetDraftCardByUserID)
func (r *Repository) GetDraftPvlcMedCardByUserID(userID uint) (*ds.PvlcMedCard, error) {
	var card ds.PvlcMedCard
	err := r.db.Where("status = ?", ds.PvlcMedCardStatusDraft).First(&card).Error
	if err != nil {
		return nil, err
	}
	return &card, nil
}

// GetPvlcMedFormulasCountByCardID - количество формул в медкарте для API (бывший GetCalculationsCountByCardID)
func (r *Repository) GetPvlcMedFormulasCountByCardID(cardID uint) (int, error) {
	var count int64
	err := r.db.Model(&ds.MedMmPvlcCalculation{}).Where("pvlc_med_card_id = ?", cardID).Count(&count).Error
	return int(count), err
}

// GetMedMmPvlcCalculationsByCardID - получение расчетов медкарты для API (бывший GetCardCalculationsByCardID)
func (r *Repository) GetMedMmPvlcCalculationsByCardID(cardID uint) ([]ds.MedMmPvlcCalculation, error) {
	var calculations []ds.MedMmPvlcCalculation
	err := r.db.Where("pvlc_med_card_id = ?", cardID).
		Preload("PvlcMedFormula").
		Find(&calculations).Error
	return calculations, err
}

// DeleteMedMmPvlcCalculation - удаление расчета из медкарты для API (бывший DeleteCardCalculation)
func (r *Repository) DeleteMedMmPvlcCalculation(cardID, formulaID uint) error {
	return r.db.Where("pvlc_med_card_id = ? AND pvlc_med_formula_id = ?", cardID, formulaID).
		Delete(&ds.MedMmPvlcCalculation{}).Error
}

// UpdateMedMmPvlcCalculation - обновление расчета в медкарте для API (бывший UpdateCardCalculation)
func (r *Repository) UpdateMedMmPvlcCalculation(cardID, formulaID uint, inputHeight float64) error {
	return r.db.Model(&ds.MedMmPvlcCalculation{}).
		Where("pvlc_med_card_id = ? AND pvlc_med_formula_id = ?", cardID, formulaID).
		Update("input_height", inputHeight).Error
}

// ==================== МЕТОДЫ ДЛЯ РАСЧЕТА ДЖЕЛ (API) ====================

// CalculateTotalDjel - вычисление общего ДЖЕЛ для медкарты для API (без изменений)
func (r *Repository) CalculateTotalDjel(cardID uint) (float64, error) {
	var calculations []ds.MedMmPvlcCalculation
	err := r.db.Where("pvlc_med_card_id = ?", cardID).
		Preload("PvlcMedFormula").
		Find(&calculations).Error
	if err != nil {
		return 0, err
	}

	total := 0.0
	for _, cc := range calculations {
		if cc.InputHeight > 0 {
			// РЕАЛЬНЫЙ РАСЧЕТ ПО ФОРМУЛЕ
			result := r.calculateDjelByFormula(cc.PvlcMedFormula.Formula, cc.InputHeight)
			cc.FinalResult = result
			total += result

			// Сохраняем результат расчета
			r.db.Save(&cc)
		}
	}

	return total, nil
}

// calculateDjelByFormula - реальный расчет ДЖЕЛ по формуле для API (без изменений)
func (r *Repository) calculateDjelByFormula(formula string, height float64) float64 {
	// Определяем средний возраст на основе формулы
	age := r.getAgeByFormula(formula)

	// Детальный парсинг формул с использованием среднего возраста
	switch {
	// Мальчики 4-7 лет: ДЖЕЛ (л) = (0.043 × Рост) - (0.015 × Возраст) - 2.89
	case strings.Contains(formula, "2.89"):
		return (0.043 * height) - (0.015 * age) - 2.89

	// Девочки 4-7 лет: ДЖЕЛ (л) = (0.037 × Рост) - (0.012 × Возраст) - 2.54
	case strings.Contains(formula, "2.54"):
		return (0.037 * height) - (0.012 * age) - 2.54

	// Мальчики 8-12 лет: ДЖЕЛ (л) = (0.052 × Рост) - (0.022 × Возраст) - 4.60
	case strings.Contains(formula, "4.60"):
		return (0.052 * height) - (0.022 * age) - 4.60

	// Девочки 8-12 лет: ДЖЕЛ (л) = (0.041 × Рост) - (0.018 × Возраст) - 3.70
	case strings.Contains(formula, "3.70"):
		return (0.041 * height) - (0.018 * age) - 3.70

	// Юноши 13-17 лет: ДЖЕЛ (л) = (0.052 × Рост) - (0.022 × Возраст) - 4.20
	case strings.Contains(formula, "4.20"):
		return (0.052 * height) - (0.022 * age) - 4.20

	// Девушки 13-17 лет: ДЖЕЛ (л) = (0.041 × Рост) - (0.018 × Возраст) - 3.20
	case strings.Contains(formula, "3.20"):
		return (0.041 * height) - (0.018 * age) - 3.20

	// Мужчины 18-60 лет: ДЖЕЛ (л) = (0.052 × Рост) - (0.022 × Возраст) - 3.60
	case strings.Contains(formula, "3.60"):
		return (0.052 * height) - (0.022 * age) - 3.60

	// Женщины 18-60 лет: ДЖЕЛ (л) = (0.041 × Рост) - (0.018 × Возраст) - 2.69
	case strings.Contains(formula, "2.69"):
		return (0.041 * height) - (0.018 * age) - 2.69

	// Пожилые 60+ лет: ДЖЕЛ (л) = (0.044 × Рост) - (0.024 × Возраст) - 2.86
	case strings.Contains(formula, "2.86"):
		return (0.044 * height) - (0.024 * age) - 2.86

	default:
		fmt.Printf("Не удалось распознать формулу: %s\n", formula)
		return 0.0
	}
}

// getAgeByFormula определяет средний возраст для каждой возрастной категории
func (r *Repository) getAgeByFormula(formula string) float64 {
	// Анализируем формулу для определения возрастной категории
	switch {
	// Дети 4-7 лет
	case strings.Contains(formula, "4-7"):
		return 5.5 // средний возраст между 4 и 7 годами

	// Дети 8-12 лет
	case strings.Contains(formula, "8-12"):
		return 10.0 // средний возраст между 8 и 12 годами

	// Подростки 13-17 лет
	case strings.Contains(formula, "13-17"):
		return 15.0 // средний возраст между 13 и 17 годами

	// Взрослые 18-60 лет
	case strings.Contains(formula, "18-60"):
		return 39.0 // средний возраст между 18 и 60 годами

	// Пожилые 60+ лет
	case strings.Contains(formula, "60+"):
		return 75.0 // средний возраст для пожилых (60-90 лет)

	// Резервные проверки по константам формул
	case strings.Contains(formula, "2.89"), strings.Contains(formula, "2.54"):
		return 5.5 // 4-7 лет

	case strings.Contains(formula, "4.60"), strings.Contains(formula, "3.70"):
		return 10.0 // 8-12 лет

	case strings.Contains(formula, "4.20"), strings.Contains(formula, "3.20"):
		return 15.0 // 13-17 лет

	case strings.Contains(formula, "3.60"), strings.Contains(formula, "2.69"):
		return 39.0 // 18-60 лет

	case strings.Contains(formula, "2.86"):
		return 75.0 // 60+ лет

	default:
		fmt.Printf("Не удалось определить возраст для формулы: %s\n", formula)
		return 25.0 // значение по умолчанию
	}
}

// ==================== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ (API) ====================

// GetMedUserByID - получение пользователя по ID для API (бывший GetUserByID)
func (r *Repository) GetMedUserByID(id uint) (ds.MedUser, error) {
	var user ds.MedUser
	err := r.db.First(&user, id).Error
	return user, err
}

// GetMedUserByLogin - получение пользователя по логину для API (бывший GetUserByLogin)
func (r *Repository) GetMedUserByLogin(login string) (*ds.MedUser, error) {
	var user ds.MedUser
	err := r.db.Where("login = ?", login).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateMedUser - создание пользователя для API (бывший CreateUser)
func (r *Repository) CreateMedUser(user *ds.MedUser) error {
	return r.db.Create(user).Error
}

// UpdateMedUser - обновление пользователя для API (бывший UpdateUser)
func (r *Repository) UpdateMedUser(user *ds.MedUser) error {
	return r.db.Save(user).Error
}

// ==================== МЕТОДЫ ДЛЯ MINIO (API) ====================

// UploadImageToMinIO - загрузка изображения в MinIO для API (без изменений)
func (r *Repository) UploadImageToMinIO(file *multipart.FileHeader, formulaID uint) (string, error) {
	// Создаем клиент MinIO
	minioClient, err := minio.New("localhost:9000", &minio.Options{
		Creds:  credentials.NewStaticV4("minio", "minio124", ""),
		Secure: false,
	})
	if err != nil {
		return "", err
	}

	// Открываем файл
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Генерируем имя файла
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("pvlc_med_formula_%d%s", formulaID, ext)

	// Загружаем в MinIO
	_, err = minioClient.PutObject(context.Background(), "pics", filename, src, file.Size, minio.PutObjectOptions{
		ContentType: "image/" + strings.TrimPrefix(ext, "."),
	})
	if err != nil {
		return "", err
	}

	return filename, nil
}

// DeleteImageFromMinIO - удаление изображения из MinIO для API (без изменений)
func (r *Repository) DeleteImageFromMinIO(imageURL string) error {
	minioClient, err := minio.New("localhost:9000", &minio.Options{
		Creds:  credentials.NewStaticV4("minio", "minio124", ""),
		Secure: false,
	})
	if err != nil {
		return err
	}

	err = minioClient.RemoveObject(context.Background(), "pics", imageURL, minio.RemoveObjectOptions{})
	return err
}

// InitMinIOBucket - инициализация MinIO bucket для API (без изменений)
func (r *Repository) InitMinIOBucket() error {
	minioClient, err := minio.New("localhost:9000", &minio.Options{
		Creds:  credentials.NewStaticV4("minio", "minio124", ""),
		Secure: false,
	})
	if err != nil {
		return fmt.Errorf("failed to create MinIO client: %v", err)
	}

	exists, err := minioClient.BucketExists(context.Background(), "pics")
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %v", err)
	}

	if !exists {
		err = minioClient.MakeBucket(context.Background(), "pics", minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %v", err)
		}
		fmt.Println("MinIO bucket 'pics' created successfully")
	} else {
		fmt.Println("MinIO bucket 'pics' already exists")
	}
	return nil
}

// ==================== НОВЫЕ МЕТОДЫ ДЛЯ АСИНХРОННЫХ ВЫЧИСЛЕНИЙ ====================

// ==================== ОБНОВЛЯЕМ МЕТОД ДЛЯ АСИНХРОННЫХ ВЫЧИСЛЕНИЙ ====================
// ==================== ОБНОВЛЯЕМ МЕТОД ДЛЯ АСИНХРОННЫХ ВЫЧИСЛЕНИЙ ====================
// ==================== УПРОЩЕННЫЙ МЕТОД ====================
// SimpleUpdatePvlcMedCardAsyncResult - простая версия без сложных транзакций
func (r *Repository) SimpleUpdatePvlcMedCardAsyncResult(cardID uint, totalResult float64, calculatedCount int, individualResults []ds.IndividualResult) error {
	// 1. Обновляем основную заявку
	err := r.db.Model(&ds.PvlcMedCard{}).
		Where("id = ?", cardID).
		Updates(map[string]interface{}{
			"total_result":     totalResult,
			"calculated_count": calculatedCount,
			"async_calculated": true,
			"updated_at":       time.Now(),
		}).Error

	if err != nil {
		logrus.Errorf("❌ Простая ошибка обновления заявки #%d: %v", cardID, err)
		return err
	}

	logrus.Infof("✅ Заявка #%d просто обновлена: TotalResult=%.2f", cardID, totalResult)

	// 2. Обновляем индивидуальные результаты
	if len(individualResults) > 0 {
		for _, res := range individualResults {
			if res.FormulaID > 0 {
				// Игнорируем ошибки для простоты
				r.db.Model(&ds.MedMmPvlcCalculation{}).
					Where("pvlc_med_card_id = ? AND pvlc_med_formula_id = ?",
						cardID, res.FormulaID).
					Update("final_result", res.IndividualResult)
			}
		}
	}

	return nil
}

// ==================== ИСПРАВЛЯЕМ СУЩЕСТВУЮЩИЙ МЕТОД ====================
// GetPvlcMedCardCalculationsData получает данные расчетов для передачи в асинхронный сервис
// В реальной системе эти данные отправлялись бы в Django сервис
func (r *Repository) GetPvlcMedCardCalculationsData(cardID uint) ([]map[string]interface{}, error) {
	// Получаем все расчеты для этой заявки
	var calculations []ds.MedMmPvlcCalculation
	err := r.db.Where("pvlc_med_card_id = ?", cardID).
		Preload("PvlcMedFormula"). // Загружаем связанные формулы
		Find(&calculations).Error

	if err != nil {
		return nil, err
	}

	// Преобразуем в удобный формат для отправки
	var result []map[string]interface{}
	for _, calc := range calculations {
		result = append(result, map[string]interface{}{
			"formula_id":   calc.PvlcMedFormulaID,
			"formula":      calc.PvlcMedFormula.Formula,
			"input_height": calc.InputHeight,
			"title":        calc.PvlcMedFormula.Title,
			"category":     calc.PvlcMedFormula.Category,
			"gender":       calc.PvlcMedFormula.Gender,
		})
	}

	return result, nil
}

// ==================== ДОБАВЛЯЕМ НОВЫЙ МЕТОД ====================
// SendToDjangoService отправляет запрос в Django сервис для асинхронного расчета
func (r *Repository) SendToDjangoService(cardID uint, calculations []map[string]interface{}) error {
	// Этот метод теперь вызывается напрямую из med_cards_methods.go
	// Оставляем для совместимости, но основная логика уже в обработчике
	logrus.Infof("📤 Отправка данных для асинхронного расчета в Django (заявка #%d)", cardID)
	logrus.Infof("   Количество расчетов: %d", len(calculations))
	return nil
}
