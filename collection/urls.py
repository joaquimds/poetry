from django.urls import path

from collection import views

urlpatterns = [
    path('', views.index),
    path('api/poems', views.poems),
]
