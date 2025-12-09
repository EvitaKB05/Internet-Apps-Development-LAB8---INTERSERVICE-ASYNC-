import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
	api,
	type DsPvlcMedCardResponse,
	type DsUpdatePvlcMedCardRequest,
	type DsUpdateMedMmPvlcCalculationAPIRequest,
	// ДОБАВЛЯЕМ ИМПОРТ ТИПА ДЛЯ ЗАВЕРШЕНИЯ ЗАЯВКИ
	type DsCompletePvlcMedCardRequest,
} from '../../api'
// ИСПРАВЛЕНО: добавляем импорт типа для фильтра
import type { PvlcMedCardFilter } from '../../types'

// Интерфейс состояния заявок
interface OrdersState {
	orders: DsPvlcMedCardResponse[]
	currentOrder: DsPvlcMedCardResponse | null
	loading: boolean
	updatingHeight: boolean
	error: string | null
	// ИСПРАВЛЕНО: добавляем состояние фильтров
	filter: PvlcMedCardFilter
}

// Тип для ошибки API
interface ApiError {
	response?: {
		data?: string | Record<string, string>
		status?: number
	}
	message?: string
}

// Тип для обернутого ответа API
interface ApiWrappedResponse<T> {
	data?: T
}

// Тип для параметров списка заявок
interface OrdersListParams {
	date_from?: string
	date_to?: string
	status?: string
	// ИСПРАВЛЕНО: добавляем параметр updated_date_from
	updated_date_from?: string
	updated_date_to?: string
}

// Начальное состояние
const initialState: OrdersState = {
	orders: [],
	currentOrder: null,
	loading: false,
	updatingHeight: false,
	error: null,
	// ИСПРАВЛЕНО: добавляем начальное состояние фильтров
	filter: {
		date_from: '',
		updated_date_from: '',
		status: '',
	},
}

// Асинхронное действие для получения списка заявок
// ИСПРАВЛЕНО: принимаем параметры фильтра
export const getOrdersList = createAsyncThunk(
	'orders/getOrdersList',
	async (params: OrdersListParams = {}, { rejectWithValue }) => {
		try {
			const response = await api.api.pvlcMedCardsList(params)

			const apiResponse = response as ApiWrappedResponse<
				DsPvlcMedCardResponse[]
			>

			if (apiResponse.data) {
				return apiResponse.data
			}

			if (Array.isArray(response)) {
				return response as DsPvlcMedCardResponse[]
			}

			throw new Error('Invalid response format')
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка загрузки заявок'
			)
		}
	}
)

// ==================== ДОБАВЛЯЕМ НОВЫЙ ACTION ДЛЯ ЛР8 ====================
// Асинхронное действие для завершения/отклонения заявки модератором
const completeOrder = createAsyncThunk(
	// ИСПРАВЛЕНО: убираем export здесь
	'orders/completeOrder',
	async (
		{ id, action }: { id: number; action: 'complete' | 'reject' },
		{ rejectWithValue, dispatch }
	) => {
		try {
			console.log(`🚀 [ЛР8] Завершение заявки #${id} с действием: ${action}`)

			const requestData: DsCompletePvlcMedCardRequest = {
				action: action,
			}

			const response = await api.api.pvlcMedCardsCompleteUpdate(
				{ id },
				requestData
			)

			console.log('✅ [ЛР8] Ответ от сервера при завершении:', response)

			// После успешного завершения обновляем список заявок
			dispatch(getOrdersList({}))

			return { id, action, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			console.error('❌ [ЛР8] Ошибка завершения заявки:', apiError)
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: `Ошибка ${
							action === 'complete' ? 'завершения' : 'отклонения'
					  } заявки`
			)
		}
	}
)

// Асинхронное действие для получения деталей заявки
export const getOrderDetail = createAsyncThunk(
	'orders/getOrderDetail',
	async (id: number, { rejectWithValue }) => {
		try {
			const response = await api.api.pvlcMedCardsDetail({ id })
			const apiResponse = response as ApiWrappedResponse<DsPvlcMedCardResponse>

			if (apiResponse.data) {
				return apiResponse.data
			}

			if (response && typeof response === 'object' && 'id' in response) {
				return response as DsPvlcMedCardResponse
			}

			throw new Error('Invalid response format')
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка загрузки заявки'
			)
		}
	}
)

// ИСПРАВЛЕНО: Асинхронное действие для обновления роста в расчете
export const updateCalculationHeight = createAsyncThunk(
	'orders/updateCalculationHeight',
	async (
		{
			cardId,
			formulaId,
			height,
		}: {
			cardId: number
			formulaId: number
			height: number
		},
		{ rejectWithValue }
	) => {
		try {
			const requestData: DsUpdateMedMmPvlcCalculationAPIRequest = {
				card_id: cardId,
				pvlc_med_formula_id: formulaId,
				data: {
					input_height: height,
				},
			}

			const response = await api.api.medMmPvlcCalculationsUpdate(requestData)
			return { cardId, formulaId, height, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка обновления роста'
			)
		}
	}
)

// Асинхронное действие для обновления заявки
export const updateOrder = createAsyncThunk(
	'orders/updateOrder',
	async (
		{ id, data }: { id: number; data: DsUpdatePvlcMedCardRequest },
		{ rejectWithValue }
	) => {
		try {
			const response = await api.api.pvlcMedCardsUpdate({ id }, data)
			return { id, data, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка обновления заявки'
			)
		}
	}
)

// Асинхронное действие для удаления заявки
export const deleteOrder = createAsyncThunk(
	'orders/deleteOrder',
	async (id: number, { rejectWithValue }) => {
		try {
			const response = await api.api.pvlcMedCardsDelete({ id })
			return { id, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка удаления заявки'
			)
		}
	}
)

// Асинхронное действие для формирования заявки
export const formOrder = createAsyncThunk(
	'orders/formOrder',
	async (id: number, { rejectWithValue }) => {
		try {
			const response = await api.api.pvlcMedCardsFormUpdate({ id })
			return { id, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка формирования заявки'
			)
		}
	}
)

// Создаем слайс
const ordersSlice = createSlice({
	name: 'orders',
	initialState,
	reducers: {
		// Редьюсер для очистки ошибки
		clearOrdersError: state => {
			state.error = null
		},
		// Редьюсер для сброса текущей заявки
		clearCurrentOrder: state => {
			state.currentOrder = null
		},
		// Редьюсер для сброса состояния обновления роста
		clearUpdatingHeight: state => {
			state.updatingHeight = false
		},
		// ИСПРАВЛЕНО: добавляем редьюсер для установки фильтра
		setOrdersFilter: (state, action: PayloadAction<PvlcMedCardFilter>) => {
			state.filter = { ...state.filter, ...action.payload }
		},
		// ИСПРАВЛЕНО: добавляем редьюсер для сброса фильтров
		resetOrdersFilter: state => {
			state.filter = initialState.filter
		},
	},
	extraReducers: builder => {
		builder
			// ==================== ОБРАБОТКА НОВОГО ACTION ДЛЯ ЛР8 ====================
			.addCase(completeOrder.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(completeOrder.fulfilled, (state, action) => {
				state.loading = false

				// Обновляем заявку в списке
				const index = state.orders.findIndex(
					order => order.id === action.payload.id
				)
				if (index !== -1) {
					const newStatus =
						action.payload.action === 'complete' ? 'завершен' : 'отклонен'
					state.orders[index] = {
						...state.orders[index],
						status: newStatus,
						// Для асинхронного расчета устанавливаем начальные значения
						...(action.payload.action === 'complete' && {
							total_result: 0,
							calculated_count: 0,
							async_calculated: false,
						}),
					}
					console.log(
						`✅ [ЛР8] Обновлена заявка #${action.payload.id}, новый статус: ${newStatus}`
					)
				}
				state.error = null
			})
			.addCase(completeOrder.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
				console.error(
					'❌ [ЛР8] Ошибка в extraReducers при завершении:',
					action.payload
				)
			})

			// Обработка getOrdersList
			.addCase(getOrdersList.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(
				getOrdersList.fulfilled,
				(state, action: PayloadAction<DsPvlcMedCardResponse[]>) => {
					state.loading = false
					state.orders = action.payload
					state.error = null
				}
			)
			.addCase(getOrdersList.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка getOrderDetail
			.addCase(getOrderDetail.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(
				getOrderDetail.fulfilled,
				(state, action: PayloadAction<DsPvlcMedCardResponse>) => {
					state.loading = false
					state.currentOrder = action.payload
					state.error = null
				}
			)
			.addCase(getOrderDetail.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка updateCalculationHeight
			.addCase(updateCalculationHeight.pending, state => {
				state.updatingHeight = true
				state.error = null
			})
			.addCase(updateCalculationHeight.fulfilled, (state, action) => {
				state.updatingHeight = false
				// Обновляем данные расчета в текущей заявке
				if (state.currentOrder?.id === action.payload.cardId) {
					const updatedCalculations = state.currentOrder.med_calculations?.map(
						calc =>
							calc.pvlc_med_formula_id === action.payload.formulaId
								? { ...calc, input_height: action.payload.height }
								: calc
					)

					if (updatedCalculations) {
						state.currentOrder = {
							...state.currentOrder,
							med_calculations: updatedCalculations,
						}
					}
				}
				state.error = null
			})
			.addCase(updateCalculationHeight.rejected, (state, action) => {
				state.updatingHeight = false
				state.error = action.payload as string
			})

			// Обработка updateOrder
			.addCase(updateOrder.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(updateOrder.fulfilled, (state, action) => {
				state.loading = false
				// Обновляем заявку в списке
				const index = state.orders.findIndex(
					order => order.id === action.payload.id
				)
				if (index !== -1 && state.currentOrder) {
					state.orders[index] = {
						...state.orders[index],
						...action.payload.data,
					}
					state.currentOrder = { ...state.currentOrder, ...action.payload.data }
				}
				state.error = null
			})
			.addCase(updateOrder.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка deleteOrder
			.addCase(deleteOrder.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(deleteOrder.fulfilled, (state, action) => {
				state.loading = false
				// Удаляем заявку из списка
				state.orders = state.orders.filter(
					order => order.id !== action.payload.id
				)
				if (state.currentOrder?.id === action.payload.id) {
					state.currentOrder = null
				}
				state.error = null
			})
			.addCase(deleteOrder.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка formOrder
			.addCase(formOrder.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(formOrder.fulfilled, (state, action) => {
				state.loading = false
				// Обновляем статус заявки
				const index = state.orders.findIndex(
					order => order.id === action.payload.id
				)
				if (index !== -1) {
					state.orders[index] = {
						...state.orders[index],
						status: 'сформирован',
					}
				}
				if (state.currentOrder?.id === action.payload.id) {
					state.currentOrder = { ...state.currentOrder, status: 'сформирован' }
				}
				state.error = null
			})
			.addCase(formOrder.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})
	},
})

// Экспортируем действия и редьюсер
export const {
	clearOrdersError,
	clearCurrentOrder,
	clearUpdatingHeight,
	// ИСПРАВЛЕНО: экспортируем новые действия
	setOrdersFilter,
	resetOrdersFilter,
} = ordersSlice.actions

// ==================== ДОБАВЛЯЕМ ЭКСПОРТ НОВОГО ACTION ДЛЯ ЛР8 ====================
// ИСПРАВЛЕНО: экспортируем через default export
export { completeOrder }

export default ordersSlice.reducer
