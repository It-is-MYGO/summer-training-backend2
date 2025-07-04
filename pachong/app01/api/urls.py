# app01/api/urls.py

from django.urls import path
from .views import crawl_view

urlpatterns = [
    path('crawl/', crawl_view, name='crawl'),
]
