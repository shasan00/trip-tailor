from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('password-reset/', views.request_password_reset, name='request-password-reset'),
    path('password-reset/validate/<str:token>/', views.validate_reset_token, name='validate-reset-token'),
    path('password-reset/confirm/', views.confirm_password_reset, name='confirm-password-reset'),
    path('itineraries/', views.itinerary_list, name='itinerary-list'),
    path('itineraries/<int:pk>/', views.public_itinerary_detail, name='public-itinerary-detail'),
    path('itineraries/<int:pk>/reviews/', views.itinerary_reviews, name='itinerary-reviews'),
    path('itineraries/creator/<int:creator_id>/', views.itineraries_by_creator, name='itineraries-by-creator'),
    path('user/itineraries/', views.user_itineraries, name='user-itineraries'),
    path('user/itineraries/<int:pk>/', views.itinerary_detail, name='itinerary-detail'),
    path('user/itineraries/<int:pk>/publish/', views.publish_itinerary, name='publish-itinerary'),
    path('reviews/<int:pk>/', views.review_detail, name='review-detail'),
]