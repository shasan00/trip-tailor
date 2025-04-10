from django.urls import path
from . import views

urlpatterns = [
    path('itineraries/', views.itinerary_list, name='itinerary_list'),
]