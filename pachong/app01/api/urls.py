# app01/api/urls.py

from django.urls import path
from .views import crawl_and_mix_view, get_database_products, clear_cache_view

urlpatterns = [
    path('crawl_and_mix/', crawl_and_mix_view),
    path('get_database_products/', get_database_products),
    path('clear_cache/', clear_cache_view),
]
