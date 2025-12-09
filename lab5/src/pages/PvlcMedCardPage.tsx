// src/pages/PvlcMedCardPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import {
	Container,
	Button,
	Alert,
	Spinner,
	Form,
	Row,
	Col,
	Badge,
} from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
	getOrderDetail,
	updateOrder,
	deleteOrder,
	formOrder,
	clearOrdersError,
	updateCalculationHeight,
} from '../store/slices/ordersSlice'
import { deleteCalculation } from '../store/slices/medCalculationsSlice'
import { getCartIcon } from '../store/slices/cartSlice'
import Breadcrumbs from '../components/Breadcrumbs'
import { apiService } from '../services/api'
import type {
	DsPvlcMedCardResponse,
	DsMedMmPvlcCalculationResponse,
} from '../api'

// Типы из нашей локальной типизации
//import type { PvlcMedCard, MedCalculation, CartIconResponse } from '../types'

// Тип для состояния сохранения роста
interface HeightSaveState {
	[formulaId: number]: boolean
}

// Тип для хранения значений роста
interface HeightValues {
	[formulaId: number]: number
}

// Тип для прогресса расчета
interface CalculationProgress {
	calculated: number
	total: number
	percent: number
}

// Типы для локального состояния формы
interface FormData {
	patient_name: string
	doctor_name: string
}

const PvlcMedCardPage: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние из Redux
	const { currentOrder, loading, error, updatingHeight } = useAppSelector(
		state => state.orders
	)
	const { isAuthenticated } = useAppSelector(state => state.auth)
	const { loading: deletingCalculation } = useAppSelector(
		state => state.medCalculations
	)

	// Локальное состояние для редактирования
	const [editMode, setEditMode] = useState<boolean>(false)
	const [formData, setFormData] = useState<FormData>({
		patient_name: '',
		doctor_name: '',
	})

	// Локальное состояние для роста
	const [heightValues, setHeightValues] = useState<HeightValues>({})
	const [heightSaved, setHeightSaved] = useState<HeightSaveState>({})

	// Состояние для отслеживания прогресса расчета
	const [calculationProgress, setCalculationProgress] =
		useState<CalculationProgress | null>(null)

	// Проверяем, является ли заявка черновиком
	const isDraft = currentOrder?.status === 'черновик'

	// ==================== ВАЖНОЕ ИСПРАВЛЕНИЕ ====================
	// Функция для проверки состояния асинхронного расчета
	const checkAsyncCalculationStatus = useCallback((): {
		isCompleted: boolean
		isAsyncCalculated: boolean
		hasCalculations: boolean
	} => {
		if (!currentOrder) {
			return {
				isCompleted: false,
				isAsyncCalculated: false,
				hasCalculations: false,
			}
		}

		const isCompleted: boolean = currentOrder.status === 'завершен'
		// ==================== КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ====================
		// Используем явную проверку на true, так как поле может быть undefined
		const isAsyncCalculated: boolean = currentOrder.async_calculated === true
		const hasCalculations: boolean = Boolean(
			currentOrder.med_calculations && currentOrder.med_calculations.length > 0
		)

		return {
			isCompleted,
			isAsyncCalculated,
			hasCalculations,
		}
	}, [currentOrder])

	// Загружаем данные заявки при монтировании
	useEffect(() => {
		if (id && isAuthenticated) {
			const parsedId = parseInt(id, 10)
			if (!isNaN(parsedId)) {
				dispatch(getOrderDetail(parsedId))
			}
		}
	}, [dispatch, id, isAuthenticated])

	// Синхронизация формы с данными из Redux
	useEffect(() => {
		if (currentOrder) {
			// Обновляем форму данными из текущей заявки
			setFormData({
				patient_name: currentOrder.patient_name || '',
				doctor_name: currentOrder.doctor_name || '',
			})

			// Инициализируем значения роста из расчетов
			const initialHeights: HeightValues = {}
			const initialSaved: HeightSaveState = {}

			if (
				currentOrder.med_calculations &&
				currentOrder.med_calculations.length > 0
			) {
				currentOrder.med_calculations.forEach(
					(calc: DsMedMmPvlcCalculationResponse) => {
						const formulaId = calc.pvlc_med_formula_id
						const inputHeight = calc.input_height

						if (formulaId && inputHeight) {
							initialHeights[formulaId] = inputHeight
							initialSaved[formulaId] = true // Уже сохранено в БД
						}
					}
				)
			}

			setHeightValues(initialHeights)
			setHeightSaved(initialSaved)

			// ==================== ИСПРАВЛЕННЫЙ РАСЧЕТ ПРОГРЕССА ====================
			const { isCompleted, isAsyncCalculated } = checkAsyncCalculationStatus()

			if (isCompleted && currentOrder.med_calculations) {
				const totalCalculations: number = currentOrder.med_calculations.length
				const calculatedCount: number = currentOrder.calculated_count || 0

				// Для асинхронного расчета показываем прогресс только если async_calculated = true
				if (isAsyncCalculated) {
					setCalculationProgress({
						calculated: calculatedCount,
						total: totalCalculations,
						percent:
							totalCalculations > 0
								? (calculatedCount / totalCalculations) * 100
								: 0,
					})
				} else {
					// Для расчета в процессе не показываем прогресс
					setCalculationProgress(null)
				}
			} else {
				setCalculationProgress(null)
			}
		}
	}, [currentOrder, checkAsyncCalculationStatus])

	// Если пользователь не авторизован, перенаправляем на вход
	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
		}
	}, [isAuthenticated, navigate])

	// Очищаем ошибку при размонтировании
	useEffect(() => {
		return () => {
			dispatch(clearOrdersError())
		}
	}, [dispatch])

	// ==================== ФУНКЦИИ ОБРАБОТКИ СОБЫТИЙ ====================

	// Функция обработки изменения полей формы
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const { name, value } = e.target
		setFormData({
			...formData,
			[name]: value,
		})
	}

	// Функция обработки изменения роста
	const handleHeightChange = (formulaId: number, value: string): void => {
		const numValue: number = parseFloat(value) || 0

		// Обновляем локальное состояние
		setHeightValues({
			...heightValues,
			[formulaId]: numValue,
		})

		// Сбрасываем статус сохранения при изменении значения
		setHeightSaved({
			...heightSaved,
			[formulaId]: false,
		})
	}

	// Функция ручного сохранения роста
	const handleSaveHeight = async (formulaId: number): Promise<void> => {
		if (!id || !currentOrder?.id) {
			alert('Некорректный ID заявки')
			return
		}

		const height: number = heightValues[formulaId]
		if (!height || height <= 0) {
			alert('Введите корректное значение роста (больше 0)')
			return
		}

		try {
			await dispatch(
				updateCalculationHeight({
					cardId: currentOrder.id,
					formulaId,
					height,
				})
			).unwrap()

			// Помечаем как сохраненное
			setHeightSaved({
				...heightSaved,
				[formulaId]: true,
			})

			console.log(`Рост для формулы ${formulaId} сохранен`)
		} catch (err) {
			console.error('Ошибка сохранения роста:', err)
			alert('Ошибка при сохранении роста')
		}
	}

	// Функция сохранения данных заявки
	const handleSave = async (): Promise<void> => {
		if (!id) {
			alert('Некорректный ID заявки')
			return
		}

		const parsedId: number = parseInt(id, 10)
		if (isNaN(parsedId)) {
			alert('Некорректный ID заявки')
			return
		}

		try {
			await dispatch(
				updateOrder({
					id: parsedId,
					data: formData,
				})
			).unwrap()

			console.log('Заявка сохранена')

			// Выходим из режима редактирования
			setEditMode(false)

			// Обновляем данные заявки после сохранения
			dispatch(getOrderDetail(parsedId))
		} catch (err) {
			console.error('Ошибка сохранения заявки:', err)
			alert('Ошибка сохранения заявки')
		}
	}

	// Функция отмены редактирования
	const handleCancel = (): void => {
		// Восстанавливаем исходные данные из currentOrder
		if (currentOrder) {
			setFormData({
				patient_name: currentOrder.patient_name || '',
				doctor_name: currentOrder.doctor_name || '',
			})
		}
		setEditMode(false)
	}

	// Функция удаления заявки
	const handleDelete = async (): Promise<void> => {
		if (!id) {
			alert('Некорректный ID заявки')
			return
		}

		const parsedId: number = parseInt(id, 10)
		if (isNaN(parsedId)) {
			alert('Некорректный ID заявки')
			return
		}

		if (window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
			await dispatch(deleteOrder(parsedId))
			// Обновляем иконку корзины
			dispatch(getCartIcon())
			navigate('/pvlc_med_cards')
		}
	}

	// Функция формирования заявки
	const handleFormOrder = async (): Promise<void> => {
		if (!id) {
			alert('Некорректный ID заявки')
			return
		}

		const parsedId: number = parseInt(id, 10)
		if (isNaN(parsedId)) {
			alert('Некорректный ID заявки')
			return
		}

		if (
			window.confirm(
				'Сформировать заявку? После этого редактирование будет невозможно.'
			)
		) {
			await dispatch(formOrder(parsedId))
			// Обновляем данные
			dispatch(getOrderDetail(parsedId))
		}
	}

	// Функция для удаления формулы из заявки
	const handleDeleteCalculation = async (
		cardId: number,
		formulaId: number
	): Promise<void> => {
		if (window.confirm('Удалить эту формулу из заявки?')) {
			try {
				await dispatch(
					deleteCalculation({
						card_id: cardId,
						pvlc_med_formula_id: formulaId,
					})
				).unwrap()

				// Обновляем данные заявки
				if (id) {
					const parsedId: number = parseInt(id, 10)
					if (!isNaN(parsedId)) {
						dispatch(getOrderDetail(parsedId))
						// Обновляем иконку корзины
						dispatch(getCartIcon())
					}
				}
			} catch (err) {
				console.error('Ошибка удаления формулы:', err)
				alert('Ошибка удаления формулы')
			}
		}
	}

	// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

	// Функция форматирования даты
	const formatDate = (dateString?: string): string => {
		if (!dateString) return '—'

		try {
			const date: Date = new Date(dateString)
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

	// Функция получения URL изображения
	const getImageUrl = (imageUrl?: string): string => {
		if (!imageUrl) return '/DefaultImage.jpg'

		try {
			return apiService.getImageUrl(imageUrl)
		} catch {
			return '/DefaultImage.jpg'
		}
	}

	// Функция для получения цвета бейджа статуса
	const getStatusBadgeColor = (status?: string): string => {
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

	// Вспомогательная функция для безопасного получения ID формулы
	const getFormulaId = (calc: DsMedMmPvlcCalculationResponse): number => {
		return calc.pvlc_med_formula_id || 0
	}

	// Вспомогательная функция для безопасного получения ID заявки
	const getCardId = (order: DsPvlcMedCardResponse): number => {
		return order.id || 0
	}

	// ==================== ФУНКЦИИ ОТОБРАЖЕНИЯ ====================

	// Функция для отображения статуса асинхронного расчета
	const renderCalculationStatus = (): React.ReactNode => {
		if (!currentOrder) return null

		const { isCompleted, isAsyncCalculated, hasCalculations } =
			checkAsyncCalculationStatus()

		if (!isCompleted) return null

		if (isAsyncCalculated && calculationProgress) {
			return (
				<Alert variant='success' className='mt-3'>
					<h5>
						<i className='fas fa-check-circle me-2'></i>
						Асинхронный расчет ДЖЕЛ завершен [ЛР8]
					</h5>
					<p className='mb-1'>
						<strong>Общий результат:</strong>{' '}
						{currentOrder.total_result?.toFixed(2) || '0.00'} л
					</p>
					<p className='mb-1'>
						<strong>Рассчитано пациентов:</strong>{' '}
						{calculationProgress.calculated} из {calculationProgress.total}
					</p>
					{calculationProgress.percent > 0 && (
						<div className='mt-2'>
							<div className='progress' style={{ height: '20px' }}>
								<div
									className='progress-bar progress-bar-striped progress-bar-animated'
									role='progressbar'
									style={{ width: `${calculationProgress.percent}%` }}
									aria-valuenow={calculationProgress.percent}
									aria-valuemin={0}
									aria-valuemax={100}
								>
									{calculationProgress.percent.toFixed(0)}%
								</div>
							</div>
							<small className='text-muted'>
								Прогресс асинхронного расчета (short polling)
							</small>
						</div>
					)}
				</Alert>
			)
		} else if (isCompleted && !isAsyncCalculated && hasCalculations) {
			return (
				<Alert variant='warning' className='mt-3'>
					<h5>
						<i className='fas fa-spinner fa-spin me-2'></i>
						Асинхронный расчет ДЖЕЛ выполняется [ЛР8]
					</h5>
					<p className='mb-0'>
						Расчет выполняется в фоновом режиме через Django сервис. Обновите
						страницу через 5-10 секунд для получения результатов.
					</p>
					<small className='text-muted'>
						Используется short polling для автоматического обновления
					</small>
				</Alert>
			)
		}

		return null
	}

	// Функция для отображения результата расчета
	const renderCalculationResult = (
		calc: DsMedMmPvlcCalculationResponse
	): React.ReactNode => {
		if (!currentOrder) return null

		const { isCompleted, isAsyncCalculated } = checkAsyncCalculationStatus()
		const hasResult: boolean = !!(calc.final_result && calc.final_result > 0)

		// ==================== ИСПРАВЛЕННАЯ ЛОГИКА ОТОБРАЖЕНИЯ ====================
		// 1. Если расчет завершен И async_calculated = true И есть результат
		if (isCompleted && isAsyncCalculated && hasResult) {
			return (
				<div className='text-success'>
					<strong>{calc.final_result?.toFixed(2) || '0.00'} л</strong>
					<Badge bg='info' className='ms-2' title='Асинхронный расчет [ЛР8]'>
						Асинхр.
					</Badge>
				</div>
			)
		}
		// 2. Если расчет завершен И async_calculated = true НО нет результата
		else if (isCompleted && isAsyncCalculated && !hasResult) {
			return (
				<div className='text-danger'>
					<i className='fas fa-exclamation-triangle me-1'></i>
					Ошибка расчета
				</div>
			)
		}
		// 3. Если расчет завершен НО async_calculated = false (в процессе)
		else if (isCompleted && !isAsyncCalculated) {
			return (
				<div className='text-warning'>
					<i className='fas fa-spinner fa-spin me-1'></i>
					Расчет выполняется...
				</div>
			)
		}
		// 4. Если расчет не выполнялся или другая ситуация
		else {
			return <span className='text-muted'>не рассчитано</span>
		}
	}

	// ==================== СОСТОЯНИЯ ЗАГРУЗКИ И ОШИБОК ====================

	// Состояние загрузки
	if (loading) {
		return (
			<Container className='text-center py-5'>
				<Spinner animation='border' role='status'>
					<span className='visually-hidden'>Загрузка...</span>
				</Spinner>
				<div className='mt-2'>Загрузка заявки...</div>
			</Container>
		)
	}

	// Обработка ошибок
	if (error) {
		return (
			<Container>
				<Breadcrumbs
					items={[
						{ label: 'Главная', path: '/pvlc_home_page' },
						{ label: 'Мои заявки', path: '/pvlc_med_cards' },
						{ label: 'Ошибка' },
					]}
				/>
				<Alert variant='danger'>{error}</Alert>
				<Button variant='primary' onClick={() => navigate('/pvlc_med_cards')}>
					Вернуться к списку
				</Button>
			</Container>
		)
	}

	// Если заявка не найдена
	if (!currentOrder) {
		return (
			<Container>
				<Breadcrumbs
					items={[
						{ label: 'Главная', path: '/pvlc_home_page' },
						{ label: 'Мои заявки', path: '/pvlc_med_cards' },
						{ label: 'Не найдено' },
					]}
				/>
				<Alert variant='warning'>Заявка не найдена</Alert>
				<Button variant='primary' onClick={() => navigate('/pvlc_med_cards')}>
					Вернуться к списку
				</Button>
			</Container>
		)
	}

	// ==================== РЕНДЕРИНГ КОМПОНЕНТА ====================

	return (
		<Container fluid className='px-0'>
			<Breadcrumbs
				items={[
					{ label: 'Главная', path: '/pvlc_home_page' },
					{ label: 'Мои заявки', path: '/pvlc_med_cards' },
					{ label: `Заявка #${currentOrder.id || 'N/A'}` },
				]}
			/>

			<main className='main-content'>
				<div className='container'>
					{/* Заголовок страницы */}
					<div className='page-header'>
						<h1 className='page-title'>
							Расчёт должной жизненной емкости лёгких (ДЖЕЛ)
						</h1>
					</div>

					{/* Информация о заявке */}
					<div
						className='card mb-4'
						style={{ margin: '0 auto', maxWidth: '1050px' }}
					>
						<div className='card-body'>
							<Row className='mb-3'>
								<Col md={3}>
									<Form.Group>
										<Form.Label>Статус</Form.Label>
										<div>
											<Badge bg={getStatusBadgeColor(currentOrder.status)}>
												{currentOrder.status || 'Неизвестно'}
												{currentOrder.async_calculated && (
													<span
														className='ms-1'
														title='Асинхронный расчет [ЛР8]'
													>
														⚡
													</span>
												)}
											</Badge>
										</div>
									</Form.Group>
								</Col>
								<Col md={3}>
									<Form.Group>
										<Form.Label>Общий результат ДЖЕЛ</Form.Label>
										<div>
											<strong>
												{currentOrder.total_result?.toFixed(2) || '0.00'} л
											</strong>
											{currentOrder.async_calculated && (
												<Badge
													bg='info'
													className='ms-2'
													title='Асинхронный расчет [ЛР8]'
												>
													Асинхр.
												</Badge>
											)}
										</div>
									</Form.Group>
								</Col>
								<Col md={3}>
									<Form.Group>
										<Form.Label>Дата создания</Form.Label>
										<div>
											<strong>{formatDate(currentOrder.created_at)}</strong>
										</div>
									</Form.Group>
								</Col>
								<Col md={3}>
									<Form.Group>
										<Form.Label>Дата обновления</Form.Label>
										<div>
											<strong>
												{formatDate(
													currentOrder.updated_at ||
														currentOrder.finalized_at ||
														currentOrder.completed_at ||
														currentOrder.created_at
												)}
											</strong>
										</div>
									</Form.Group>
								</Col>
							</Row>

							{/* Статус асинхронного расчета */}
							{renderCalculationStatus()}

							<Row>
								<Col md={6}>
									<Form.Group className='mb-3'>
										<Form.Label>Пациент</Form.Label>
										{editMode ? (
											<Form.Control
												type='text'
												name='patient_name'
												value={formData.patient_name}
												onChange={handleInputChange}
												placeholder='Введите ФИО пациента'
												disabled={!isDraft}
											/>
										) : (
											<div>{formData.patient_name || '-'}</div>
										)}
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group className='mb-3'>
										<Form.Label>Врач</Form.Label>
										{editMode ? (
											<Form.Control
												type='text'
												name='doctor_name'
												value={formData.doctor_name}
												onChange={handleInputChange}
												placeholder='Введите ФИО врача'
												disabled={!isDraft}
											/>
										) : (
											<div>{formData.doctor_name || '-'}</div>
										)}
									</Form.Group>
								</Col>
							</Row>
						</div>
					</div>

					{/* Выбранные формулы в стиле HTML-примера */}
					<section className='selected-categories'>
						<h2 className='section-title'>Выбранные категории (пациенты)</h2>

						{/* Информация о количестве пациентов */}
						{currentOrder.med_calculations &&
							currentOrder.med_calculations.length > 0 && (
								<div className='mb-3'>
									<small className='text-muted'>
										Всего пациентов: {currentOrder.med_calculations.length} |
										Рассчитано: {currentOrder.calculated_count || 0} | Статус:{' '}
										{currentOrder.async_calculated
											? 'Асинхронный расчет завершен'
											: 'Ожидается расчет'}
									</small>
								</div>
							)}

						{currentOrder.med_calculations &&
						currentOrder.med_calculations.length > 0 ? (
							<div className='categories-grid'>
								{currentOrder.med_calculations.map(
									(calc: DsMedMmPvlcCalculationResponse, index: number) => {
										const formulaId: number = getFormulaId(calc)
										const cardId: number = getCardId(currentOrder)

										return (
											<div
												key={`${formulaId}-${index}`}
												className='category-card'
											>
												<div className='category-image-container'>
													<div className='category-image'>
														<img
															src={getImageUrl(calc.image_url)}
															alt={calc.title || `Расчет ${index + 1}`}
															className='category-img'
														/>
													</div>
													<div className='category-title-plain'>
														{calc.title || `Расчет ${index + 1}`}
													</div>
												</div>
												<div className='category-info'>
													<div className='category-details'>
														<div className='parameters-row'>
															{/* Поле для ввода роста с кнопкой сохранения */}
															<div className='parameter-group'>
																<span className='parameter-label'>Рост:</span>
																<input
																	type='number'
																	className='height-input'
																	placeholder='см'
																	min='50'
																	max='250'
																	value={heightValues[formulaId] || ''}
																	onChange={(
																		e: React.ChangeEvent<HTMLInputElement>
																	) =>
																		handleHeightChange(
																			formulaId,
																			e.target.value
																		)
																	}
																	disabled={!isDraft || updatingHeight}
																	style={{ marginRight: '10px' }}
																/>
																{/* Кнопка сохранения роста */}
																{isDraft && formulaId > 0 && (
																	<button
																		type='button'
																		className={`btn btn-${
																			heightSaved[formulaId]
																				? 'success'
																				: 'outline-primary'
																		} btn-sm`}
																		onClick={() => handleSaveHeight(formulaId)}
																		disabled={updatingHeight}
																		title={
																			heightSaved[formulaId]
																				? 'Сохранено'
																				: 'Сохранить рост'
																		}
																		style={{
																			padding: '0.4rem 0.6rem',
																			minWidth: '40px',
																			display: 'flex',
																			alignItems: 'center',
																			justifyContent: 'center',
																		}}
																	>
																		{updatingHeight ? (
																			<Spinner
																				as='span'
																				animation='border'
																				size='sm'
																			/>
																		) : heightSaved[formulaId] ? (
																			<span style={{ fontSize: '16px' }}>
																				✓
																			</span>
																		) : (
																			<span style={{ fontSize: '16px' }}>
																				✓
																			</span>
																		)}
																	</button>
																)}
															</div>
															{/* Результат ДЖЕЛ */}
															<div className='parameter-group'>
																<span className='parameter-label'>
																	Результат ДЖЕЛ:
																</span>
																<div className='result-display'>
																	{renderCalculationResult(calc)}
																</div>
															</div>
															{/* Кнопка удаления формулы */}
															{isDraft && cardId > 0 && formulaId > 0 && (
																<div className='parameter-group'>
																	<button
																		type='button'
																		className='btn btn-danger btn-sm'
																		onClick={() =>
																			handleDeleteCalculation(cardId, formulaId)
																		}
																		title='Удалить из заявки'
																		disabled={
																			deletingCalculation || updatingHeight
																		}
																		style={{
																			padding: '0.4rem 0.8rem',
																			marginLeft: '10px',
																			display: 'flex',
																			alignItems: 'center',
																			justifyContent: 'center',
																		}}
																	>
																		{deletingCalculation ? (
																			<Spinner
																				as='span'
																				animation='border'
																				size='sm'
																			/>
																		) : (
																			'🗑️'
																		)}
																	</button>
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
										)
									}
								)}
							</div>
						) : (
							<Alert variant='info'>
								В этой заявке нет выбранных формул. Добавьте формулы на странице
								категорий.
							</Alert>
						)}
					</section>

					{/* Кнопки действий */}
					<section className='action-buttons'>
						<div className='buttons-container'>
							{isDraft && (
								<>
									{editMode ? (
										<>
											<Button
												variant='success'
												onClick={handleSave}
												className='btn-calculate'
												disabled={updatingHeight}
											>
												Сохранить
											</Button>
											<Button
												variant='secondary'
												onClick={handleCancel}
												disabled={updatingHeight}
											>
												Отмена
											</Button>
										</>
									) : (
										<Button
											variant='primary'
											onClick={() => setEditMode(true)}
											className='btn-calculate'
											disabled={updatingHeight}
										>
											Редактировать
										</Button>
									)}
									<Button
										variant='warning'
										onClick={handleFormOrder}
										className='btn-calculate'
										disabled={updatingHeight}
									>
										Сформировать
									</Button>
									<Button
										variant='danger'
										onClick={handleDelete}
										className='btn-delete'
										disabled={updatingHeight}
									>
										Удалить заявку
									</Button>
								</>
							)}
						</div>
					</section>
				</div>
			</main>
		</Container>
	)
}

export default PvlcMedCardPage
