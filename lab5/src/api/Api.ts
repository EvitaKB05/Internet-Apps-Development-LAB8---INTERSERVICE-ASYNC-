/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ApiLoginRequest {
	login: string
	password: string
}

export interface ApiLoginResponse {
	expires_at?: string
	token?: string
	user?: DsMedUserResponse
}

export interface DsAsyncResultUpdateRequest {
	/** AsyncCalculated - флаг что расчет асинхронный */
	async_calculated?: boolean
	/**
	 * AsyncKey - ключ для авторизации (ОБЯЗАТЕЛЬНОЕ ПОЛЕ!)
	 * Django должен отправлять тот же ключ что и в константе AsyncServiceKey
	 */
	async_key: string
	/** CalculatedCount - сколько формул рассчитано */
	calculated_count?: number
	/**
	 * ==================== ДОБАВЛЯЕМ ПОЛЕ ДЛЯ ИНДИВИДУАЛЬНЫХ РЕЗУЛЬТАТОВ ====================
	 * IndividualResults - результаты для каждого расчета (пациента)
	 */
	individual_results?: DsIndividualResult[]
	/** TotalResult - результат расчета ДЖЕЛ от Django */
	total_result: number
}

export interface DsCartIconResponse {
	med_card_id?: number
	med_item_count?: number
}

export interface DsCompletePvlcMedCardRequest {
	/** "complete" или "reject" */
	action: string
}

export interface DsCreatePvlcMedFormulaRequest {
	category: string
	description?: string
	formula: string
	gender: string
	max_age: number
	min_age: number
	title: string
}

export interface DsDeleteMedMmPvlcCalculationRequest {
	card_id: number
	pvlc_med_formula_id: number
}

export interface DsIndividualResult {
	formula_id?: number
	individual_result?: number
	input_height?: number
	title?: string
}

export interface DsLoginMedUserRequest {
	login: string
	password: string
}

export interface DsMedMmPvlcCalculationResponse {
	description?: string
	final_result?: number
	formula?: string
	image_url?: string
	input_height?: number
	pvlc_med_formula_id?: number
	title?: string
}

export interface DsMedUserRegistrationRequest {
	is_moderator?: boolean
	login: string
	password: string
}

export interface DsMedUserResponse {
	id?: number
	is_moderator?: boolean
	login?: string
}

export interface DsPvlcMedCardResponse {
	/**
	 * AsyncCalculated - флаг асинхронного расчета
	 * Во фронтенде по этому полю можно показать "расчет завершен"
	 */
	async_calculated?: boolean
	/**
	 * CalculatedCount - количество рассчитанных формул
	 * Отправляется во фронтенд для отображения прогресса
	 */
	calculated_count?: number
	/**
	 * CalculationProgress - прогресс вычислений в процентах (0-100)
	 * Рассчитывается на лету: (CalculatedCount / общее количество формул) * 100
	 * Не хранится в БД, только в ответе API
	 */
	calculation_progress?: number
	completed_at?: string
	created_at?: string
	doctor_name?: string
	finalized_at?: string
	id?: number
	med_calculations?: DsMedMmPvlcCalculationResponse[]
	patient_name?: string
	status?: string
	total_result?: number
	/** ДОБАВЛЕНО */
	updated_at?: string
}

export interface DsPvlcMedFormulaResponse {
	category?: string
	description?: string
	formula?: string
	gender?: string
	id?: number
	image_url?: string
	is_active?: boolean
	max_age?: number
	min_age?: number
	title?: string
}

export interface DsUpdateMedMmPvlcCalculationAPIRequest {
	card_id: number
	data: DsUpdateMedMmPvlcCalculationRequest
	pvlc_med_formula_id: number
}

export interface DsUpdateMedMmPvlcCalculationRequest {
	input_height: number
}

export interface DsUpdateMedUserRequest {
	password?: string
}

export interface DsUpdatePvlcMedCardRequest {
	doctor_name?: string
	patient_name?: string
}

export interface DsUpdatePvlcMedFormulaRequest {
	category?: string
	description?: string
	formula?: string
	gender?: string
	is_active?: boolean
	max_age?: number
	min_age?: number
	title?: string
}

export interface PvlcMedCardsAsyncResultUpdateParams {
	/** ID заявки */
	id: number
}

export interface PvlcMedCardsCompleteUpdateParams {
	/** ID заявки */
	id: number
}

export interface PvlcMedCardsDeleteParams {
	/** ID заявки */
	id: number
}

export interface PvlcMedCardsDetailParams {
	/** ID заявки */
	id: number
}

export interface PvlcMedCardsFormUpdateParams {
	/** ID заявки */
	id: number
}

export interface PvlcMedCardsListParams {
	/** Фильтр по дате создания от (YYYY-MM-DD) */
	date_from?: string
	/** Фильтр по дате создания до (YYYY-MM-DD) */
	date_to?: string
	/** Фильтр по статусу */
	status?: string
	/** Фильтр по дате обновления от (YYYY-MM-DD) */
	updated_date_from?: string
	/** Фильтр по дате обновления до (YYYY-MM-DD) */
	updated_date_to?: string
}

export interface PvlcMedCardsUpdateParams {
	/** ID заявки */
	id: number
}

export interface PvlcMedFormulasAddToCartCreateParams {
	/** ID формулы */
	id: number
}

export interface PvlcMedFormulasDeleteParams {
	/** ID формулы */
	id: number
}

export interface PvlcMedFormulasDetailParams {
	/** ID формулы */
	id: number
}

export interface PvlcMedFormulasImageCreateParams {
	/** ID формулы */
	id: number
}

export interface PvlcMedFormulasImageCreatePayload {
	/** Изображение формулы */
	image: File
}

export interface PvlcMedFormulasListParams {
	/** Активные формулы */
	active?: boolean
	/** Фильтр по категории */
	category?: string
	/** Фильтр по полу */
	gender?: string
	/** Максимальный возраст */
	max_age?: number
	/** Минимальный возраст */
	min_age?: number
}

export interface PvlcMedFormulasUpdateParams {
	/** ID формулы */
	id: number
}

export namespace Api {
	/**
	 * @description Выполняет вход пользователя и возвращает JWT токен
	 * @tags med_auth
	 * @name AuthLoginCreate
	 * @summary Аутентификация пользователя
	 * @request POST:/api/auth/login
	 * @response `200` `ApiLoginResponse` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 */
	export namespace AuthLoginCreate {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = ApiLoginRequest
		export type RequestHeaders = {}
		export type ResponseBody = ApiLoginResponse
	}

	/**
	 * @description Добавляет JWT токен в черный список
	 * @tags med_auth
	 * @name AuthLogoutCreate
	 * @summary Выход пользователя
	 * @request POST:/api/auth/logout
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `500` `Record<string,string>` Internal Server Error
	 */
	export namespace AuthLogoutCreate {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Возвращает информацию о текущем пользователе
	 * @tags med_auth
	 * @name AuthProfileList
	 * @summary Получение профиля пользователя
	 * @request GET:/api/auth/profile
	 * @secure
	 * @response `200` `DsMedUserResponse` OK
	 * @response `401` `Record<string,string>` Unauthorized
	 */
	export namespace AuthProfileList {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = DsMedUserResponse
	}

	/**
	 * @description Возвращает информацию о корзине пользователя (количество items). Для неавторизованных возвращает пустую корзину.
	 * @tags med_card
	 * @name MedCardIconList
	 * @summary Получение иконки корзины
	 * @request GET:/api/med_card/icon
	 * @response `200` `DsCartIconResponse` OK
	 */
	export namespace MedCardIconList {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = DsCartIconResponse
	}

	/**
	 * @description Удаляет связь формулы с заявкой (только для владельца черновика)
	 * @tags med_calculations
	 * @name MedMmPvlcCalculationsDelete
	 * @summary Удаление расчета из заявки
	 * @request DELETE:/api/med-mm-pvlc-calculations
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `500` `Record<string,string>` Internal Server Error
	 */
	export namespace MedMmPvlcCalculationsDelete {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = DsDeleteMedMmPvlcCalculationRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Обновляет данные расчета в заявке (ввод роста)
	 * @tags med_calculations
	 * @name MedMmPvlcCalculationsUpdate
	 * @summary Обновление расчета в заявке
	 * @request PUT:/api/med-mm-pvlc-calculations
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `500` `Record<string,string>` Internal Server Error
	 */
	export namespace MedMmPvlcCalculationsUpdate {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = DsUpdateMedMmPvlcCalculationAPIRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Выполняет вход пользователя
	 * @tags med_users
	 * @name MedUsersLoginCreate
	 * @summary Аутентификация пользователя (старый endpoint)
	 * @request POST:/api/med-users/login
	 * @response `200` `Record<string,any>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 */
	export namespace MedUsersLoginCreate {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = DsLoginMedUserRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, any>
	}

	/**
	 * @description Завершает сессию пользователя
	 * @tags med_users
	 * @name MedUsersLogoutCreate
	 * @summary Выход пользователя (старый endpoint)
	 * @request POST:/api/med-users/logout
	 * @response `200` `Record<string,string>` OK
	 */
	export namespace MedUsersLogoutCreate {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Возвращает информацию о текущем пользователе
	 * @tags med_users
	 * @name MedUsersProfileList
	 * @summary Получение профиля пользователя
	 * @request GET:/api/med-users/profile
	 * @secure
	 * @response `200` `DsMedUserResponse` OK
	 * @response `401` `Record<string,string>` Unauthorized
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace MedUsersProfileList {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = DsMedUserResponse
	}

	/**
	 * @description Обновляет пароль текущего пользователя
	 * @tags med_users
	 * @name MedUsersProfileUpdate
	 * @summary Обновление профиля пользователя
	 * @request PUT:/api/med-users/profile
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 * @response `404` `Record<string,string>` Not Found
	 * @response `500` `Record<string,string>` Internal Server Error
	 */
	export namespace MedUsersProfileUpdate {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = DsUpdateMedUserRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Создает нового пользователя в системе
	 * @tags med_users
	 * @name MedUsersRegisterCreate
	 * @summary Регистрация нового пользователя
	 * @request POST:/api/med-users/register
	 * @secure
	 * @response `200` `Record<string,any>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `500` `Record<string,string>` Internal Server Error
	 */
	export namespace MedUsersRegisterCreate {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = DsMedUserRegistrationRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, any>
	}

	/**
	 * @description Обновляет результаты ДЖЕЛ после асинхронного расчета в Django сервисе Требует правильный ключ авторизации в поле async_key
	 * @tags medical-cards
	 * @name PvlcMedCardsAsyncResultUpdate
	 * @summary Обновление результатов асинхронного расчета
	 * @request PUT:/api/pvlc-med-cards/{id}/async-result
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedCardsAsyncResultUpdate {
		export type RequestParams = {
			/** ID заявки */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = DsAsyncResultUpdateRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Завершает или отклоняет заявку (только для модераторов) При завершении запускает асинхронный расчет ДЖЕЛ в Django сервисе
	 * @tags medical-cards
	 * @name PvlcMedCardsCompleteUpdate
	 * @summary Завершение/отклонение заявки
	 * @request PUT:/api/pvlc-med-cards/{id}/complete
	 * @secure
	 * @response `200` `Record<string,any>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedCardsCompleteUpdate {
		export type RequestParams = {
			/** ID заявки */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = DsCompletePvlcMedCardRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, any>
	}

	/**
	 * @description Удаляет заявку (только черновики и только владельцем)
	 * @tags medical-cards
	 * @name PvlcMedCardsDelete
	 * @summary Удаление заявки
	 * @request DELETE:/api/pvlc-med-cards/{id}
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedCardsDelete {
		export type RequestParams = {
			/** ID заявки */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Возвращает информацию о конкретной заявке
	 * @tags medical-cards
	 * @name PvlcMedCardsDetail
	 * @summary Получение конкретной заявки
	 * @request GET:/api/pvlc-med-cards/{id}
	 * @secure
	 * @response `200` `DsPvlcMedCardResponse` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedCardsDetail {
		export type RequestParams = {
			/** ID заявки */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = DsPvlcMedCardResponse
	}

	/**
	 * @description Переводит заявку из статуса черновика в сформированную
	 * @tags medical-cards
	 * @name PvlcMedCardsFormUpdate
	 * @summary Формирование заявки
	 * @request PUT:/api/pvlc-med-cards/{id}/form
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedCardsFormUpdate {
		export type RequestParams = {
			/** ID заявки */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Возвращает список заявок пользователя (для модераторов - все заявки)
	 * @tags medical-cards
	 * @name PvlcMedCardsList
	 * @summary Получение списка заявок
	 * @request GET:/api/pvlc-med-cards
	 * @secure
	 * @response `200` `(DsPvlcMedCardResponse)[]` OK
	 * @response `401` `Record<string,string>` Unauthorized
	 */
	export namespace PvlcMedCardsList {
		export type RequestParams = {}
		export type RequestQuery = {
			/** Фильтр по дате создания от (YYYY-MM-DD) */
			date_from?: string
			/** Фильтр по дате создания до (YYYY-MM-DD) */
			date_to?: string
			/** Фильтр по статусу */
			status?: string
			/** Фильтр по дате обновления от (YYYY-MM-DD) */
			updated_date_from?: string
			/** Фильтр по дате обновления до (YYYY-MM-DD) */
			updated_date_to?: string
		}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = DsPvlcMedCardResponse[]
	}

	/**
	 * @description Обновляет поля заявки (только для владельца)
	 * @tags medical-cards
	 * @name PvlcMedCardsUpdate
	 * @summary Обновление заявки
	 * @request PUT:/api/pvlc-med-cards/{id}
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedCardsUpdate {
		export type RequestParams = {
			/** ID заявки */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = DsUpdatePvlcMedCardRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Добавляет формулу в заявку-черновик пользователя
	 * @tags med_formulas
	 * @name PvlcMedFormulasAddToCartCreate
	 * @summary Добавление формулы в корзину
	 * @request POST:/api/pvlc-med-formulas/{id}/add-to-cart
	 * @secure
	 * @response `200` `Record<string,any>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `401` `Record<string,string>` Unauthorized
	 */
	export namespace PvlcMedFormulasAddToCartCreate {
		export type RequestParams = {
			/** ID формулы */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, any>
	}

	/**
	 * @description Создает новую формулу для расчета ДЖЕЛ (только для модераторов)
	 * @tags med_formulas
	 * @name PvlcMedFormulasCreate
	 * @summary Создание новой формулы
	 * @request POST:/api/pvlc-med-formulas
	 * @secure
	 * @response `200` `Record<string,any>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `403` `Record<string,string>` Forbidden
	 */
	export namespace PvlcMedFormulasCreate {
		export type RequestParams = {}
		export type RequestQuery = {}
		export type RequestBody = DsCreatePvlcMedFormulaRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, any>
	}

	/**
	 * @description Удаляет формулу ДЖЕЛ (только для модераторов)
	 * @tags med_formulas
	 * @name PvlcMedFormulasDelete
	 * @summary Удаление формулы
	 * @request DELETE:/api/pvlc-med-formulas/{id}
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedFormulasDelete {
		export type RequestParams = {
			/** ID формулы */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Возвращает информацию о конкретной формуле ДЖЕЛ
	 * @tags med_formulas
	 * @name PvlcMedFormulasDetail
	 * @summary Получение конкретной формулы
	 * @request GET:/api/pvlc-med-formulas/{id}
	 * @response `200` `DsPvlcMedFormulaResponse` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedFormulasDetail {
		export type RequestParams = {
			/** ID формулы */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = DsPvlcMedFormulaResponse
	}

	/**
	 * @description Загружает изображение для формулы ДЖЕЛ в MinIO (только для модераторов)
	 * @tags med_formulas
	 * @name PvlcMedFormulasImageCreate
	 * @summary Загрузка изображения для формулы
	 * @request POST:/api/pvlc-med-formulas/{id}/image
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedFormulasImageCreate {
		export type RequestParams = {
			/** ID формулы */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = PvlcMedFormulasImageCreatePayload
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}

	/**
	 * @description Возвращает список формул с возможностью фильтрации
	 * @tags med_formulas
	 * @name PvlcMedFormulasList
	 * @summary Получение списка формул
	 * @request GET:/api/pvlc-med-formulas
	 * @response `200` `(DsPvlcMedFormulaResponse)[]` OK
	 */
	export namespace PvlcMedFormulasList {
		export type RequestParams = {}
		export type RequestQuery = {
			/** Активные формулы */
			active?: boolean
			/** Фильтр по категории */
			category?: string
			/** Фильтр по полу */
			gender?: string
			/** Максимальный возраст */
			max_age?: number
			/** Минимальный возраст */
			min_age?: number
		}
		export type RequestBody = never
		export type RequestHeaders = {}
		export type ResponseBody = DsPvlcMedFormulaResponse[]
	}

	/**
	 * @description Обновляет существующую формулу ДЖЕЛ (только для модераторов)
	 * @tags med_formulas
	 * @name PvlcMedFormulasUpdate
	 * @summary Обновление формулы
	 * @request PUT:/api/pvlc-med-formulas/{id}
	 * @secure
	 * @response `200` `Record<string,string>` OK
	 * @response `400` `Record<string,string>` Bad Request
	 * @response `403` `Record<string,string>` Forbidden
	 * @response `404` `Record<string,string>` Not Found
	 */
	export namespace PvlcMedFormulasUpdate {
		export type RequestParams = {
			/** ID формулы */
			id: number
		}
		export type RequestQuery = {}
		export type RequestBody = DsUpdatePvlcMedFormulaRequest
		export type RequestHeaders = {}
		export type ResponseBody = Record<string, string>
	}
}

import type {
	AxiosInstance,
	AxiosRequestConfig,
	HeadersDefaults,
	ResponseType,
} from 'axios'
import axios from 'axios'

export type QueryParamsType = Record<string | number, any>

export interface FullRequestParams
	extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
	/** set parameter to `true` for call `securityWorker` for this request */
	secure?: boolean
	/** request path */
	path: string
	/** content type of request body */
	type?: ContentType
	/** query params */
	query?: QueryParamsType
	/** format of response (i.e. response.json() -> format: "json") */
	format?: ResponseType
	/** request body */
	body?: unknown
}

export type RequestParams = Omit<
	FullRequestParams,
	'body' | 'method' | 'query' | 'path'
>

export interface ApiConfig<SecurityDataType = unknown>
	extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
	securityWorker?: (
		securityData: SecurityDataType | null
	) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void
	secure?: boolean
	format?: ResponseType
}

export enum ContentType {
	Json = 'application/json',
	JsonApi = 'application/vnd.api+json',
	FormData = 'multipart/form-data',
	UrlEncoded = 'application/x-www-form-urlencoded',
	Text = 'text/plain',
}

export class HttpClient<SecurityDataType = unknown> {
	public instance: AxiosInstance
	private securityData: SecurityDataType | null = null
	private securityWorker?: ApiConfig<SecurityDataType>['securityWorker']
	private secure?: boolean
	private format?: ResponseType

	constructor({
		securityWorker,
		secure,
		format,
		...axiosConfig
	}: ApiConfig<SecurityDataType> = {}) {
		this.instance = axios.create({
			...axiosConfig,
			baseURL: axiosConfig.baseURL || '',
		})
		this.secure = secure
		this.format = format
		this.securityWorker = securityWorker
	}

	public setSecurityData = (data: SecurityDataType | null) => {
		this.securityData = data
	}

	protected mergeRequestParams(
		params1: AxiosRequestConfig,
		params2?: AxiosRequestConfig
	): AxiosRequestConfig {
		const method = params1.method || (params2 && params2.method)

		return {
			...this.instance.defaults,
			...params1,
			...(params2 || {}),
			headers: {
				...((method &&
					this.instance.defaults.headers[
						method.toLowerCase() as keyof HeadersDefaults
					]) ||
					{}),
				...(params1.headers || {}),
				...((params2 && params2.headers) || {}),
			},
		}
	}

	protected stringifyFormItem(formItem: unknown) {
		if (typeof formItem === 'object' && formItem !== null) {
			return JSON.stringify(formItem)
		} else {
			return `${formItem}`
		}
	}

	protected createFormData(input: Record<string, unknown>): FormData {
		if (input instanceof FormData) {
			return input
		}
		return Object.keys(input || {}).reduce((formData, key) => {
			const property = input[key]
			const propertyContent: any[] =
				property instanceof Array ? property : [property]

			for (const formItem of propertyContent) {
				const isFileType = formItem instanceof Blob || formItem instanceof File
				formData.append(
					key,
					isFileType ? formItem : this.stringifyFormItem(formItem)
				)
			}

			return formData
		}, new FormData())
	}

	public request = async <T = any, _E = any>({
		secure,
		path,
		type,
		query,
		format,
		body,
		...params
	}: FullRequestParams): Promise<T> => {
		const secureParams =
			((typeof secure === 'boolean' ? secure : this.secure) &&
				this.securityWorker &&
				(await this.securityWorker(this.securityData))) ||
			{}
		const requestParams = this.mergeRequestParams(params, secureParams)
		const responseFormat = format || this.format || undefined

		if (
			type === ContentType.FormData &&
			body &&
			body !== null &&
			typeof body === 'object'
		) {
			body = this.createFormData(body as Record<string, unknown>)
		}

		if (
			type === ContentType.Text &&
			body &&
			body !== null &&
			typeof body !== 'string'
		) {
			body = JSON.stringify(body)
		}

		return this.instance
			.request({
				...requestParams,
				headers: {
					...(requestParams.headers || {}),
					...(type ? { 'Content-Type': type } : {}),
				},
				params: query,
				responseType: responseFormat,
				data: body,
				url: path,
			})
			.then(response => response.data)
	}
}

/**
 * @title Lung Capacity Calculation API
 * @version 1.0
 * @license MIT (https://opensource.org/licenses/MIT)
 * @contact API Support <support@lungcalc.ru> (http://localhost:8080)
 *
 * API для расчета должной жизненной емкости легких (ДЖЕЛ)
 * Лабораторная работа 4 - Добавление аутентификации и авторизации
 */
export class Api<SecurityDataType extends unknown> {
	http: HttpClient<SecurityDataType>

	constructor(http: HttpClient<SecurityDataType>) {
		this.http = http
	}

	api = {
		/**
		 * @description Выполняет вход пользователя и возвращает JWT токен
		 *
		 * @tags med_auth
		 * @name AuthLoginCreate
		 * @summary Аутентификация пользователя
		 * @request POST:/api/auth/login
		 * @response `200` `ApiLoginResponse` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 */
		authLoginCreate: (request: ApiLoginRequest, params: RequestParams = {}) =>
			this.http.request<ApiLoginResponse, Record<string, string>>({
				path: `/api/auth/login`,
				method: 'POST',
				body: request,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Добавляет JWT токен в черный список
		 *
		 * @tags med_auth
		 * @name AuthLogoutCreate
		 * @summary Выход пользователя
		 * @request POST:/api/auth/logout
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `500` `Record<string,string>` Internal Server Error
		 */
		authLogoutCreate: (params: RequestParams = {}) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/auth/logout`,
				method: 'POST',
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Возвращает информацию о текущем пользователе
		 *
		 * @tags med_auth
		 * @name AuthProfileList
		 * @summary Получение профиля пользователя
		 * @request GET:/api/auth/profile
		 * @secure
		 * @response `200` `DsMedUserResponse` OK
		 * @response `401` `Record<string,string>` Unauthorized
		 */
		authProfileList: (params: RequestParams = {}) =>
			this.http.request<DsMedUserResponse, Record<string, string>>({
				path: `/api/auth/profile`,
				method: 'GET',
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Возвращает информацию о корзине пользователя (количество items). Для неавторизованных возвращает пустую корзину.
		 *
		 * @tags med_card
		 * @name MedCardIconList
		 * @summary Получение иконки корзины
		 * @request GET:/api/med_card/icon
		 * @response `200` `DsCartIconResponse` OK
		 */
		medCardIconList: (params: RequestParams = {}) =>
			this.http.request<DsCartIconResponse, any>({
				path: `/api/med_card/icon`,
				method: 'GET',
				format: 'json',
				...params,
			}),

		/**
		 * @description Удаляет связь формулы с заявкой (только для владельца черновика)
		 *
		 * @tags med_calculations
		 * @name MedMmPvlcCalculationsDelete
		 * @summary Удаление расчета из заявки
		 * @request DELETE:/api/med-mm-pvlc-calculations
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `500` `Record<string,string>` Internal Server Error
		 */
		medMmPvlcCalculationsDelete: (
			request: DsDeleteMedMmPvlcCalculationRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/med-mm-pvlc-calculations`,
				method: 'DELETE',
				body: request,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Обновляет данные расчета в заявке (ввод роста)
		 *
		 * @tags med_calculations
		 * @name MedMmPvlcCalculationsUpdate
		 * @summary Обновление расчета в заявке
		 * @request PUT:/api/med-mm-pvlc-calculations
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `500` `Record<string,string>` Internal Server Error
		 */
		medMmPvlcCalculationsUpdate: (
			request: DsUpdateMedMmPvlcCalculationAPIRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/med-mm-pvlc-calculations`,
				method: 'PUT',
				body: request,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Выполняет вход пользователя
		 *
		 * @tags med_users
		 * @name MedUsersLoginCreate
		 * @summary Аутентификация пользователя (старый endpoint)
		 * @request POST:/api/med-users/login
		 * @response `200` `Record<string,any>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 */
		medUsersLoginCreate: (
			request: DsLoginMedUserRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, any>, Record<string, string>>({
				path: `/api/med-users/login`,
				method: 'POST',
				body: request,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Завершает сессию пользователя
		 *
		 * @tags med_users
		 * @name MedUsersLogoutCreate
		 * @summary Выход пользователя (старый endpoint)
		 * @request POST:/api/med-users/logout
		 * @response `200` `Record<string,string>` OK
		 */
		medUsersLogoutCreate: (params: RequestParams = {}) =>
			this.http.request<Record<string, string>, any>({
				path: `/api/med-users/logout`,
				method: 'POST',
				format: 'json',
				...params,
			}),

		/**
		 * @description Возвращает информацию о текущем пользователе
		 *
		 * @tags med_users
		 * @name MedUsersProfileList
		 * @summary Получение профиля пользователя
		 * @request GET:/api/med-users/profile
		 * @secure
		 * @response `200` `DsMedUserResponse` OK
		 * @response `401` `Record<string,string>` Unauthorized
		 * @response `404` `Record<string,string>` Not Found
		 */
		medUsersProfileList: (params: RequestParams = {}) =>
			this.http.request<DsMedUserResponse, Record<string, string>>({
				path: `/api/med-users/profile`,
				method: 'GET',
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Обновляет пароль текущего пользователя
		 *
		 * @tags med_users
		 * @name MedUsersProfileUpdate
		 * @summary Обновление профиля пользователя
		 * @request PUT:/api/med-users/profile
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 * @response `404` `Record<string,string>` Not Found
		 * @response `500` `Record<string,string>` Internal Server Error
		 */
		medUsersProfileUpdate: (
			request: DsUpdateMedUserRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/med-users/profile`,
				method: 'PUT',
				body: request,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Создает нового пользователя в системе
		 *
		 * @tags med_users
		 * @name MedUsersRegisterCreate
		 * @summary Регистрация нового пользователя
		 * @request POST:/api/med-users/register
		 * @secure
		 * @response `200` `Record<string,any>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `500` `Record<string,string>` Internal Server Error
		 */
		medUsersRegisterCreate: (
			request: DsMedUserRegistrationRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, any>, Record<string, string>>({
				path: `/api/med-users/register`,
				method: 'POST',
				body: request,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Обновляет результаты ДЖЕЛ после асинхронного расчета в Django сервисе Требует правильный ключ авторизации в поле async_key
		 *
		 * @tags medical-cards
		 * @name PvlcMedCardsAsyncResultUpdate
		 * @summary Обновление результатов асинхронного расчета
		 * @request PUT:/api/pvlc-med-cards/{id}/async-result
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedCardsAsyncResultUpdate: (
			{ id, ...query }: PvlcMedCardsAsyncResultUpdateParams,
			request: DsAsyncResultUpdateRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/pvlc-med-cards/${id}/async-result`,
				method: 'PUT',
				body: request,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Завершает или отклоняет заявку (только для модераторов) При завершении запускает асинхронный расчет ДЖЕЛ в Django сервисе
		 *
		 * @tags medical-cards
		 * @name PvlcMedCardsCompleteUpdate
		 * @summary Завершение/отклонение заявки
		 * @request PUT:/api/pvlc-med-cards/{id}/complete
		 * @secure
		 * @response `200` `Record<string,any>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedCardsCompleteUpdate: (
			{ id, ...query }: PvlcMedCardsCompleteUpdateParams,
			request: DsCompletePvlcMedCardRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, any>, Record<string, string>>({
				path: `/api/pvlc-med-cards/${id}/complete`,
				method: 'PUT',
				body: request,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Удаляет заявку (только черновики и только владельцем)
		 *
		 * @tags medical-cards
		 * @name PvlcMedCardsDelete
		 * @summary Удаление заявки
		 * @request DELETE:/api/pvlc-med-cards/{id}
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedCardsDelete: (
			{ id, ...query }: PvlcMedCardsDeleteParams,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/pvlc-med-cards/${id}`,
				method: 'DELETE',
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Возвращает информацию о конкретной заявке
		 *
		 * @tags medical-cards
		 * @name PvlcMedCardsDetail
		 * @summary Получение конкретной заявки
		 * @request GET:/api/pvlc-med-cards/{id}
		 * @secure
		 * @response `200` `DsPvlcMedCardResponse` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedCardsDetail: (
			{ id, ...query }: PvlcMedCardsDetailParams,
			params: RequestParams = {}
		) =>
			this.http.request<DsPvlcMedCardResponse, Record<string, string>>({
				path: `/api/pvlc-med-cards/${id}`,
				method: 'GET',
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Переводит заявку из статуса черновика в сформированную
		 *
		 * @tags medical-cards
		 * @name PvlcMedCardsFormUpdate
		 * @summary Формирование заявки
		 * @request PUT:/api/pvlc-med-cards/{id}/form
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedCardsFormUpdate: (
			{ id, ...query }: PvlcMedCardsFormUpdateParams,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/pvlc-med-cards/${id}/form`,
				method: 'PUT',
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Возвращает список заявок пользователя (для модераторов - все заявки)
		 *
		 * @tags medical-cards
		 * @name PvlcMedCardsList
		 * @summary Получение списка заявок
		 * @request GET:/api/pvlc-med-cards
		 * @secure
		 * @response `200` `(DsPvlcMedCardResponse)[]` OK
		 * @response `401` `Record<string,string>` Unauthorized
		 */
		pvlcMedCardsList: (
			query: PvlcMedCardsListParams,
			params: RequestParams = {}
		) =>
			this.http.request<DsPvlcMedCardResponse[], Record<string, string>>({
				path: `/api/pvlc-med-cards`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Обновляет поля заявки (только для владельца)
		 *
		 * @tags medical-cards
		 * @name PvlcMedCardsUpdate
		 * @summary Обновление заявки
		 * @request PUT:/api/pvlc-med-cards/{id}
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedCardsUpdate: (
			{ id, ...query }: PvlcMedCardsUpdateParams,
			request: DsUpdatePvlcMedCardRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/pvlc-med-cards/${id}`,
				method: 'PUT',
				body: request,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Добавляет формулу в заявку-черновик пользователя
		 *
		 * @tags med_formulas
		 * @name PvlcMedFormulasAddToCartCreate
		 * @summary Добавление формулы в корзину
		 * @request POST:/api/pvlc-med-formulas/{id}/add-to-cart
		 * @secure
		 * @response `200` `Record<string,any>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `401` `Record<string,string>` Unauthorized
		 */
		pvlcMedFormulasAddToCartCreate: (
			{ id, ...query }: PvlcMedFormulasAddToCartCreateParams,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, any>, Record<string, string>>({
				path: `/api/pvlc-med-formulas/${id}/add-to-cart`,
				method: 'POST',
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Создает новую формулу для расчета ДЖЕЛ (только для модераторов)
		 *
		 * @tags med_formulas
		 * @name PvlcMedFormulasCreate
		 * @summary Создание новой формулы
		 * @request POST:/api/pvlc-med-formulas
		 * @secure
		 * @response `200` `Record<string,any>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `403` `Record<string,string>` Forbidden
		 */
		pvlcMedFormulasCreate: (
			request: DsCreatePvlcMedFormulaRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, any>, Record<string, string>>({
				path: `/api/pvlc-med-formulas`,
				method: 'POST',
				body: request,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),

		/**
		 * @description Удаляет формулу ДЖЕЛ (только для модераторов)
		 *
		 * @tags med_formulas
		 * @name PvlcMedFormulasDelete
		 * @summary Удаление формулы
		 * @request DELETE:/api/pvlc-med-formulas/{id}
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedFormulasDelete: (
			{ id, ...query }: PvlcMedFormulasDeleteParams,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/pvlc-med-formulas/${id}`,
				method: 'DELETE',
				secure: true,
				format: 'json',
				...params,
			}),

		/**
		 * @description Возвращает информацию о конкретной формуле ДЖЕЛ
		 *
		 * @tags med_formulas
		 * @name PvlcMedFormulasDetail
		 * @summary Получение конкретной формулы
		 * @request GET:/api/pvlc-med-formulas/{id}
		 * @response `200` `DsPvlcMedFormulaResponse` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedFormulasDetail: (
			{ id, ...query }: PvlcMedFormulasDetailParams,
			params: RequestParams = {}
		) =>
			this.http.request<DsPvlcMedFormulaResponse, Record<string, string>>({
				path: `/api/pvlc-med-formulas/${id}`,
				method: 'GET',
				format: 'json',
				...params,
			}),

		/**
		 * @description Загружает изображение для формулы ДЖЕЛ в MinIO (только для модераторов)
		 *
		 * @tags med_formulas
		 * @name PvlcMedFormulasImageCreate
		 * @summary Загрузка изображения для формулы
		 * @request POST:/api/pvlc-med-formulas/{id}/image
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedFormulasImageCreate: (
			{ id, ...query }: PvlcMedFormulasImageCreateParams,
			data: PvlcMedFormulasImageCreatePayload,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/pvlc-med-formulas/${id}/image`,
				method: 'POST',
				body: data,
				secure: true,
				type: ContentType.FormData,
				format: 'json',
				...params,
			}),

		/**
		 * @description Возвращает список формул с возможностью фильтрации
		 *
		 * @tags med_formulas
		 * @name PvlcMedFormulasList
		 * @summary Получение списка формул
		 * @request GET:/api/pvlc-med-formulas
		 * @response `200` `(DsPvlcMedFormulaResponse)[]` OK
		 */
		pvlcMedFormulasList: (
			query: PvlcMedFormulasListParams,
			params: RequestParams = {}
		) =>
			this.http.request<DsPvlcMedFormulaResponse[], any>({
				path: `/api/pvlc-med-formulas`,
				method: 'GET',
				query: query,
				format: 'json',
				...params,
			}),

		/**
		 * @description Обновляет существующую формулу ДЖЕЛ (только для модераторов)
		 *
		 * @tags med_formulas
		 * @name PvlcMedFormulasUpdate
		 * @summary Обновление формулы
		 * @request PUT:/api/pvlc-med-formulas/{id}
		 * @secure
		 * @response `200` `Record<string,string>` OK
		 * @response `400` `Record<string,string>` Bad Request
		 * @response `403` `Record<string,string>` Forbidden
		 * @response `404` `Record<string,string>` Not Found
		 */
		pvlcMedFormulasUpdate: (
			{ id, ...query }: PvlcMedFormulasUpdateParams,
			request: DsUpdatePvlcMedFormulaRequest,
			params: RequestParams = {}
		) =>
			this.http.request<Record<string, string>, Record<string, string>>({
				path: `/api/pvlc-med-formulas/${id}`,
				method: 'PUT',
				body: request,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params,
			}),
	}
}
