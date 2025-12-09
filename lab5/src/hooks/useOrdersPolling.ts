// src/hooks/useOrdersPolling.ts
// НОВЫЙ ХУК: Автоматическое обновление списка заявок каждые 10 секунд

import { useEffect, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './redux'
import { getOrdersList } from '../store/slices/ordersSlice'
import type { PvlcMedCardFilter } from '../types'

/**
 * Хук для short polling (короткого опроса) списка заявок
 *
 * Что делает:
 * 1. Автоматически обновляет список заявок каждые 10 секунд (УВЕЛИЧЕНО С 3)
 * 2. Особенно полезно для отслеживания прогресса асинхронных вычислений ДЖЕЛ
 * 3. Останавливается когда пользователь выходит из системы
 *
 * Использование:
 * const { isPolling } = useOrdersPolling(10000) // 10000ms = 10 секунд
 */
const useOrdersPolling = (intervalMs: number = 10000) => {
	// ИЗМЕНЕНО: 10000ms вместо 3000
	const dispatch = useAppDispatch()

	// Получаем состояние из Redux
	const { filter } = useAppSelector(state => state.orders)
	const { isAuthenticated } = useAppSelector(state => state.auth)

	// Используем useRef для хранения ID интервала
	// useRef сохраняет значение между рендерами
	const intervalRef = useRef<number | null>(null) // ИСПРАВЛЕНО: number вместо NodeJS.Timeout

	// Функция загрузки заявок
	// useCallback чтобы функция не пересоздавалась на каждом рендере
	const loadOrders = useCallback(async () => {
		if (!isAuthenticated) {
			// Если пользователь не авторизован - не загружаем
			return
		}

		try {
			// Подготавливаем параметры для API
			// Преобразуем пустые строки в undefined
			const apiParams: PvlcMedCardFilter = {
				date_from: filter.date_from || undefined,
				updated_date_from: filter.updated_date_from || undefined,
				status: filter.status || undefined,
			}

			// Вызываем действие Redux для загрузки заявок
			await dispatch(getOrdersList(apiParams))

			// Логируем для отладки (можно убрать в production)
			console.log('🔄 [ЛР8] Short polling: заявки обновлены')
		} catch (error) {
			console.error('❌ Ошибка загрузки заявок:', error)
		}
	}, [dispatch, filter, isAuthenticated])

	// Эффект для управления polling
	useEffect(() => {
		// Если пользователь авторизован
		if (isAuthenticated) {
			// 1. Загружаем заявки сразу при старте
			loadOrders()

			// 2. Устанавливаем интервал для периодической загрузки
			// ИСПРАВЛЕНО: window.setInterval возвращает number
			intervalRef.current = window.setInterval(loadOrders, intervalMs)

			console.log(`✅ [ЛР8] Short polling запущен (интервал: ${intervalMs}ms)`)

			// 3. Функция очистки (выполняется при размонтировании компонента)
			return () => {
				if (intervalRef.current !== null) {
					window.clearInterval(intervalRef.current)
					intervalRef.current = null
					console.log('🛑 [ЛР8] Short polling остановлен')
				}
			}
		} else {
			// Если пользователь не авторизован - останавливаем polling
			if (intervalRef.current !== null) {
				window.clearInterval(intervalRef.current)
				intervalRef.current = null
			}
		}
	}, [isAuthenticated, loadOrders, intervalMs])

	// Возвращаем информацию о состоянии polling
	return {
		isPolling: intervalRef.current !== null, // true если polling активен
		intervalMs,
	}
}

export default useOrdersPolling
