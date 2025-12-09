"""
Views (обработчики запросов) для асинхронного сервиса расчета ДЖЕЛ
Лабораторная работа №8 - Асинхронный сервис
"""

# Импортируем нужные модули
from rest_framework.decorators import api_view  # для создания API endpoint
from rest_framework.response import Response    # для возврата ответов
from rest_framework import status               # коды статусов HTTP (200, 400, 500)

import time     # для создания задержки
import random   # для генерации случайных чисел
import requests # для отправки HTTP запросов в Go сервис
import json     # для работы с JSON
import math     # для математических операций

from concurrent import futures  # для асинхронных задач (фоновая работа)

# ==================== КОНСТАНТЫ ====================

# Адрес Go сервиса для обратного вызова
# {id} заменится на ID заявки
CALLBACK_URL = "http://localhost:8080/api/pvlc-med-cards/"

# Ключ для авторизации (должен совпадать с ключом в Go сервисе)
ASYNC_API_KEY = "lab8key12345678"

# Пул потоков для выполнения асинхронных задач
# max_workers=1 - один фоновый поток для выполнения задач
executor = futures.ThreadPoolExecutor(max_workers=2)  # УВЕЛИЧИВАЕМ ДО 2

# ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

def calculate_djel_by_formula(formula: str, height: float) -> float:
    """
    Вычисляет ДЖЕЛ по формуле на основе роста
    
    Args:
        formula: строка с формулой
        height: рост в см
    
    Returns:
        float: результат ДЖЕЛ в литрах
    """
    # Извлекаем числовые коэффициенты из формулы
    # Пример формулы: "ДЖЕЛ = 0.043 × Рост - 0.015 × Возраст - 2.89"
    
    try:
        # Определяем средний возраст на основе формулы
        if "4-7" in formula or "4 7" in formula:
            age = 5.5  # средний возраст 4-7 лет
        elif "8-12" in formula or "8 12" in formula:
            age = 10.0  # средний возраст 8-12 лет
        elif "13-17" in formula or "13 17" in formula:
            age = 15.0  # средний возраст 13-17 лет
        elif "18-60" in formula or "18 60" in formula:
            age = 39.0  # средний возраст 18-60 лет
        elif "60+" in formula:
            age = 75.0  # средний возраст 60+ лет
        else:
            age = 30.0  # значение по умолчанию
        
        # Парсим коэффициенты из формулы
        # Простая реализация для демонстрации
        if "0.043" in formula and "2.89" in formula:
            # Мальчики 4-7 лет: ДЖЕЛ = 0.043 × Рост - 0.015 × Возраст - 2.89
            result = 0.043 * height - 0.015 * age - 2.89
        elif "0.037" in formula and "2.54" in formula:
            # Девочки 4-7 лет: ДЖЕЛ = 0.037 × Рост - 0.012 × Возраст - 2.54
            result = 0.037 * height - 0.012 * age - 2.54
        elif "0.052" in formula and "4.60" in formula:
            # Мальчики 8-12 лет: ДЖЕЛ = 0.052 × Рост - 0.022 × Возраст - 4.60
            result = 0.052 * height - 0.022 * age - 4.60
        elif "0.041" in formula and "3.70" in formula:
            # Девочки 8-12 лет: ДЖЕЛ = 0.041 × Рост - 0.018 × Возраст - 3.70
            result = 0.041 * height - 0.018 * age - 3.70
        elif "0.052" in formula and "4.20" in formula:
            # Юноши 13-17 лет: ДЖЕЛ = 0.052 × Рост - 0.022 × Возраст - 4.20
            result = 0.052 * height - 0.022 * age - 4.20
        elif "0.041" in formula and "3.20" in formula:
            # Девушки 13-17 лет: ДЖЕЛ = 0.041 × Рост - 0.018 × Возраст - 3.20
            result = 0.041 * height - 0.018 * age - 3.20
        elif "0.052" in formula and "3.60" in formula:
            # Мужчины 18-60 лет: ДЖЕЛ = 0.052 × Рост - 0.022 × Возраст - 3.60
            result = 0.052 * height - 0.022 * age - 3.60
        elif "0.041" in formula and "2.69" in formula:
            # Женщины 18-60 лет: ДЖЕЛ = 0.041 × Рост - 0.018 × Возраст - 2.69
            result = 0.041 * height - 0.018 * age - 2.69
        elif "0.044" in formula and "2.86" in formula:
            # Пожилые 60+ лет: ДЖЕЛ = 0.044 × Рост - 0.024 × Возраст - 2.86
            result = 0.044 * height - 0.024 * age - 2.86
        else:
            # Если формула не распознана, используем универсальную
            # Базовый расчет: ДЖЕЛ ≈ 0.04 * рост - константа
            result = 0.04 * height - random.uniform(2.0, 3.0)
        
        # Округляем до 2 знаков после запятой и ограничиваем разумными значениями
        result = round(result, 2)
        if result < 1.0:
            result = random.uniform(1.5, 3.0)  # минимальное значение
        elif result > 8.0:
            result = random.uniform(4.0, 6.0)  # максимальное значение
        
        return result
        
    except Exception as e:
        print(f"⚠️ Ошибка расчета по формуле '{formula[:50]}...': {e}")
        # Возвращаем случайное значение в реалистичном диапазоне
        return round(random.uniform(2.0, 5.0), 2)


def simulate_djel_calculation(card_id, calculations_data):
    """
    Симуляция долгого расчета ДЖЕЛ
    
    Возвращает как общий результат, так и индивидуальные результаты
    для каждого расчета (пациента) в заявке.
    
    Args:
        card_id: ID заявки
        calculations_data: данные расчетов (рост, формулы)
    
    Returns:
        dict: результаты расчета (общий и индивидуальные)
    """
    
    print(f"\n{'='*60}")
    print(f"🎬 Django сервис: Начинаем расчет ДЖЕЛ для заявки #{card_id}")
    print(f"   Получено расчетов (пациентов): {len(calculations_data)}")
    
    # Логируем полученные данные
    for i, calc in enumerate(calculations_data[:3]):  # показываем первые 3
        print(f"   Расчет {i+1}: {calc.get('title', 'Без названия')}, "
              f"Рост: {calc.get('input_height', 'N/A')} см, "
              f"Формула: {calc.get('formula', 'N/A')[:50]}...")
    
    if len(calculations_data) > 3:
        print(f"   ... и еще {len(calculations_data) - 3} расчетов")
    
    # ==================== ВАЖНОЕ ИЗМЕНЕНИЕ: ЗАДЕРЖКА ====================
    # Задержка 5-10 секунд (как требуется в задании)
    delay_seconds = random.uniform(5, 10)  # случайное число от 5 до 10
    print(f"   Задержка расчета: {delay_seconds:.2f} секунд")
    
    # Имитируем долгий расчет (спим)
    time.sleep(delay_seconds)
    
    # ==================== РАСЧЕТ ИНДИВИДУАЛЬНЫХ РЕЗУЛЬТАТОВ ====================
    # Генерируем индивидуальные результаты для каждого расчета (пациента)
    individual_results = []
    total_result = 0.0
    
    print(f"\n🧮 Django сервис: Рассчитываем индивидуальные результаты...")
    
    for i, calc in enumerate(calculations_data):
        formula_id = calc.get('formula_id', 0)
        title = calc.get('title', f'Расчет {i+1}')
        input_height = calc.get('input_height', 150.0)
        formula = calc.get('formula', '')
        
        # Вычисляем ДЖЕЛ для этого расчета
        individual_result = calculate_djel_by_formula(formula, input_height)
        
        # Создаем запись индивидуального результата
        individual_result_data = {
            "formula_id": formula_id,
            "title": title,
            "individual_result": individual_result,
            "input_height": input_height,
        }
        
        individual_results.append(individual_result_data)
        total_result += individual_result
        
        print(f"   Пациент {i+1}: {title}")
        print(f"     Рост: {input_height} см, Формула: {formula[:50]}...")
        print(f"     Результат ДЖЕЛ: {individual_result} л")
    
    # Округляем общий результат
    total_result = round(total_result, 2)
    calculated_count = len(calculations_data)
    
    print(f"\n✅ Django сервис: Расчет завершен для заявки #{card_id}")
    print(f"   Общий результат ДЖЕЛ: {total_result} л")
    print(f"   Индивидуальных результатов: {calculated_count}")
    print(f"   Средний ДЖЕЛ на пациента: {round(total_result/calculated_count, 2) if calculated_count > 0 else 0} л")
    print(f"   Время расчета: {delay_seconds:.2f} секунд")
    print(f"{'='*60}\n")
    
    return {
        "id": card_id,
        "total_result": total_result,
        "calculated_count": calculated_count,
        "delay_seconds": round(delay_seconds, 2),
        "individual_results": individual_results,  # КЛЮЧЕВОЕ ДОБАВЛЕНИЕ!
    }


def calculation_callback(task):
    try:
        # Получаем результат задачи
        result = task.result()
        
        print(f"\n📤 Django сервис: Отправляем результат в Go сервис для заявки #{result['id']}")
        print(f"   Общий результат: {result['total_result']} л")
        print(f"   Количество расчетов: {result['calculated_count']}")
        
        if 'individual_results' in result:
            print(f"   Индивидуальных результатов: {len(result['individual_results'])}")
            
            # Логируем первый результат для проверки
            if result['individual_results']:
                first_result = result['individual_results'][0]
                print(f"   Первый результат: ID={first_result.get('formula_id')}, "
                      f"Result={first_result.get('individual_result')}, "
                      f"Type={type(first_result.get('formula_id')).__name__}")
        
    except futures._base.CancelledError:
        print("❌ Django сервис: Задача отменена")
        return
    except Exception as e:
        print(f"❌ Django сервис: Ошибка в задаче: {e}")
        return
    
    try:
        # Формируем URL для отправки результатов
        callback_url = f"{CALLBACK_URL}{result['id']}/async-result"
        
        # ==================== ИСПРАВЛЕНИЕ: Проверяем формат данных ====================
        individual_results = []
        for item in result.get("individual_results", []):
            # Преобразуем formula_id в int если нужно
            formula_id = item.get('formula_id', 0)
            if isinstance(formula_id, str):
                try:
                    formula_id = int(formula_id)
                except:
                    formula_id = 0
            
            individual_results.append({
                "formula_id": formula_id,
                "title": item.get('title', ''),
                "individual_result": item.get('individual_result', 0.0),
                "input_height": item.get('input_height', 0.0),
            })
        
        # Формируем данные для отправки
        data_to_send = {
            "total_result": float(result["total_result"]),
            "calculated_count": int(result["calculated_count"]),
            "async_calculated": True,
            "async_key": ASYNC_API_KEY,
            "individual_results": individual_results,
        }
        
        print(f"   URL обратного вызова: {callback_url}")
        print(f"   Подготовленные данные:")
        print(f"     - Общий результат: {data_to_send['total_result']} л")
        print(f"     - Количество: {data_to_send['calculated_count']}")
        print(f"     - Индивидуальные результаты: {len(data_to_send['individual_results'])} шт.")
        if data_to_send['individual_results']:
            print(f"     - Первый formula_id: {data_to_send['individual_results'][0]['formula_id']} "
                  f"(type: {type(data_to_send['individual_results'][0]['formula_id']).__name__})")
        
        # Отправляем PUT запрос в Go сервис
        response = requests.put(
            callback_url, 
            json=data_to_send, 
            timeout=15,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Django-Async-Service/1.0"
            }
        )
        
        print(f"   Статус ответа Go сервиса: {response.status_code}")
        
        if response.status_code == 200:
            try:
                response_data = response.json()
                print(f"   Ответ Go сервиса: {json.dumps(response_data, indent=2)}")
                print(f"✅ Django сервис: Результат успешно отправлен в Go сервис")
            except:
                print(f"   Текст ответа: {response.text[:200]}...")
                print(f"✅ Django сервис: Результат отправлен (не JSON ответ)")
        else:
            print(f"   Текст ответа: {response.text[:500]}...")  # Увеличиваем до 500 символов
            print(f"⚠️  Django сервис: Go сервис вернул ошибку: {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("❌ Django сервис: Таймаут при отправке в Go сервис (15 секунд)")
    except requests.exceptions.ConnectionError:
        print("❌ Django сервис: Не удалось подключиться к Go сервису")
    except Exception as e:
        print(f"❌ Django сервис: Ошибка отправки результата: {str(e)[:200]}")
# ==================== ОСНОВНЫЕ ОБРАБОТЧИКИ API ====================

@api_view(['POST'])
def async_calculate_djel(request):
    """
    Асинхронный расчет ДЖЕЛ для заявки
    
    Эндпоинт: POST /api/async-calculate/
    
    Принимает ID заявки, немедленно возвращает 200 OK
    Расчет выполняется в фоновом режиме с задержкой 5-10 секунд
    
    Пример запроса:
    {
        "card_id": 5,
        "calculations": [...]
    }
    """
    
    print("\n" + "="*60)
    print("📨 Django сервис: Получен запрос на асинхронный расчет ДЖЕЛ")
    print(f"   Метод: {request.method}")
    print(f"   Клиент: {request.META.get('REMOTE_ADDR', 'неизвестен')}")
    
    # Логируем заголовки для отладки
    headers_to_log = ['User-Agent', 'Content-Type', 'Content-Length']
    for header in headers_to_log:
        if header in request.META:
            print(f"   Header {header}: {request.META[header]}")
    
    # Проверяем что в запросе есть card_id
    if "card_id" not in request.data:
        print("❌ Django сервис: Ошибка - не указан card_id")
        return Response(
            {"error": "Не указан card_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Получаем данные из запроса
        card_id = request.data["card_id"]
        calculations_data = request.data.get("calculations", [])
        
        print(f"✅ Django сервис: Запрос корректен")
        print(f"   ID заявки: {card_id}")
        print(f"   Количество расчетов: {len(calculations_data)}")
        
        # ==================== САМАЯ ВАЖНАЯ ЧАСТЬ ====================
        # Запускаем асинхронную задачу расчета
        # executor.submit - ставит задачу в очередь на выполнение
        task = executor.submit(simulate_djel_calculation, card_id, calculations_data)
        
        # Привязываем колбэк (функцию обратного вызова)
        # Когда задача завершится, автоматически вызовется calculation_callback
        task.add_done_callback(calculation_callback)
        
        print(f"🚀 Django сервис: Задача запущена в фоновом режиме")
        print(f"   Расчет займет 5-10 секунд")
        print(f"   ID задачи: {id(task)}")
        print("="*60 + "\n")
        
        # Немедленно возвращаем успешный ответ
        # Клиент не ждет 5-10 секунд, а сразу получает ответ
        return Response(
            {
                "message": "Расчет ДЖЕЛ запущен в асинхронном режиме",
                "card_id": card_id,
                "status": "processing",
                "estimated_time": "5-10 секунд",
                "django_service": "Асинхронный сервис расчета ДЖЕЛ",
                "note": "Результаты будут отправлены в основной сервис автоматически",
                "calculations_count": len(calculations_data),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        print(f"❌ Django сервис: Внутренняя ошибка сервера: {e}")
        return Response(
            {"error": "Внутренняя ошибка сервера", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def health_check(request):
    """
    Проверка здоровья сервиса
    
    Эндпоинт: GET /api/health/
    
    Всегда возвращает 200 OK, используется для проверки что сервис работает
    """
    return Response(
        {
            "status": "healthy",
            "service": "Async DJEL Calculator Service",
            "version": "1.0",
            "description": "Асинхронный сервис расчета ДЖЕЛ для лабораторной работы №8",
            "active_workers": executor._max_workers,
            "tasks_in_queue": executor._work_queue.qsize() if hasattr(executor._work_queue, 'qsize') else 0,
            "api_endpoints": {
                "POST /api/async-calculate/": "Запуск асинхронного расчета",
                "GET /api/health/": "Проверка здоровья сервиса"
            },
            "callback_url": CALLBACK_URL,
            "async_key_set": bool(ASYNC_API_KEY),
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def home(request):
    """
    Корневой эндпоинт
    
    Эндпоинт: GET /
    
    Просто редирект на health check
    """
    return Response(
        {
            "message": "Асинхронный сервис расчета ДЖЕЛ работает",
            "go_to": "/api/health/ для проверки здоровья",
            "description": "Лабораторная работа №8 - Асинхронный сервис",
            "supported_operations": [
                "Асинхронный расчет ДЖЕЛ с задержкой 5-10 секунд",
                "Автоматический callback в основной сервис",
                "Поддержка ключа авторизации"
            ],
            "usage": "POST /api/async-calculate/ с JSON {card_id: number, calculations: [...]}"
        },
        status=status.HTTP_200_OK
    )