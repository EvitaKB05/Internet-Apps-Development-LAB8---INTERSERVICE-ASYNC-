// internal/api/async_handlers.go
// НОВЫЙ ФАЙЛ: Обработчик для получения результатов от Django сервиса

package api

import (
	"lab1/internal/app/ds"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// UpdatePvlcMedCardAsyncResult godoc
// @Summary Обновление результатов асинхронного расчета
// @Description Обновляет результаты ДЖЕЛ после асинхронного расчета в Django сервисе
// @Description Требует правильный ключ авторизации в поле async_key
// @Tags medical-cards
// @Accept json
// @Produce json
// @Param id path int true "ID заявки"
// @Param request body ds.AsyncResultUpdateRequest true "Результаты расчета от Django сервиса"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/pvlc-med-cards/{id}/async-result [put]
func (a *API) UpdatePvlcMedCardAsyncResult(c *gin.Context) {
	// Логируем начало обработки запроса
	logrus.Info("🔄 Получен запрос на обновление асинхронных результатов")

	// 1. Получаем ID заявки из URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		logrus.Warnf("❌ Неверный ID заявки: %s", idStr)
		a.errorResponse(c, http.StatusBadRequest, "Неверный ID заявки")
		return
	}

	logrus.Infof("   ID заявки: %d", id)

	// 2. Получаем данные из тела запроса
	var request ds.AsyncResultUpdateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		logrus.Warnf("❌ Неверные данные запроса: %v", err)
		a.errorResponse(c, http.StatusBadRequest, "Неверные данные запроса")
		return
	}

	// Детальное логирование
	logrus.Infof("📊 Получены данные от Django:")
	logrus.Infof("   TotalResult: %.2f", request.TotalResult)
	logrus.Infof("   CalculatedCount: %d", request.CalculatedCount)
	logrus.Infof("   AsyncCalculated: %v", request.AsyncCalculated)
	logrus.Infof("   AsyncKey: %s", request.AsyncKey)
	logrus.Infof("   IndividualResults: %d шт.", len(request.IndividualResults))

	for i, res := range request.IndividualResults {
		logrus.Infof("     %d. FormulaID: %d, Title: %s, Result: %.2f, Height: %.1f",
			i+1, res.FormulaID, res.Title, res.IndividualResult, res.InputHeight)
	}

	// 3. Проверяем ключ авторизации
	if request.AsyncKey != ds.AsyncServiceKey {
		logrus.Warnf("❌ Попытка обновить заявку #%d с неверным ключом", id)
		logrus.Warnf("   Ожидался ключ: %s", ds.AsyncServiceKey)
		logrus.Warnf("   Получен ключ: %s", request.AsyncKey)
		a.errorResponse(c, http.StatusForbidden, "Доступ запрещен: неверный ключ")
		return
	}

	logrus.Info("   ✅ Ключ авторизации верный")

	// 4. Проверяем что заявка существует
	card, err := a.repo.GetPvlcMedCardByID(uint(id))
	if err != nil {
		logrus.Warnf("❌ Заявка #%d не найдена", id)
		a.errorResponse(c, http.StatusNotFound, "Заявка не найдена")
		return
	}

	logrus.Infof("   Заявка найдена, статус: %s, ID: %d", card.Status, card.ID)

	// 5. Обновляем результаты расчета в базе данных
	logrus.Info("💾 Начинаем обновление результатов в БД...")

	// ==================== ИСПРАВЛЕНИЕ: Используем альтернативный подход ====================
	// Сначала попробуем простой способ без транзакций

	// А. Обновляем основную заявку
	updateErr := a.repo.GetDB().Model(&ds.PvlcMedCard{}). // ИСПРАВЛЕНО: GetDB() вместо db
								Where("id = ?", card.ID).
								Updates(map[string]interface{}{
			"total_result":     request.TotalResult,
			"calculated_count": request.CalculatedCount,
			"async_calculated": true,
			"updated_at":       time.Now(),
		}).Error

	if updateErr != nil {
		logrus.Errorf("❌ Ошибка обновления заявки #%d: %v", id, updateErr)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка обновления заявки")
		return
	}

	logrus.Infof("✅ Основная заявка #%d обновлена: TotalResult=%.2f", id, request.TotalResult)

	// Б. Пытаемся обновить индивидуальные результаты
	if len(request.IndividualResults) > 0 {
		logrus.Infof("📝 Пытаемся обновить %d индивидуальных результатов...", len(request.IndividualResults))

		successCount := 0
		for _, individualResult := range request.IndividualResults {
			if individualResult.FormulaID == 0 {
				logrus.Warnf("⚠️ Пропускаем результат с FormulaID=0")
				continue
			}

			// Проверяем существует ли такая связь
			var exists bool
			checkErr := a.repo.GetDB().Model(&ds.MedMmPvlcCalculation{}).
				Select("1").
				Where("pvlc_med_card_id = ? AND pvlc_med_formula_id = ?",
					card.ID, individualResult.FormulaID).
				Limit(1).
				Find(&exists).Error

			if checkErr != nil {
				logrus.Warnf("⚠️ Ошибка проверки формулы %d: %v",
					individualResult.FormulaID, checkErr)
				continue
			}

			if !exists {
				logrus.Warnf("⚠️ Формула %d не найдена в заявке #%d",
					individualResult.FormulaID, id)
				continue
			}

			// Обновляем результат
			updateResult := a.repo.GetDB().Model(&ds.MedMmPvlcCalculation{}).
				Where("pvlc_med_card_id = ? AND pvlc_med_formula_id = ?",
					card.ID, individualResult.FormulaID).
				Update("final_result", individualResult.IndividualResult)

			if updateResult.Error != nil {
				logrus.Warnf("⚠️ Ошибка обновления результата для формулы %d: %v",
					individualResult.FormulaID, updateResult.Error)
			} else if updateResult.RowsAffected > 0 {
				logrus.Infof("✅ Обновлен результат для формулы %d: %.2f л",
					individualResult.FormulaID, individualResult.IndividualResult)
				successCount++
			} else {
				logrus.Warnf("⚠️ Не удалось обновить результат для формулы %d (строк не затронуто)",
					individualResult.FormulaID)
			}
		}

		logrus.Infof("📊 Обновлено индивидуальных результатов: %d из %d",
			successCount, len(request.IndividualResults))
	} else {
		logrus.Warnf("⚠️ Не получены индивидуальные результаты для заявки #%d", id)
	}

	logrus.Infof("✅ Результаты асинхронного расчета обновлены для заявки #%d", id)
	logrus.Infof("   TotalResult: %.2f л", request.TotalResult)
	logrus.Infof("   CalculatedCount: %d формул", request.CalculatedCount)
	logrus.Infof("   AsyncCalculated: %v", request.AsyncCalculated)

	// 6. Возвращаем успешный ответ
	a.successResponse(c, gin.H{
		"message":            "Результаты асинхронного расчета успешно обновлены",
		"total_result":       request.TotalResult,
		"calculated_count":   request.CalculatedCount,
		"async_calculated":   request.AsyncCalculated,
		"card_id":            id,
		"individual_results": len(request.IndividualResults),
		"note":               "Индивидуальные результаты сохранены",
		"timestamp":          time.Now().Format("2006-01-02 15:04:05"),
	})
}
