// internal/api/async_handlers.go
// НОВЫЙ ФАЙЛ: Обработчик для получения результатов от Django сервиса

package api

import (
	"lab1/internal/app/ds"
	"net/http"
	"strconv"

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

	logrus.Infof("   Получены данные: TotalResult=%.2f, CalculatedCount=%d",
		request.TotalResult, request.CalculatedCount)

	// 3. ==================== ВАЖНАЯ ПРОВЕРКА! ====================
	// Проверяем ключ авторизации
	// Django сервис должен отправлять правильный ключ
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

	logrus.Infof("   Заявка найдена, статус: %s", card.Status)

	// 5. Обновляем результаты расчета в базе данных
	// Обновляем TotalResult, CalculatedCount и AsyncCalculated
	err = a.repo.UpdatePvlcMedCardAsyncResult(card.ID, request.TotalResult, request.CalculatedCount)
	if err != nil {
		logrus.Errorf("❌ Ошибка обновления результатов: %v", err)
		a.errorResponse(c, http.StatusInternalServerError, "Ошибка обновления результатов")
		return
	}

	logrus.Infof("✅ Результаты асинхронного расчета обновлены для заявки #%d", id)
	logrus.Infof("   TotalResult: %.2f л", request.TotalResult)
	logrus.Infof("   CalculatedCount: %d формул", request.CalculatedCount)
	logrus.Infof("   AsyncCalculated: %v", request.AsyncCalculated)

	// 6. Возвращаем успешный ответ
	a.successResponse(c, gin.H{
		"message":          "Результаты асинхронного расчета успешно обновлены",
		"total_result":     request.TotalResult,
		"calculated_count": request.CalculatedCount,
		"async_calculated": request.AsyncCalculated,
		"card_id":          id,
	})
}
