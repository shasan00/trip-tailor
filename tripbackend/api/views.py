from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import Itinerary, ItineraryDay, ItineraryPhoto, Review, Stop, PasswordResetToken
from .serializers import (
    ItinerarySerializer, UserRegistrationSerializer,
    ItineraryDaySerializer, ItineraryPhotoSerializer,
    ReviewSerializer
)
import json
import logging

# Set up logger
logger = logging.getLogger(__name__)

# Create your views here.
@api_view(['GET'])
def itinerary_list(request):
    itineraries = Itinerary.objects.filter(status='published')
    serializer = ItinerarySerializer(itineraries, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def itineraries_by_creator(request, creator_id):
    try:
        creator = User.objects.get(pk=creator_id)
        itineraries = Itinerary.objects.filter(user=creator, status='published')
        serializer = ItinerarySerializer(itineraries, many=True)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"error": "Creator not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            logger.info(f"Creating itinerary for user: {request.user.username}")
            # Copy request data to make it mutable
            data = request.data.copy()
            logger.info(f"Raw request data: {data}")
            
            # Process additional photos if any
            additional_photos_count = data.get('additional_photos_count')
            if additional_photos_count:
                try:
                    additional_photos_count = int(additional_photos_count)
                    logger.info(f"Processing {additional_photos_count} additional photos")
                except ValueError:
                    logger.error(f"Invalid additional_photos_count: {additional_photos_count}")
                    additional_photos_count = 0
            else:
                additional_photos_count = 0
            
            # Parse the days JSON string if it exists and is a string
            parsed_days = None # Initialize parsed_days
            if 'days' in data and isinstance(data['days'], str):
                try:
                    parsed_days = json.loads(data['days'])
                    logger.info(f"Parsed days data: {parsed_days}")
                    # *** Remove days from the data dict before validation ***
                    del data['days'] 
                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error for days data: {e}")
                    return Response({'days': ['Invalid JSON format.']}, status=status.HTTP_400_BAD_REQUEST)
            else:
                logger.info(f"Days data not found or not a string: {data.get('days', 'None')}")
            
            # Pass the data *without* days to the serializer
            logger.info(f"Data being passed to serializer for validation: {data}")
            serializer = ItinerarySerializer(data=data, context={'request': request})
            
            if serializer.is_valid():
                logger.info(f"Serializer is valid. Validated data: {serializer.validated_data}")
                # *** Pass the parsed_days data to the save method ***
                itinerary = serializer.save(user=request.user, days_data=parsed_days)
                logger.info(f"Itinerary saved with ID: {itinerary.id}")
                
                # Process and save additional photos
                for i in range(additional_photos_count):
                    photo_key = f'additional_photo_{i}'
                    if photo_key in request.FILES:
                        photo_file = request.FILES[photo_key]
                        logger.info(f"Processing additional photo {i}: {photo_file.name}")
                        try:
                            photo = ItineraryPhoto.objects.create(
                                itinerary=itinerary,
                                image=photo_file,
                                caption=f"Photo {i+1}"
                            )
                            logger.info(f"Created additional photo with ID: {photo.id}")
                        except Exception as e:
                            logger.error(f"Error creating additional photo {i}: {e}")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error in user_itineraries POST: {e}")
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
        serializer = ItinerarySerializer(itinerary, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        if itinerary.user != request.user:
            return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)

        logger.info(f"Updating itinerary {pk} for user: {request.user.username}")
        # Copy request data to make it mutable
        data = request.data.copy()
        logger.info(f"Raw update request data: {data}")
        
        # Process additional photos if any
        additional_photos_count = data.get('additional_photos_count')
        if additional_photos_count:
            try:
                additional_photos_count = int(additional_photos_count)
                logger.info(f"Processing {additional_photos_count} additional photos")
            except ValueError:
                logger.error(f"Invalid additional_photos_count: {additional_photos_count}")
                additional_photos_count = 0
        else:
            additional_photos_count = 0
        
        # Parse the days JSON string if it exists and is a string
        if 'days' in data and isinstance(data['days'], str):
            try:
                data['days'] = json.loads(data['days'])
                logger.info(f"Parsed days data: {data['days']}")
            except json.JSONDecodeError:
                logger.error(f"JSON decode error for days data")
                return Response({'days': ['Invalid JSON format.']}, status=status.HTTP_400_BAD_REQUEST)

        # Pass the potentially modified data dict to the serializer
        logger.info(f"Data being passed to serializer for update: {data}")
        serializer = ItinerarySerializer(itinerary, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            logger.info(f"Serializer is valid for update. Validated data: {serializer.validated_data}")
            serializer.save()
            
            # Process and save additional photos
            for i in range(additional_photos_count):
                photo_key = f'additional_photo_{i}'
                if photo_key in request.FILES:
                    photo_file = request.FILES[photo_key]
                    logger.info(f"Processing additional photo {i}: {photo_file.name}")
                    try:
                        photo = ItineraryPhoto.objects.create(
                            itinerary=itinerary,
                            image=photo_file,
                            caption=f"Photo {i+1}"
                        )
                        logger.info(f"Created additional photo with ID: {photo.id}")
                    except Exception as e:
                        logger.error(f"Error creating additional photo {i}: {e}")
            
            return Response(serializer.data)
        
        logger.error(f"Serializer errors for update: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if itinerary.user != request.user:
            return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)
            
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
def itinerary_reviews(request, pk):
    """
    GET: List all reviews for an itinerary (no authentication required)
    POST: Add a review to an itinerary (authentication required)
    """
    try:
        itinerary = Itinerary.objects.get(pk=pk)
    except Itinerary.DoesNotExist:
        return Response(
            {"error": "Itinerary not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # GET requests can be unauthenticated
    if request.method == 'GET':
        try:
            reviews = Review.objects.filter(itinerary=itinerary)
            serializer = ReviewSerializer(reviews, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.exception(f"Error fetching reviews: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # For POST requests, authenticate the user
    elif request.method == 'POST':
        # Check if the user is authenticated
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required to submit a review"},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        # Log the full request data for debugging
        logger.info(f"Review POST data: {request.data}")
            
        # Check if user has already reviewed this itinerary
        existing_review = Review.objects.filter(user=request.user, itinerary=itinerary).first()
        if existing_review:
            return Response(
                {"error": "You have already reviewed this itinerary"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate required fields
        rating = request.data.get('rating')
        comment = request.data.get('comment')
        
        if not rating:
            return Response(
                {"error": "Rating is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not comment:
            return Response(
                {"error": "Comment is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return Response(
                    {"error": "Rating must be between 1 and 5"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"error": "Rating must be a number between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the review directly
        try:
            review = Review.objects.create(
                user=request.user,
                itinerary=itinerary,
                rating=rating,
                comment=comment
            )
            
            # Serialize for response
            serializer = ReviewSerializer(review)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.exception(f"Error creating review: {e}")
            return Response(
                {"error": f"Failed to create review: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Request a password reset link sent to email
    """
    try:
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists or not for security
            logger.info(f"Password reset requested for non-existent email: {email}")
            return Response({'message': 'If your email exists in our system, you will receive a password reset link shortly.'}, 
                           status=status.HTTP_200_OK)
        
        # Invalidate any existing unused tokens
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Create a new token
        reset_token = PasswordResetToken.objects.create(user=user)
        
        # Construct reset URL (frontend)
        reset_url = f"http://localhost:3000/reset-password/{reset_token.token}"
        
        # Send email with reset link
        email_subject = "Trip Tailor - Password Reset"
        email_message = f"""
Hello {user.first_name},

You have requested to reset your password for Trip Tailor. Please click the link below to reset your password:

{reset_url}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email.

Best regards,
The Trip Tailor Team
"""
        
        try:
            logger.info(f"Sending password reset email to {user.email}")
            logger.info(f"Using SMTP settings: {settings.EMAIL_HOST}, {settings.EMAIL_PORT}, {settings.EMAIL_HOST_USER}")
            
            # Use a more direct approach to catch specific errors
            from django.core.mail import EmailMessage
            email = EmailMessage(
                email_subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
            email.send(fail_silently=False)
            
            logger.info(f"Password reset email sent successfully to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
            logger.exception("Email sending error details:")
            # For development, you might want to return the actual error for debugging
            if settings.DEBUG:
                return Response({
                    'error': 'Failed to send email',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({'error': 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'message': 'If your email exists in our system, you will receive a password reset link shortly.'}, 
                       status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.exception(f"Error in request_password_reset: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_reset_token(request, token):
    """
    Validate if a reset token is valid
    """
    try:
        try:
            reset_token = PasswordResetToken.objects.get(token=token, is_used=False)
        except PasswordResetToken.DoesNotExist:
            return Response({'valid': False, 'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if token is expired
        if reset_token.expires_at < timezone.now():
            reset_token.is_used = True
            reset_token.save()
            return Response({'valid': False, 'error': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'valid': True, 'email': reset_token.user.email}, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.exception(f"Error in validate_reset_token: {e}")
        return Response({'valid': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """
    Set a new password using a valid reset token
    """
    try:
        token_str = request.data.get('token')
        new_password = request.data.get('password')
        
        if not token_str or not new_password:
            return Response({'error': 'Token and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token_str, is_used=False)
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if token is expired
        if reset_token.expires_at < timezone.now():
            reset_token.is_used = True
            reset_token.save()
            return Response({'error': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_token.is_used = True
        reset_token.save()
        
        # Invalidate all existing sessions/tokens
        Token.objects.filter(user=user).delete()
        
        # Create new token for immediate login
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Password reset successful',
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
        logger.exception(f"Error in confirm_password_reset: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

