from django.urls import path
from . import views

urlpatterns = [
    path('itineraries/', views.itinerary_list, name='itinerary_list'),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
]