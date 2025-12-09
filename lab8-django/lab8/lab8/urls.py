"""
URL configuration for lab8 project.

Лабораторная работа №8 - URL маршруты асинхронного сервиса
URL - это адреса, по которым можно обращаться к нашему сервису
"""

from django.contrib import admin
from django.urls import path
from app import views  # импортируем наши обработчики

urlpatterns = [
    # Админка Django (не используем, но оставляем)
    path('admin/', admin.site.urls),
    
    # ==================== НАШИ API ЭНДПОИНТЫ ====================
    
    # Основной эндпоинт для асинхронного расчета
    # POST запрос сюда запускает расчет ДЖЕЛ
    path('api/async-calculate/', views.async_calculate_djel, name='async-calculate'),
    
    # Проверка здоровья сервиса
    # GET запрос - просто проверяем что сервис работает
    path('api/health/', views.health_check, name='health-check'),
    
    # Корневой маршрут
    # Просто информационная страница
    path('', views.home, name='home'),
]