# app01/api/urls.py

from django.urls import path
from .views import crawl_view, crawl_and_mix_view, get_database_products, clear_cache_view

urlpatterns = [
    path('crawl/', crawl_view, name='crawl'),
    path('crawl-mix/', crawl_and_mix_view, name='crawl_and_mix'),
    path('database/', get_database_products, name='get_database_products'),
    path('clear-cache/', clear_cache_view, name='clear_cache'),
]
