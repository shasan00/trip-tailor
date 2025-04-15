from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .models import Itinerary, ItineraryDay, ItineraryPhoto, Review
from .serializers import (
    ItinerarySerializer, UserRegistrationSerializer,
    ItineraryDaySerializer, ItineraryPhotoSerializer,
    ReviewSerializer
)
import json

# Create your views here.
@api_view(['GET'])
def itinerary_list(request):
    itineraries = Itinerary.objects.filter(status='published')
    serializer = ItinerarySerializer(itineraries, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def public_itinerary_detail(request, pk):
    try:
        itinerary = Itinerary.objects.get(pk=pk, status='published')
        serializer = ItinerarySerializer(itinerary, context={'request': request})
        return Response(serializer.data)
    except Itinerary.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({
                'error': 'Please provide both email and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Find user by email
        user = authenticate(username=email, password=password)
        
        if not user:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Get or create token for the user
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_itineraries(request):
    if request.method == 'GET':
        itineraries = Itinerary.objects.filter(user=request.user)
        serializer = ItinerarySerializer(itineraries, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        try:
            data = request.data.copy()
            # Parse the days JSON string if it exists
            if 'days' in data and isinstance(data['days'], str):
                data['days'] = json.loads(data['days'])
            
            serializer = ItinerarySerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def itinerary_detail(request, pk):
    try:
        itinerary = Itinerary.objects.get(pk=pk)
    except Itinerary.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ItinerarySerializer(itinerary)
        return Response(serializer.data)

    elif request.method == 'PUT':
        # Only allow the creator to edit
        if itinerary.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = ItinerarySerializer(itinerary, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Only allow the creator to delete
        if itinerary.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
            
        itinerary.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_itinerary(request, pk):
    try:
        itinerary = Itinerary.objects.get(pk=pk, user=request.user)
    except Itinerary.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    # Update the status to published
    itinerary.status = 'published'
    itinerary.save()

    # Return the updated itinerary
    serializer = ItinerarySerializer(itinerary)
    return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def itinerary_reviews(request, pk):
    try:
        itinerary = Itinerary.objects.get(pk=pk)
    except Itinerary.DoesNotExist:
        return Response(
            {"error": "Itinerary not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        try:
            reviews = Review.objects.filter(itinerary=itinerary)
            serializer = ReviewSerializer(reviews, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == 'POST':
        # Check if user has already reviewed this itinerary
        existing_review = Review.objects.filter(user=request.user, itinerary=itinerary).first()
        if existing_review:
            return Response(
                {"error": "You have already reviewed this itinerary"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add the itinerary to the request data
        data = request.data.copy()
        data['itinerary'] = itinerary.id

        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user, itinerary=itinerary)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def review_detail(request, pk):
    try:
        review = Review.objects.get(pk=pk)
    except Review.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    # Only allow the review creator to modify or delete
    if review.user != request.user:
        return Response(status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = ReviewSerializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

