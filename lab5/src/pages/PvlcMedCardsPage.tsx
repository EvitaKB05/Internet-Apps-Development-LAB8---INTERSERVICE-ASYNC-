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
} from '../store/slices/ordersSlice'
import Breadcrumbs from '../components/Breadcrumbs'
import type { DsPvlcMedCardResponse } from '../api'
import type { PvlcMedCardFilter } from '../types'

const PvlcMedCardsPage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние фильтров из Redux
	const { orders, loading, error, filter } = useAppSelector(
		state => state.orders
	)
	const { isAuthenticated } = useAppSelector(state => state.auth)

	// ИСПРАВЛЕНИЕ: Убираем таймер для debounce (теперь фильтры по кнопке)
	// const [filterTimer, setFilterTimer] = useState<number | null>(null)

	// Локальное состояние для формы фильтрации
	const [localFilter, setLocalFilter] = useState<PvlcMedCardFilter>({
		date_from: '',
		updated_date_from: '',
		status: '',
	})

	// ИСПРАВЛЕНИЕ: Состояние для отслеживания изменений фильтров
	const [filtersChanged, setFiltersChanged] = useState<boolean>(false)

	// Инициализируем локальное состояние при загрузке
	useEffect(() => {
		setLocalFilter(filter)
		setFiltersChanged(false) // Сбрасываем флаг изменений при загрузке
	}, [filter])

	// Фильтруем заявки: исключаем черновики из отображения
	const filteredOrders = orders.filter(order => order.status !== 'черновик')

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

	// ИСПРАВЛЕНИЕ: Сбрасываем фильтры при уходе со страницы
	useEffect(() => {
		return () => {
			// Этот эффект выполняется при размонтировании компонента
			// (когда пользователь уходит с этой страницы)
			console.log('PvlcMedCardsPage unmounting, resetting filters...')
			dispatch(resetOrdersFilter())

			// ИСПРАВЛЕНИЕ: Убрали очистку таймера
			// if (filterTimer !== null) {
			// 	clearTimeout(filterTimer)
			// }
		}
	}, [dispatch]) // ИСПРАВЛЕНИЕ: Убрали filterTimer из зависимостей

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
		}
	}, [isAuthenticated, navigate])

	// ИСПРАВЛЕНИЕ: Обработчик изменения фильтра (без debounce)
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

	// // ИСПРАВЛЕНИЕ: Обработчик сброса фильтра
	// const handleResetFilter = () => {
	// 	dispatch(resetOrdersFilter())
	// 	setLocalFilter({
	// 		date_from: '',
	// 		updated_date_from: '',
	// 		status: '',
	// 	})
	// 	setFiltersChanged(false)
	// }

	// ИСПРАВЛЕНИЕ: Обработчик применения фильтров
	const handleApplyFilters = () => {
		dispatch(setOrdersFilter(localFilter))
		setFiltersChanged(false) // Сбрасываем флаг после применения
	}

	// ИСПРАВЛЕНИЕ: Убрали useEffect для очистки таймера
	// useEffect(() => {
	// 	return () => {
	// 		if (filterTimer !== null) {
	// 			clearTimeout(filterTimer)
	// 		}
	// 	}
	// }, [filterTimer])

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

	// ИСПРАВЛЕНИЕ: Функция для перехода к заявке по клику на строку
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

	// ИСПРАВЛЕНИЕ: список доступных статусов (исключаем черновик из выпадающего списка)
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
				</Container>
			</div>

			<Container>
				{/* Панель фильтрации */}
				<div className='bg-light p-4 rounded mb-4'>
					<h5 className='mb-3'>Фильтрация заявок</h5>
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
									<Form.Text className='text-muted'>
										Фильтр по дате создания заявки
									</Form.Text>
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
									<Form.Text className='text-muted'>
										Фильтр по дате последнего обновления
									</Form.Text>
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
								</Form.Group>
							</Col>
						</Row>

						{/* ИСПРАВЛЕНИЕ: Добавлены кнопки применения и сброса фильтров */}
						<Row className='mt-3'>
							<Col className='d-flex gap-2'>
								<Button
									variant='primary'
									onClick={handleApplyFilters}
									disabled={!filtersChanged || loading}
								>
									Применить фильтры
								</Button>
								{/* <Button
									variant='outline-secondary'
									onClick={handleResetFilter}
									disabled={loading}
								>
									Сбросить фильтры
								</Button> */}
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
				) : filteredOrders.length === 0 ? (
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
									Применены фильтры:
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

						{/* ИСПРАВЛЕНИЕ: Добавлен класс для кликабельных строк */}
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
									<th>Дата создания</th>
									<th>Дата обновления</th>
									{/* <th>Действия</th> */}
								</tr>
							</thead>
							<tbody>
								{filteredOrders.map(order => (
									<tr
										key={order.id}
										// ИСПРАВЛЕНИЕ: Добавляем обработчик клика на строку
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
											{order.total_result ? `${order.total_result} л` : '—'}
										</td>
										<td>{formatDate(getCreatedDate(order))}</td>
										<td>{formatDate(getUpdatedDate(order))}</td>
										<td>
											{/* ИСПРАВЛЕНИЕ: Обновленный обработчик для кнопки
											<Button
												variant='outline-primary'
												size='sm'
												onClick={event => {
													event.stopPropagation() // Предотвращаем всплытие клика на строку
													handleOrderButtonClick(order.id!)
												}}
											>
												Подробнее
											</Button> */}
										</td>
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
