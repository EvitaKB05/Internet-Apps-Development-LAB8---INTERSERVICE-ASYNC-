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

def simulate_djel_calculation(card_id, calculations_data):
    """
    Симуляция долгого расчета ДЖЕЛ
    
    Эта функция выполняется в фоновом режиме с задержкой 5-10 секунд
    В реальной системе здесь была бы сложная математика по формулам
    
    Args:
        card_id: ID заявки
        calculations_data: данные расчетов (рост, формулы)
    
    Returns:
        dict: результаты расчета
    """
    
    print(f"\n{'='*60}")
    print(f"🎬 Django сервис: Начинаем расчет ДЖЕЛ для заявки #{card_id}")
    print(f"   Получено расчетов: {len(calculations_data)}")
    
    # Логируем полученные данные
    for i, calc in enumerate(calculations_data[:3]):  # показываем первые 3
        print(f"   Расчет {i+1}: {calc.get('title', 'Без названия')}, "
              f"Рост: {calc.get('input_height', 'N/A')}, "
              f"Формула: {calc.get('formula', 'N/A')[:50]}...")
    
    if len(calculations_data) > 3:
        print(f"   ... и еще {len(calculations_data) - 3} расчетов")
    
    # Задержка 5-10 секунд (как требуется в задании)
    delay_seconds = random.uniform(5, 10)  # случайное число от 5 до 10
    print(f"   Задержка расчета: {delay_seconds:.2f} секунд")
    
    # Имитируем долгий расчет (спим)
    time.sleep(delay_seconds)
    
    # В реальной системе здесь происходило бы вычисление по формулам
    # Для демонстрации генерируем случайный результат ДЖЕЛ
    # Диапазон 2.5-6.0 литров - реалистичные значения ДЖЕЛ
    total_result = round(random.uniform(2.5, 6.0), 2)
    
    # Рассчитываем сколько формул "посчиталось"
    # В реальной системе это было бы количество заполненных расчетов
    if calculations_data:
        calculated_count = random.randint(1, len(calculations_data))
    else:
        calculated_count = random.randint(1, 5)  # если данных нет, случайное число
        
    print(f"\n✅ Django сервис: Расчет завершен для заявки #{card_id}")
    print(f"   Результат ДЖЕЛ: {total_result} л")
    print(f"   Рассчитано формул: {calculated_count} из {len(calculations_data)}")
    print(f"   Время расчета: {delay_seconds:.2f} секунд")
    print(f"{'='*60}\n")
    
    return {
        "id": card_id,
        "total_result": total_result,
        "calculated_count": calculated_count,
        "delay_seconds": round(delay_seconds, 2)
    }


def calculation_callback(task):
    """
    Колбэк (функция обратного вызова)
    
    Вызывается автоматически когда асинхронная задача завершена
    Отправляет результаты расчета обратно в Go сервис
    
    Args:
        task: завершенная задача
    """
    try:
        # Получаем результат задачи
        result = task.result()
        
        print(f"\n📤 Django сервис: Отправляем результат в Go сервис для заявки #{result['id']}")
        print(f"   Результат: {result['total_result']} л")
        print(f"   Рассчитано формул: {result['calculated_count']}")
        
    except futures._base.CancelledError:
        # Если задача была отменена - просто выходим
        print("❌ Django сервис: Задача отменена")
        return
    except Exception as e:
        # Если произошла ошибка - логируем и выходим
        print(f"❌ Django сервис: Ошибка в задаче: {e}")
        return
    
    try:
        # Формируем URL для отправки результатов
        # Пример: http://localhost:8080/api/pvlc-med-cards/5/async-result
        callback_url = f"{CALLBACK_URL}{result['id']}/async-result"
        
        # Формируем данные для отправки
        data_to_send = {
            "total_result": result["total_result"],
            "calculated_count": result["calculated_count"],
            "async_calculated": True,
            "async_key": ASYNC_API_KEY  # Ключ для авторизации (ОБЯЗАТЕЛЬНО!)
        }
        
        print(f"   URL обратного вызова: {callback_url}")
        print(f"   Данные для отправки: {json.dumps(data_to_send, indent=2)}")
        
        # Отправляем PUT запрос в Go сервис
        response = requests.put(
            callback_url, 
            json=data_to_send, 
            timeout=15,  # увеличиваем таймаут до 15 секунд
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Django-Async-Service/1.0"
            }
        )
        
        # Логируем ответ
        print(f"   Статус ответа Go сервиса: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"   Ответ Go сервиса: {json.dumps(response_data, indent=2)}")
            print(f"✅ Django сервис: Результат успешно отправлен в Go сервис")
        else:
            print(f"   Текст ответа: {response.text[:200]}...")  # первые 200 символов
            print(f"⚠️  Django сервис: Go сервис вернул ошибку: {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("❌ Django сервис: Таймаут при отправке в Go сервис (15 секунд)")
    except requests.exceptions.ConnectionError:
        print("❌ Django сервис: Не удалось подключиться к Go сервису")
    except Exception as e:
        print(f"❌ Django сервис: Ошибка отправки результата: {e}")

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