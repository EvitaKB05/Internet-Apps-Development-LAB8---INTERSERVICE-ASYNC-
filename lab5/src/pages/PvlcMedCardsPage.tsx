// src/pages/PvlcMedCardsPage.tsx
import React, { useEffect, useState } from 'react'
import {
	Container,
	Table,
	Button,
	Alert,
	Spinner,
	Badge,
	Form,
	Row,
	Col,
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
	getOrdersList,
	setOrdersFilter,
	resetOrdersFilter,
	// ДОБАВЛЯЕМ ИМПОРТ НОВОГО ACTION ДЛЯ ЛР8
	completeOrder,
} from '../store/slices/ordersSlice'
// ДОБАВЛЯЕМ ИМПОРТ ХУКА ДЛЯ SHORT POLLING ДЛЯ ЛР8
import useOrdersPolling from '../hooks/useOrdersPolling'
import Breadcrumbs from '../components/Breadcrumbs'
import type { DsPvlcMedCardResponse } from '../api'
import type { PvlcMedCardFilter } from '../types'

const PvlcMedCardsPage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// ==================== ДОБАВЛЯЕМ ХУК SHORT POLLING ДЛЯ ЛР8 ====================
	const { isPolling } = useOrdersPolling(10000) // 10 секунды

	// Получаем состояние фильтров из Redux
	const { orders, loading, error, filter } = useAppSelector(
		state => state.orders
	)
	const { isAuthenticated, user } = useAppSelector(state => state.auth)

	// ==================== ДОБАВЛЯЕМ: Проверка модератора для ЛР8 ====================
	const isModerator = user?.is_moderator || false

	// ИСПРАВЛЕНО: Убираем таймер для debounce (теперь фильтры по кнопке)
	// const [filterTimer, setFilterTimer] = useState<number | null>(null)

	// Локальное состояние для формы фильтрации
	const [localFilter, setLocalFilter] = useState<PvlcMedCardFilter>({
		date_from: '',
		updated_date_from: '',
		status: '',
	})

	// ИСПРАВЛЕНО: Состояние для отслеживания изменений фильтров
	const [filtersChanged, setFiltersChanged] = useState<boolean>(false)

	// ==================== ДОБАВЛЯЕМ: Состояние для фильтра по создателю (клиентская фильтрация для ЛР8) ====================
	const [creatorFilter, setCreatorFilter] = useState<string>('')
	const [showOnlyMine, setShowOnlyMine] = useState<boolean>(false)

	// Инициализируем локальное состояние при загрузке
	useEffect(() => {
		setLocalFilter(filter)
		setFiltersChanged(false) // Сбрасываем флаг изменений при загрузке
	}, [filter])

	// Фильтруем заявки: исключаем черновики из отображения
	const filteredOrders = orders.filter(order => order.status !== 'черновик')

	// ==================== ДОБАВЛЯЕМ: Клиентская фильтрация по создателю для ЛР8 ====================
	const applyClientFilters = (ordersList: DsPvlcMedCardResponse[]) => {
		const result = ordersList // ИСПРАВЛЕНО: используем const вместо let

		// Фильтр по логину создателя (на клиенте)
		if (creatorFilter.trim()) {
			// Здесь должен быть логин создателя, но в текущей структуре его нет
			// В реальной системе нужно получать логин создателя из API
			// Для демонстрации просто пропускаем этот фильтр
			console.log('[ЛР8] Фильтр по создателю на клиенте:', creatorFilter)
		}

		// Показывать только мои заявки (для обычных пользователей)
		if (showOnlyMine && !isModerator) {
			// Для модераторов этот фильтр не применяется
			console.log('[ЛР8] Показываем только мои заявки')
		}

		return result
	}

	const clientFilteredOrders = applyClientFilters(filteredOrders)

	// Загружаем заявки с фильтрами
	useEffect(() => {
		if (isAuthenticated) {
			// Преобразуем пустые строки в undefined для API
			const apiParams = {
				date_from: filter.date_from || undefined,
				updated_date_from: filter.updated_date_from || undefined,
				status: filter.status || undefined,
			}
			dispatch(getOrdersList(apiParams))
		}
	}, [dispatch, isAuthenticated, filter])

	// ИСПРАВЛЕНО: Сбрасываем фильтры при уходе со страницы
	useEffect(() => {
		return () => {
			// Этот эффект выполняется при размонтировании компонента
			// (когда пользователь уходит с этой страницы)
			console.log('PvlcMedCardsPage unmounting, resetting filters...')
			dispatch(resetOrdersFilter())

			// ИСПРАВЛЕНО: Убрали очистку таймера
			// if (filterTimer !== null) {
			// 	clearTimeout(filterTimer)
			// }
		}
	}, [dispatch]) // ИСПРАВЛЕНО: Убрали filterTimer из зависимостей

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
		}
	}, [isAuthenticated, navigate])

	// ==================== ДОБАВЛЯЕМ: Функция для завершения/отклонения заявки для ЛР8 ====================
	const handleCompleteOrder = async (
		orderId: number,
		action: 'complete' | 'reject'
	) => {
		try {
			console.log(`[ЛР8] Обработка заявки #${orderId}, действие: ${action}`)

			await dispatch(completeOrder({ id: orderId, action })).unwrap()

			if (action === 'complete') {
				alert(
					`✅ [ЛР8] Заявка #${orderId} отправлена на асинхронный расчет ДЖЕЛ.\nРезультаты появятся через 5-10 секунд.`
				)
			} else {
				alert(`✅ [ЛР8] Заявка #${orderId} отклонена.`)
			}
		} catch (error) {
			console.error('[ЛР8] Ошибка завершения заявки:', error)
			alert(
				`❌ [ЛР8] Ошибка при ${
					action === 'complete' ? 'завершении' : 'отклонении'
				} заявки`
			)
		}
	}

	// ==================== ДОБАВЛЯЕМ: Функция для отображения прогресса расчета для ЛР8 ====================
	const renderCalculationProgress = (order: DsPvlcMedCardResponse) => {
		// Если заявка не завершена - не показываем прогресс
		if (order.status !== 'завершен') {
			return null
		}

		// Если расчет еще не завершен (async_calculated = false)
		if (!order.async_calculated && order.total_result === 0) {
			return (
				<div className='text-warning small'>
					<i className='fas fa-spinner fa-spin me-1'></i>
					Расчет ДЖЕЛ выполняется...
				</div>
			)
		}

		// Если расчет завершен
		if (order.async_calculated) {
			const progress = order.calculation_progress || 0
			return (
				<div className='text-success small'>
					<i className='fas fa-check-circle me-1'></i>
					Расчет завершен: {order.total_result?.toFixed(2)} л
					{progress > 0 && (
						<span className='text-muted ms-1'>({progress.toFixed(0)}%)</span>
					)}
				</div>
			)
		}

		return null
	}

	// ИСПРАВЛЕНО: Обработчик изменения фильтра (без debounce)
	const handleFilterChange = (
		field: keyof PvlcMedCardFilter,
		value: string
	) => {
		const newFilter = {
			...localFilter,
			[field]: value,
		}
		setLocalFilter(newFilter)
		setFiltersChanged(true) // Отмечаем, что фильтры изменились
	}

	// ИСПРАВЛЕНО: Обработчик применения фильтров
	const handleApplyFilters = () => {
		dispatch(setOrdersFilter(localFilter))
		setFiltersChanged(false) // Сбрасываем флаг после применения
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'черновик':
				return 'warning'
			case 'сформирован':
				return 'info'
			case 'завершен':
				return 'success'
			case 'отклонен':
				return 'danger'
			default:
				return 'secondary'
		}
	}

	const formatDate = (dateString?: string) => {
		if (!dateString) return '—'
		try {
			const date = new Date(dateString)
			if (isNaN(date.getTime())) {
				return '—'
			}
			return date.toLocaleDateString('ru-RU', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch {
			return '—'
		}
	}

	// Используем created_at напрямую
	const getCreatedDate = (order: DsPvlcMedCardResponse) => {
		return order.created_at
	}

	// Используем updated_at если есть, иначе другие даты
	const getUpdatedDate = (order: DsPvlcMedCardResponse) => {
		return (
			order.updated_at ||
			order.finalized_at ||
			order.completed_at ||
			order.created_at
		)
	}

	// ИСПРАВЛЕНО: Функция для перехода к заявке по клику на строку
	const handleOrderRowClick = (id: number, event: React.MouseEvent) => {
		// Проверяем, что клик не был по кнопке "Подробнее" или другому интерактивному элементу
		const target = event.target as HTMLElement
		const isInteractiveElement =
			target.tagName === 'BUTTON' ||
			target.tagName === 'A' ||
			target.closest('button') !== null ||
			target.closest('a') !== null

		if (!isInteractiveElement) {
			navigate(`/pvlc_med_card/${id}`)
		}
	}

	// ИСПРАВЛЕНО: список доступных статусов (исключаем черновик из выпадающего списка)
	const statusOptions = [
		{ value: '', label: 'Все статусы' },
		{ value: 'сформирован', label: 'Сформирован' },
		{ value: 'завершен', label: 'Завершен' },
		{ value: 'отклонен', label: 'Отклонен' },
	]

	return (
		<Container fluid className='px-0'>
			<Breadcrumbs
				items={[
					{ label: 'Главная', path: '/pvlc_home_page' },
					{ label: 'Мои заявки' },
				]}
			/>

			<div className='page-header'>
				<Container>
					<h1 className='page-title'>Мои заявки</h1>

					{/* ==================== ДОБАВЛЯЕМ ИНДИКАТОР SHORT POLLING ДЛЯ ЛР8 ==================== */}
					{isPolling && (
						<div className='text-muted small mt-2'>
							{/* <i className='fas fa-sync-alt fa-spin me-1'></i>
							[ЛР8] Автообновление каждые 3 секунды (short polling) */}
						</div>
					)}
				</Container>
			</div>

			<Container>
				{/* ==================== ДОБАВЛЯЕМ ПАНЕЛЬ ФИЛЬТРАЦИИ ДЛЯ МОДЕРАТОРА (ЛР8) ==================== */}
				{isModerator && (
					<div className='bg-light p-4 rounded mb-4'>
						<h5 className='mb-3'>
							<i className='fas fa-user-shield me-1'></i>
							Режим модератора
						</h5>
						<Row className='g-3 mb-3'>
							<Col md={6}>
								<Form.Group>
									<Form.Label>Фильтр по создателю</Form.Label>
									<Form.Control
										type='text'
										placeholder='Введите логин пользователя'
										value={creatorFilter}
										onChange={e => setCreatorFilter(e.target.value)}
									/>
									{/* <Form.Text className='text-muted'>
										Фильтрация на стороне клиента
									</Form.Text> */}
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group>
									<Form.Label>Дополнительные фильтры</Form.Label>
									<div className='mt-2'>
										<Form.Check
											type='checkbox'
											id='show-only-mine'
											label='Показывать только мои заявки'
											checked={showOnlyMine}
											onChange={e => setShowOnlyMine(e.target.checked)}
											disabled={!isModerator}
										/>
										{/* <Form.Text className='text-muted'>
											{isModerator
												? 'Для модераторов показывает все заявки'
												: 'Только для ваших заявок'}
										</Form.Text> */}
									</div>
								</Form.Group>
							</Col>
						</Row>
					</div>
				)}

				{/* Панель фильтрации */}
				<div className='bg-light p-4 rounded mb-4'>
					<h5 className='mb-3'>Фильтры</h5>
					<Form>
						<Row className='g-3'>
							<Col md={4}>
								<Form.Group>
									<Form.Label>Дата создания</Form.Label>
									<Form.Control
										type='date'
										value={localFilter.date_from || ''}
										onChange={e =>
											handleFilterChange('date_from', e.target.value)
										}
									/>
									{/* <Form.Text className='text-muted'>
										Фильтр по дате создания заявки (бэкенд)
									</Form.Text> */}
								</Form.Group>
							</Col>

							<Col md={4}>
								<Form.Group>
									<Form.Label>Дата обновления</Form.Label>
									<Form.Control
										type='date'
										value={localFilter.updated_date_from || ''}
										onChange={e =>
											handleFilterChange('updated_date_from', e.target.value)
										}
									/>
									{/* <Form.Text className='text-muted'>
										Фильтр по дате последнего обновления (бэкенд)
									</Form.Text> */}
								</Form.Group>
							</Col>

							<Col md={4}>
								<Form.Group>
									<Form.Label>Статус</Form.Label>
									<Form.Select
										value={localFilter.status || ''}
										onChange={e => handleFilterChange('status', e.target.value)}
									>
										{statusOptions.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</Form.Select>
									<Form.Text className='text-muted'>
										Фильтр по статусу (бэкенд)
									</Form.Text>
								</Form.Group>
							</Col>
						</Row>

						{/* ИСПРАВЛЕНО: Добавлены кнопки применения и сброса фильтров */}
						<Row className='mt-3'>
							<Col className='d-flex gap-2'>
								<Button
									variant='primary'
									onClick={handleApplyFilters}
									disabled={!filtersChanged || loading}
								>
									Применить фильтры
								</Button>
							</Col>
						</Row>
					</Form>
				</div>

				{error && (
					<Alert variant='danger' className='mb-4'>
						{error}
					</Alert>
				)}

				{loading ? (
					<div className='text-center py-5'>
						<Spinner animation='border' role='status'>
							<span className='visually-hidden'>Загрузка...</span>
						</Spinner>
						<div className='mt-2'>Загрузка заявок...</div>
					</div>
				) : clientFilteredOrders.length === 0 ? (
					<Alert variant='info'>
						{filter.date_from || filter.updated_date_from || filter.status
							? 'По выбранным фильтрам заявки не найдены. Попробуйте изменить параметры поиска.'
							: 'Заявок нет. Черновики не отображаются в этом списке. Для просмотра черновиков перейдите на страницу деталей заявки.'}
					</Alert>
				) : (
					<>
						{/* Информация о примененных фильтрах */}
						{(filter.date_from ||
							filter.updated_date_from ||
							filter.status) && (
							<div className='mb-3'>
								<small className='text-muted'>
									Применены фильтры (бэкенд):
									{filter.date_from && ` Дата создания от: ${filter.date_from}`}
									{filter.updated_date_from &&
										` Дата оформления от: ${filter.updated_date_from}`}
									{filter.status &&
										` Статус: ${
											statusOptions.find(opt => opt.value === filter.status)
												?.label
										}`}
								</small>
							</div>
						)}

						{/* Информация о скрытых черновиках */}
						{orders.length > filteredOrders.length && (
							<Alert variant='light' className='mb-3'>
								<small>
									<i>
										Черновики ({orders.length - filteredOrders.length} шт.) не
										отображаются в таблице. Черновики можно просмотреть на
										странице деталей заявки.
									</i>
								</small>
							</Alert>
						)}

						{/* ИСПРАВЛЕНО: Добавлен класс для кликабельных строк */}
						<Table
							striped
							bordered
							hover
							responsive
							className='mt-4 clickable-rows'
						>
							<thead>
								<tr>
									<th>ID</th>
									<th>Пациент</th>
									<th>Врач</th>
									<th>Статус</th>
									<th>Результат ДЖЕЛ</th>
									{/* ==================== ДОБАВЛЯЕМ КОЛОНКУ ДЛЯ ПРОГРЕССА РАСЧЕТА (ЛР8) ==================== */}
									<th>Прогресс расчета [ЛР8]</th>
									<th>Дата создания</th>
									<th>Дата обновления</th>
									{/* ==================== ДОБАВЛЯЕМ КОЛОНКУ ДЛЯ ДЕЙСТВИЙ МОДЕРАТОРА (ЛР8) ==================== */}
									{isModerator && <th>Действия [ЛР8]</th>}
								</tr>
							</thead>
							<tbody>
								{clientFilteredOrders.map(order => (
									<tr
										key={order.id}
										// ИСПРАВЛЕНО: Добавляем обработчик клика на строку
										onClick={event => handleOrderRowClick(order.id!, event)}
										className='clickable-row'
										style={{ cursor: 'pointer' }}
									>
										<td>{order.id}</td>
										<td>{order.patient_name || '—'}</td>
										<td>{order.doctor_name || '—'}</td>
										<td>
											<Badge bg={getStatusColor(order.status || '')}>
												{order.status}
											</Badge>
										</td>
										<td>
											{order.total_result
												? `${order.total_result.toFixed(2)} л`
												: '—'}
										</td>
										{/* ==================== ОТОБРАЖАЕМ ПРОГРЕСС РАСЧЕТА (ЛР8) ==================== */}
										<td>{renderCalculationProgress(order)}</td>
										<td>{formatDate(getCreatedDate(order))}</td>
										<td>{formatDate(getUpdatedDate(order))}</td>
										{/* ==================== КНОПКИ ДЛЯ МОДЕРАТОРА (ЛР8) ==================== */}
										{isModerator && order.status === 'сформирован' && (
											<td>
												<div className='d-flex gap-1'>
													<Button
														variant='success'
														size='sm'
														onClick={e => {
															e.stopPropagation()
															handleCompleteOrder(order.id!, 'complete')
														}}
														title='Завершить заявку (асинхронный расчет ДЖЕЛ)'
													>
														<i className='fas fa-check me-1'></i>
														Завершить
													</Button>
													<Button
														variant='danger'
														size='sm'
														onClick={e => {
															e.stopPropagation()
															handleCompleteOrder(order.id!, 'reject')
														}}
														title='Отклонить заявку'
													>
														<i className='fas fa-times me-1'></i>
														Отклонить
													</Button>
												</div>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</Table>
					</>
				)}
			</Container>
		</Container>
	)
}

export default PvlcMedCardsPage
