//src/types/index.ts
export interface PvlcMedFormula {
	id: number
	title: string
	description: string
	formula: string
	image_url: string
	category: string
	gender: string
	min_age: number
	max_age: number
	is_active: boolean
}

export interface PvlcMedFormulaFilter {
	category?: string
	gender?: string
	min_age?: number
	max_age?: number
	active?: boolean
}

// НАЧАЛО ДОБАВЛЕНИЯ - интерфейс для фильтра заявок
export interface PvlcMedCardFilter {
	date_from?: string
	updated_date_from?: string
	status?: string
}
// КОНЕЦ ДОБАВЛЕНИЯ

export interface BreadcrumbItem {
	label: string
	path?: string
}

export interface MedUser {
	id: number
	login: string
	is_moderator: boolean
}

// НАЧАЛО НОВЫХ ДОБАВЛЕНИЙ - тип для ответа корзины
export interface CartIconResponse {
	med_card_id: number
	med_item_count: number
}
// КОНЕЦ НОВЫХ ДОБАВЛЕНИЙ
// ==================== ДОБАВЛЯЕМ НОВЫЙ ТИП ====================
// Для заявки с асинхронными полями
export interface PvlcMedCard {
	id: number
	status: string
	created_at: string
	updated_at: string
	patient_name: string
	doctor_name: string
	finalized_at?: string
	completed_at?: string
	total_result: number
	med_calculations: MedCalculation[]

	// ==================== НОВЫЕ ПОЛЯ ====================
	// Для отображения прогресса асинхронных вычислений
	calculated_count: number // сколько формул уже рассчитано
	async_calculated: boolean // true если расчет завершен
	calculation_progress?: number // прогресс в процентах (0-100)
}

export interface MedCalculation {
	pvlc_med_formula_id: number
	title: string
	description: string
	formula: string
	image_url: string
	input_height: number
	final_result: number
}

// ==================== ДОБАВЛЯЕМ НОВЫЙ ТИП ====================
// Для фильтрации по создателю (только на фронтенде)
export interface FrontendFilter {
	creator_login?: string // фильтр по логину создателя
	show_only_mine?: boolean // показывать только мои заявки
}
