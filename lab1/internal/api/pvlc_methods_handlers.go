// internal/api/pvlc_methods_handlers.go
package api

import (
	"lab1/internal/app/ds"
	"lab1/internal/app/repository"
	"lab1/internal/auth"
	"lab1/internal/redis"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// API - структура API с зависимостями
// ОБНОВЛЕНО ДЛЯ ЛАБОРАТОРНОЙ РАБОТЫ 4 - добавлено поле redis
type API struct {
	repo  *repository.Repository
	redis *redis.Client
}

// NewAPI создает новый экземпляр API
// ИСПРАВЛЕНО: добавляем параметр Redis
func NewAPI(repo *repository.Repository, redisClient *redis.Client) *API {
	return &API{
		repo:  repo,
		redis: redisClient,
	}
}

// Вспомогательные функции для ответов
func (a *API) successResponse(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"data": data,
	})
}

func (a *API) errorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{
		"error": message,
	})
}

// Домен: Формулы ДЖЕЛ (PvlcMedFormulas)

// GetPvlcMedFormulas godoc
// @Summary Получение списка формул
// @Description Возвращает список формул с возможностью фильтрации
// @Tags med_formulas
// @Produce json
// @Param category query string false "Фильтр по категории"
// @Param gender query string false "Фильтр по полу"
// @Param min_age query int false "Минимальный возраст"
// @Param max_age query int false "Максимальный возраст"
// @Param active query bool false "Активные формулы"
// @Success 200 {array} ds.PvlcMedFormulaResponse
// @Router /api/pvlc-med-formulas [get]
func (a *API) GetPvlcMedFormulas(c *gin.Context) {
	var filter ds.PvlcMedFormulaFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		a.errorResponse(c, http.StatusBadRequest, "Неверные параметры фильтрации")
		return
	}

	formulas, err := a.repo.GetPvlcMedFormulasWithFilter(filter)
	if err != nil {
		logrus.Error("Error getting pvlc med formulas: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка получения формул")
		return
	}

	var response []ds.PvlcMedFormulaResponse
	for _, formula := range formulas {
		response = append(response, ds.PvlcMedFormulaResponse{
			ID:          formula.ID,
			Title:       formula.Title,
			Description: formula.Description,
			Formula:     formula.Formula,
			ImageURL:    formula.ImageURL,
			Category:    formula.Category,
			Gender:      formula.Gender,
			MinAge:      formula.MinAge,
			MaxAge:      formula.MaxAge,
			IsActive:    formula.IsActive,
		})
	}

	a.successResponse(c, response)
}

// GetPvlcMedFormula godoc
// @Summary Получение конкретной формулы
// @Description Возвращает информацию о конкретной формуле ДЖЕЛ
// @Tags med_formulas
// @Produce json
// @Param id path int true "ID формулы"
// @Success 200 {object} ds.PvlcMedFormulaResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-formulas/{id} [get]
func (a *API) GetPvlcMedFormula(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID формулы")
		return
	}

	formula, err := a.repo.GetPvlcMedFormulaByID(uint(id))
	if err != nil {
		logrus.Error("Error getting pvlc med formula: ", err)
		a.errorResponse(c, http.StatusNotFound, "Формула не найдена")
		return
	}

	response := ds.PvlcMedFormulaResponse{
		ID:          formula.ID,
		Title:       formula.Title,
		Description: formula.Description,
		Formula:     formula.Formula,
		ImageURL:    formula.ImageURL,
		Category:    formula.Category,
		Gender:      formula.Gender,
		MinAge:      formula.MinAge,
		MaxAge:      formula.MaxAge,
		IsActive:    formula.IsActive,
	}

	a.successResponse(c, response)
}

// CreatePvlcMedFormula godoc
// @Summary Создание новой формулы
// @Description Создает новую формулу для расчета ДЖЕЛ (только для модераторов)
// @Tags med_formulas
// @Accept json
// @Produce json
// @Param request body ds.CreatePvlcMedFormulaRequest true "Данные формулы"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /api/pvlc-med-formulas [post]
// @Security BearerAuth
func (a *API) CreatePvlcMedFormula(c *gin.Context) {
	// Проверка прав выполняется в middleware RequireModerator
	var request ds.CreatePvlcMedFormulaRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		a.errorResponse(c, http.StatusBadRequest, "Неверные данные запроса")
		return
	}

	formula := ds.PvlcMedFormula{
		Title:       request.Title,
		Description: request.Description,
		Formula:     request.Formula,
		Category:    request.Category,
		Gender:      request.Gender,
		MinAge:      request.MinAge,
		MaxAge:      request.MaxAge,
		IsActive:    true,
	}

	if err := a.repo.CreatePvlcMedFormula(&formula); err != nil {
		logrus.Error("Error creating pvlc med formula: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка создания формулы")
		return
	}

	a.successResponse(c, gin.H{"id": formula.ID})
}

// UpdatePvlcMedFormula godoc
// @Summary Обновление формулы
// @Description Обновляет существующую формулу ДЖЕЛ (только для модераторов)
// @Tags med_formulas
// @Accept json
// @Produce json
// @Param id path int true "ID формулы"
// @Param request body ds.UpdatePvlcMedFormulaRequest true "Данные для обновления"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-formulas/{id} [put]
// @Security BearerAuth
func (a *API) UpdatePvlcMedFormula(c *gin.Context) {
	// Проверка прав выполняется в middleware RequireModerator
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID формулы")
		return
	}

	var request ds.UpdatePvlcMedFormulaRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		a.errorResponse(c, http.StatusBadRequest, "Неверные данные запроса")
		return
	}

	formula, err := a.repo.GetPvlcMedFormulaByID(uint(id))
	if err != nil {
		a.errorResponse(c, http.StatusNotFound, "Формула не найдена")
		return
	}

	// Обновляем только переданные поля
	if request.Title != "" {
		formula.Title = request.Title
	}
	if request.Description != "" {
		formula.Description = request.Description
	}
	if request.Formula != "" {
		formula.Formula = request.Formula
	}
	if request.Category != "" {
		formula.Category = request.Category
	}
	if request.Gender != "" {
		formula.Gender = request.Gender
	}
	if request.MinAge > 0 {
		formula.MinAge = request.MinAge
	}
	if request.MaxAge > 0 {
		formula.MaxAge = request.MaxAge
	}
	if request.IsActive != nil {
		formula.IsActive = *request.IsActive
	}

	if err := a.repo.UpdatePvlcMedFormula(&formula); err != nil {
		logrus.Error("Error updating pvlc med formula: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка обновления формулы")
		return
	}

	a.successResponse(c, gin.H{"message": "Формула успешно обновлена"})
}

// DeletePvlcMedFormula godoc
// @Summary Удаление формулы
// @Description Удаляет формулу ДЖЕЛ (только для модераторов)
// @Tags med_formulas
// @Produce json
// @Param id path int true "ID формулы"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-formulas/{id} [delete]
// @Security BearerAuth
func (a *API) DeletePvlcMedFormula(c *gin.Context) {
	// Проверка прав выполняется в middleware RequireModerator
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID формулы")
		return
	}

	// Получаем формулу для проверки существования и получения image_url
	formula, err := a.repo.GetPvlcMedFormulaByID(uint(id))
	if err != nil {
		a.errorResponse(c, http.StatusNotFound, "Формула не найдена")
		return
	}

	// Удаляем изображение из MinIO если оно есть
	if formula.ImageURL != "" {
		if err := a.repo.DeleteImageFromMinIO(formula.ImageURL); err != nil {
			logrus.Warn("Error deleting image from MinIO: ", err)
		}
	}

	// Удаляем формулу из БД
	if err := a.repo.DeletePvlcMedFormula(uint(id)); err != nil {
		logrus.Error("Error deleting pvlc med formula: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка удаления формулы")
		return
	}

	a.successResponse(c, gin.H{"message": "Формула успешно удалена"})
}

// UploadPvlcMedFormulaImage godoc
// @Summary Загрузка изображения для формулы
// @Description Загружает изображение для формулы ДЖЕЛ в MinIO (только для модераторов)
// @Tags med_formulas
// @Accept multipart/form-data
// @Produce json
// @Param id path int true "ID формулы"
// @Param image formData file true "Изображение формулы"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-formulas/{id}/image [post]
// @Security BearerAuth
func (a *API) UploadPvlcMedFormulaImage(c *gin.Context) {
	// Проверка прав выполняется в middleware RequireModerator
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID формулы")
		return
	}

	// Проверяем существование формулы
	formula, err := a.repo.GetPvlcMedFormulaByID(uint(id))
	if err != nil {
		a.errorResponse(c, http.StatusNotFound, "Формула не найдена")
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		a.errorResponse(c, http.StatusBadRequest, "Файл изображения обязателен")
		return
	}

	// Загружаем изображение в MinIO
	imageURL, err := a.repo.UploadImageToMinIO(file, uint(id))
	if err != nil {
		logrus.Error("Error uploading image to MinIO: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка загрузки изображения")
		return
	}

	// Удаляем старое изображение если было
	if formula.ImageURL != "" {
		if err := a.repo.DeleteImageFromMinIO(formula.ImageURL); err != nil {
			logrus.Warn("Error deleting old image from MinIO: ", err)
		}
	}

	// Обновляем image_url в БД
	formula.ImageURL = imageURL
	if err := a.repo.UpdatePvlcMedFormula(&formula); err != nil {
		logrus.Error("Error updating pvlc med formula image: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка обновления формулы")
		return
	}

	a.successResponse(c, gin.H{
		"message":   "Изображение успешно загружено",
		"image_url": imageURL,
	})
}

// AddPvlcMedFormulaToCart godoc
// @Summary Добавление формулы в корзину
// @Description Добавляет формулу в заявку-черновик пользователя
// @Tags med_formulas
// @Produce json
// @Param id path int true "ID формулы"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/pvlc-med-formulas/{id}/add-to-cart [post]
// @Security BearerAuth
func (a *API) AddPvlcMedFormulaToCart(c *gin.Context) {
	// Проверка аутентификации выполняется в middleware RequireAuth
	claims := auth.GetUserFromContext(c)
	if claims == nil {
		a.errorResponse(c, http.StatusUnauthorized, "Требуется аутентификация")
		return
	}

	idStr := c.Param("id")
	formulaID, err := strconv.Atoi(idStr)
	if err != nil || formulaID <= 0 {
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID формулы")
		return
	}

	// Создаем или получаем черновик для текущего пользователя
	card, err := a.repo.GetOrCreateDraftPvlcMedCard(claims.UserID)
	if err != nil {
		logrus.Error("Error getting draft pvlc med card: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка доступа к корзине")
		return
	}

	// Обновляем владельца заявки (на случай если черновик был создан до аутентификации)
	if card.UserID != claims.UserID {
		if err := a.repo.UpdatePvlcMedCardUserID(card.ID, claims.UserID); err != nil {
			logrus.Warn("Error updating card owner: ", err)
		}
	}

	// Добавляем формулу в заявку
	if err := a.repo.AddPvlcMedFormulaToCard(card.ID, uint(formulaID)); err != nil {
		logrus.Error("Error adding to cart: ", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка добавления в корзину")
		return
	}

	a.successResponse(c, gin.H{
		"message":     "пациент добавлен в мед-карту",
		"med_card_id": card.ID,
	})
}
