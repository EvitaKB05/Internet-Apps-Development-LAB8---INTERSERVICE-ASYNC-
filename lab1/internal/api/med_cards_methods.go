// internal/api/med_cards_methods.go
package api

import (
	"bytes"
	"encoding/json"
	"io"

	"lab1/internal/app/ds"
	"lab1/internal/auth"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Домен: Медицинские карты (PvlcMedCards)

// GetCartIcon godoc
// @Summary Получение иконки корзины
// @Description Возвращает информацию о корзине пользователя (количество items). Для неавторизованных возвращает пустую корзину.
// @Tags med_card
// @Produce json
// @Success 200 {object} ds.CartIconResponse
// @Router /api/med_card/icon [get]
func (a *API) GetCartIcon(c *gin.Context) {
	// Изменяем логику: если пользователь не авторизован, возвращаем пустую корзину
	claims := auth.GetUserFromContext(c)

	if claims == nil {
		// Для неавторизованных пользователей возвращаем пустую корзину
		a.successResponse(c, ds.CartIconResponse{
			MedCardID:    0,
			MedItemCount: 0,
		})
		return
	}

	// Получаем черновик для текущего пользователя (старая логика для авторизованных)
	card, err := a.repo.GetDraftPvlcMedCardByUserID(claims.UserID)
	if err != nil {
		// Если черновика нет - возвращаем пустую корзину
		a.successResponse(c, ds.CartIconResponse{
			MedCardID:    0,
			MedItemCount: 0,
		})
		return
	}

	// Считаем количество формул в заявке
	count, err := a.repo.GetPvlcMedFormulasCountByCardID(card.ID)
	if err != nil {
		logrus.Error("Error getting pvlc med formulas count: ", err)
		count = 0
	}

	a.successResponse(c, ds.CartIconResponse{
		MedCardID:    card.ID,
		MedItemCount: count,
	})
}

// GetPvlcMedCards godoc
// @Summary Получение списка заявок
// @Description Возвращает список заявок пользователя (для модераторов - все заявки)
// @Tags medical-cards
// @Produce json
// @Param status query string false "Фильтр по статусу"
// @Param date_from query string false "Фильтр по дате создания от (YYYY-MM-DD)"
// @Param date_to query string false "Фильтр по дате создания до (YYYY-MM-DD)"
// @Param updated_date_from query string false "Фильтр по дате обновления от (YYYY-MM-DD)"
// @Param updated_date_to query string false "Фильтр по дате обновления до (YYYY-MM-DD)"
// @Success 200 {array} ds.PvlcMedCardResponse
// @Failure 401 {object} map[string]string
// @Router /api/pvlc-med-cards [get]
// @Security BearerAuth
func (a *API) GetPvlcMedCards(c *gin.Context) {
	// Проверка аутентификации выполняется в middleware RequireAuth
	claims := auth.GetUserFromContext(c)
	if claims == nil {
		a.errorResponse(c, http.StatusUnauthorized, "Требуется аутентификация")
		return
	}

	var filter ds.PvlcMedCardFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		a.errorResponse(c, http.StatusBadRequest, "Неверные параметры фильтрации")
		return
	}
	// ДОБАВИТЬ ЛОГИРОВАНИЕ
	logrus.WithFields(logrus.Fields{
		"user_id":           claims.UserID,
		"is_moderator":      claims.IsModerator,
		"date_from":         filter.DateFrom,
		"date_to":           filter.DateTo,
		"updated_date_from": filter.UpdatedDateFrom,
		"updated_date_to":   filter.UpdatedDateTo,
		"status":            filter.Status,
	}).Info("Получение заявок с фильтрами")
	var cards []ds.PvlcMedCard
	var err error

	// РАЗДЕЛЕНИЕ ДОСТУПА ПО РОЛЯМ - ДОБАВЛЕНО ДЛЯ ЛР4
	if claims.IsModerator {
		// Модератор видит все заявки
		cards, err = a.repo.GetPvlcMedCardsForModerator(filter)
	} else {
		// Обычный пользователь видит только свои заявки
		cards, err = a.repo.GetPvlcMedCardsByUserID(claims.UserID, filter)
	}

	if err != nil {
		logrus.Error("Error getting pvlc med cards: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка получения заявок")
		return
	}

	// ИСПРАВЛЕНО: гарантируем возврат пустого массива вместо null
	response := make([]ds.PvlcMedCardResponse, 0)

	for _, card := range cards {
		cardResponse := ds.PvlcMedCardResponse{
			ID:          card.ID,
			Status:      card.Status,
			CreatedAt:   card.CreatedAt,
			UpdatedAt:   card.UpdatedAt,
			PatientName: card.PatientName,
			DoctorName:  card.DoctorName,
			TotalResult: card.TotalResult,

			// ==================== ДОБАВЛЯЕМ НОВЫЕ ПОЛЯ ====================
			// Для отображения прогресса асинхронных вычислений
			CalculatedCount: card.CalculatedCount,
			AsyncCalculated: card.AsyncCalculated,
		}
		// ==================== РАССЧИТЫВАЕМ ПРОГРЕСС ====================
		// Прогресс вычислений в процентах
		// calculated_count / общее_количество_формул * 100

		// В Go len() для nil slices возвращает 0, поэтому проверка на nil не нужна
		if len(card.Calculations) > 0 {
			totalFormulas := len(card.Calculations)
			// Рассчитываем прогресс
			progress := (float64(card.CalculatedCount) / float64(totalFormulas)) * 100
			cardResponse.CalculationProgress = progress

			logrus.Debugf("Заявка #%d: прогресс расчета = %.1f%% (%d/%d)",
				card.ID, progress, card.CalculatedCount, totalFormulas)
		}
		if card.FinalizedAt != nil {
			cardResponse.FinalizedAt = card.FinalizedAt
		}
		if card.CompletedAt != nil {
			cardResponse.CompletedAt = card.CompletedAt
		}

		// Получаем расчеты для этой заявки
		calculations, err := a.repo.GetMedMmPvlcCalculationsByCardID(card.ID)
		if err == nil {
			// ИСПРАВЛЕНО: гарантируем пустой массив вместо nil для MedCalculations
			cardResponse.MedCalculations = make([]ds.MedMmPvlcCalculationResponse, 0)
			for _, calc := range calculations {
				cardResponse.MedCalculations = append(cardResponse.MedCalculations, ds.MedMmPvlcCalculationResponse{
					PvlcMedFormulaID: calc.PvlcMedFormulaID,
					Title:            calc.PvlcMedFormula.Title,
					Description:      calc.PvlcMedFormula.Description,
					Formula:          calc.PvlcMedFormula.Formula,
					ImageURL:         calc.PvlcMedFormula.ImageURL,
					InputHeight:      calc.InputHeight,
					FinalResult:      calc.FinalResult,
				})
			}
		} else {
			// Если ошибка при получении расчетов, устанавливаем пустой массив
			cardResponse.MedCalculations = make([]ds.MedMmPvlcCalculationResponse, 0)
		}

		response = append(response, cardResponse)
	}

	a.successResponse(c, response)
}

// GetPvlcMedCard godoc
// @Summary Получение конкретной заявки
// @Description Возвращает информацию о конкретной заявке
// @Tags medical-cards
// @Produce json
// @Param id path int true "ID заявки"
// @Success 200 {object} ds.PvlcMedCardResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-cards/{id} [get]
// @Security BearerAuth
func (a *API) GetPvlcMedCard(c *gin.Context) {
	// Проверка аутентификации выполняется в middleware RequireAuth
	claims := auth.GetUserFromContext(c)
	if claims == nil {
		a.errorResponse(c, http.StatusUnauthorized, "Требуется аутентификация")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID заявки")
		return
	}

	card, err := a.repo.GetPvlcMedCardByID(uint(id))
	if err != nil {
		a.errorResponse(c, http.StatusNotFound, "Заявка не найдена")
		return
	}

	// ПРОВЕРКА ПРАВ ДОСТУПА - ДОБАВЛЕНО ДЛЯ ЛР4
	// Пользователь может смотреть только свои заявки, модератор - все
	if !claims.IsModerator && card.UserID != claims.UserID {
		a.errorResponse(c, http.StatusForbidden, "Доступ запрещен")
		return
	}

	// Не возвращаем удаленные заявки
	if card.Status == ds.PvlcMedCardStatusDeleted {
		a.errorResponse(c, http.StatusNotFound, "Заявка не найдена")
		return
	}

	response := ds.PvlcMedCardResponse{
		ID:          card.ID,
		Status:      card.Status,
		CreatedAt:   card.CreatedAt,
		UpdatedAt:   card.UpdatedAt, // ДОБАВИТЬ
		PatientName: card.PatientName,
		DoctorName:  card.DoctorName,
		TotalResult: card.TotalResult,
	}

	if card.FinalizedAt != nil {
		response.FinalizedAt = card.FinalizedAt
	}
	if card.CompletedAt != nil {
		response.CompletedAt = card.CompletedAt
	}

	// Получаем расчеты для этой заявки
	calculations, err := a.repo.GetMedMmPvlcCalculationsByCardID(card.ID)
	if err == nil {
		for _, calc := range calculations {
			response.MedCalculations = append(response.MedCalculations, ds.MedMmPvlcCalculationResponse{
				PvlcMedFormulaID: calc.PvlcMedFormulaID,
				Title:            calc.PvlcMedFormula.Title,
				Description:      calc.PvlcMedFormula.Description,
				Formula:          calc.PvlcMedFormula.Formula,
				ImageURL:         calc.PvlcMedFormula.ImageURL,
				InputHeight:      calc.InputHeight,
				FinalResult:      calc.FinalResult,
			})
		}
	}

	a.successResponse(c, response)
}

// UpdatePvlcMedCard godoc
// @Summary Обновление заявки
// @Description Обновляет поля заявки (только для владельца)
// @Tags medical-cards
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Param request body ds.UpdatePvlcMedCardRequest true "Данные для обновления"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-cards/{id} [put]
// @Security BearerAuth
func (a *API) UpdatePvlcMedCard(c *gin.Context) {
	// Проверка аутентификации выполняется в middleware RequireAuth
	claims := auth.GetUserFromContext(c)
	if claims == nil {
		a.errorResponse(c, http.StatusUnauthorized, "Требуется аутентификация")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID заявки")
		return
	}

	// ИСПРАВЛЕНО: используем именованную структуру вместо встроенной
	var request ds.UpdatePvlcMedCardRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		a.errorResponse(c, http.StatusBadRequest, "Неверные данные запроса")
		return
	}

	card, err := a.repo.GetPvlcMedCardByID(uint(id))
	if err != nil {
		a.errorResponse(c, http.StatusNotFound, "Заявка не найдена")
		return
	}

	// ПРОВЕРКА ПРАВ ДОСТУПА - ДОБАВЛЕНО ДЛЯ ЛР4
	// Только владелец может редактировать свою заявку
	if card.UserID != claims.UserID {
		a.errorResponse(c, http.StatusForbidden, "Доступ запрещен")
		return
	}

	// Можно менять только черновики
	if card.Status != ds.PvlcMedCardStatusDraft {
		a.errorResponse(c, http.StatusBadRequest, "Можно изменять только черновики")
		return
	}

	if request.PatientName != "" {
		card.PatientName = request.PatientName
	}
	if request.DoctorName != "" {
		card.DoctorName = request.DoctorName
	}

	if err := a.repo.UpdatePvlcMedCard(&card); err != nil {
		logrus.Error("Error updating pvlc med card: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка обновления заявки")
		return
	}

	a.successResponse(c, gin.H{"message": "Заявка успешно обновлена"})
}

// FinalizePvlcMedCard godoc
// @Summary Формирование заявки
// @Description Переводит заявку из статуса черновика в сформированную
// @Tags medical-cards
// @Produce json
// @Param id path int true "ID заявки"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-cards/{id}/form [put]
// @Security BearerAuth
func (a *API) FinalizePvlcMedCard(c *gin.Context) {
	// Проверка аутентификации выполняется в middleware RequireAuth
	claims := auth.GetUserFromContext(c)
	if claims == nil {
		a.errorResponse(c, http.StatusUnauthorized, "Требуется аутентификация")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID заявки")
		return
	}

	card, err := a.repo.GetPvlcMedCardByID(uint(id))
	if err != nil {
		a.errorResponse(c, http.StatusNotFound, "Заявка не найдена")
		return
	}

	// ПРОВЕРКА ПРАВ ДОСТУПА - ДОБАВЛЕНО ДЛЯ ЛР4
	// Только владелец может формировать свою заявку
	if card.UserID != claims.UserID {
		a.errorResponse(c, http.StatusForbidden, "Доступ запрещен")
		return
	}

	// Проверяем что заявка в статусе черновика
	if card.Status != ds.PvlcMedCardStatusDraft {
		a.errorResponse(c, http.StatusBadRequest, "Можно формировать только черновики")
		return
	}

	// Проверяем обязательные поля
	if card.PatientName == "" || card.DoctorName == "" {
		a.errorResponse(c, http.StatusBadRequest, "Заполните все обязательные поля (пациент, врач)")
		return
	}

	// Проверяем что есть расчеты
	count, err := a.repo.GetPvlcMedFormulasCountByCardID(card.ID)
	if err != nil || count == 0 {
		a.errorResponse(c, http.StatusBadRequest, "Добавьте хотя бы один расчет в заявку")
		return
	}

	// Меняем статус и устанавливаем дату формирования
	now := time.Now()
	card.Status = ds.PvlcMedCardStatusFormed
	card.FinalizedAt = &now

	if err := a.repo.UpdatePvlcMedCard(&card); err != nil {
		logrus.Error("Error finalizing pvlc med card: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка формирования заявки")
		return
	}

	a.successResponse(c, gin.H{"message": "Заявка успешно сформирована"})
}

// CompletePvlcMedCard godoc
// @Summary Завершение/отклонение заявки
// @Description Завершает или отклоняет заявку (только для модераторов)
// @Description При завершении запускает асинхронный расчет ДЖЕЛ в Django сервисе
// @Tags medical-cards
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Param request body ds.CompletePvlcMedCardRequest true "Действие: complete или reject"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-cards/{id}/complete [put]
// @Security BearerAuth
func (a *API) CompletePvlcMedCard(c *gin.Context) {
	// Проверка прав модератора выполняется в middleware RequireModerator
	claims := auth.GetUserFromContext(c)
	if claims == nil || !claims.IsModerator {
		a.errorResponse(c, http.StatusForbidden, "Требуются права модератора")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID заявки")
		return
	}

	var request ds.CompletePvlcMedCardRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		a.errorResponse(c, http.StatusBadRequest, "Неверные данные запроса")
		return
	}

	card, err := a.repo.GetPvlcMedCardByID(uint(id))
	if err != nil {
		a.errorResponse(c, http.StatusNotFound, "Заявка не найдена")
		return
	}

	// Проверяем что заявка в статусе сформирована
	if card.Status != ds.PvlcMedCardStatusFormed {
		a.errorResponse(c, http.StatusBadRequest, "Можно завершать/отклонять только сформированные заявки")
		return
	}

	now := time.Now()
	if request.Action == "complete" {
		// Меняем статус на "завершен"
		card.Status = ds.PvlcMedCardStatusCompleted

		// ==================== ИСПРАВЛЕНИЕ ДЛЯ ЛАБОРАТОРНОЙ №8 ====================
		// Вместо синхронного расчета ДЖЕЛ, запускаем асинхронный

		logrus.Infof("🚀 Запуск асинхронного расчета ДЖЕЛ для заявки #%d", card.ID)
		logrus.Infof("   Модератор: %s (ID: %d)", claims.Login, claims.UserID)

		// Устанавливаем начальные значения для отслеживания прогресса
		card.TotalResult = 0
		card.CalculatedCount = 0
		card.AsyncCalculated = false

		// Важно: нужно сохранить изменения ДО отправки в Django
		if err := a.repo.UpdatePvlcMedCard(&card); err != nil {
			logrus.Error("Error updating card for async calculation: ", err)
			a.errorResponse(c, http.StatusInternalServerError, "Ошибка подготовки асинхронного расчета")
			return
		}

		// ==================== ВАЖНОЕ ИСПРАВЛЕНИЕ: ВЫЗОВ DJANGO СЕРВИСА ====================
		// Запускаем асинхронный вызов Django сервиса в горутине
		go func() {
			// 1. Получаем данные расчетов для заявки
			calculationsData, err := a.repo.GetPvlcMedCardCalculationsData(card.ID)
			if err != nil {
				logrus.Errorf("❌ Ошибка получения данных расчетов для заявки #%d: %v", card.ID, err)
				return
			}

			// 2. Формируем запрос для Django
			djangoRequest := map[string]interface{}{
				"card_id":      card.ID,
				"calculations": calculationsData,
			}

			// 3. Отправляем запрос в Django сервис
			jsonData, err := json.Marshal(djangoRequest)
			if err != nil {
				logrus.Errorf("❌ Ошибка сериализации JSON для Django: %v", err)
				return
			}

			// Django сервис работает на порту 8001
			djangoURL := "http://localhost:8001/api/async-calculate/"

			logrus.Infof("📤 Отправка запроса в Django сервис: %s", djangoURL)
			logrus.Infof("   Данные: %s", string(jsonData))

			resp, err := http.Post(djangoURL, "application/json", bytes.NewBuffer(jsonData))
			if err != nil {
				logrus.Errorf("❌ Ошибка отправки в Django сервис: %v", err)
				return
			}
			defer resp.Body.Close()

			body, _ := io.ReadAll(resp.Body)
			logrus.Infof("📥 Ответ от Django сервиса: статус %d, тело: %s", resp.StatusCode, string(body))

			if resp.StatusCode != http.StatusOK {
				logrus.Errorf("❌ Django сервис вернул ошибку: статус %d", resp.StatusCode)
			} else {
				logrus.Infof("✅ Django сервис успешно принял заявку на расчет для заявки #%d", card.ID)
			}
		}()
		// ==================== КОНЕЦ ИСПРАВЛЕНИЯ ====================

	} else if request.Action == "reject" {
		// Просто отклоняем заявку
		card.Status = ds.PvlcMedCardStatusRejected
		logrus.Infof("📛 Заявка #%d отклонена модератором %s", card.ID, claims.Login)
	} else {
		a.errorResponse(c, http.StatusBadRequest, "Неверное действие. Используйте 'complete' или 'reject'")
		return
	}

	// Устанавливаем дату завершения и ID модератора
	card.CompletedAt = &now
	card.ModeratorID = &claims.UserID

	// Сохраняем изменения в БД
	if err := a.repo.UpdatePvlcMedCard(&card); err != nil {
		logrus.Error("Error completing pvlc med card: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка завершения заявки")
		return
	}

	// Возвращаем ответ
	responseData := gin.H{
		"message": "Заявка успешно обработана",
		"status":  card.Status,
	}

	// Если завершаем - добавляем информацию об асинхронном расчете
	if request.Action == "complete" {
		responseData["async_calc"] = true
		responseData["note"] = "Расчет ДЖЕЛ выполняется асинхронно. Обновите страницу через 5-10 секунд."
		responseData["total_result"] = 0
		responseData["calculated_count"] = 0

		// ==================== ДОБАВЛЯЕМ ИНФОРМАЦИЮ О DJANGO ====================
		responseData["django_service"] = "Запрос отправлен в Django сервис"
		responseData["django_url"] = "http://localhost:8001/api/async-calculate/"
		responseData["calculation_time"] = "5-10 секунд"
	}

	a.successResponse(c, responseData)
}

// DeletePvlcMedCard godoc
// @Summary Удаление заявки
// @Description Удаляет заявку (только черновики и только владельцем)
// @Tags medical-cards
// @Produce json
// @Param id path int true "ID заявки"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-cards/{id} [delete]
// @Security BearerAuth
func (a *API) DeletePvlcMedCard(c *gin.Context) {
	// Проверка аутентификации выполняется в middleware RequireAuth
	claims := auth.GetUserFromContext(c)
	if claims == nil {
		a.errorResponse(c, http.StatusUnauthorized, "Требуется аутентификация")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID заявки")
		return
	}

	card, err := a.repo.GetPvlcMedCardByID(uint(id))
	if err != nil {
		a.errorResponse(c, http.StatusNotFound, "Заявка не найдена")
		return
	}

	// ПРОВЕРКА ПРАВ ДОСТУПА - ДОБАВЛЕНО ДЛЯ ЛР4
	// Только владелец может удалять свою заявку
	if card.UserID != claims.UserID {
		a.errorResponse(c, http.StatusForbidden, "Доступ запрещен")
		return
	}

	// Удалять можно только черновики
	if card.Status != ds.PvlcMedCardStatusDraft {
		a.errorResponse(c, http.StatusBadRequest, "Можно удалять только черновики")
		return
	}

	card.Status = ds.PvlcMedCardStatusDeleted
	if err := a.repo.UpdatePvlcMedCard(&card); err != nil {
		logrus.Error("Error deleting pvlc med card: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка удаления заявки")
		return
	}

	a.successResponse(c, gin.H{"message": "Заявка успешно удалена"})
}
