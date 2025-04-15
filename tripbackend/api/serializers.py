from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Itinerary, ItineraryDay, ItineraryPhoto, Review

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'password', 'password2')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class ItineraryPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItineraryPhoto
        fields = ['id', 'image', 'caption', 'uploaded_at']

class ItineraryDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItineraryDay
        fields = ['id', 'day_number', 'title', 'description', 'activities']

class ItinerarySerializer(serializers.ModelSerializer):
    days = ItineraryDaySerializer(many=True, required=False)
    photos = ItineraryPhotoSerializer(many=True, required=False)
    user = serializers.SerializerMethodField()
    image = serializers.ImageField(required=True)

    class Meta:
        model = Itinerary
        fields = [
            'id', 'user', 'name', 'description', 'duration', 'destination',
            'price', 'rating', 'status', 'created_at', 'updated_at',
            'days', 'photos', 'image'
        ]
        read_only_fields = ['user', 'rating', 'created_at', 'updated_at']

    def get_user(self, obj):
        return {
            'username': obj.user.username if obj.user else None,
            'id': obj.user.id if obj.user else None,
            'first_name': obj.user.first_name if obj.user else None,
            'last_name': obj.user.last_name if obj.user else None
        }

    def create(self, validated_data):
        days_data = validated_data.pop('days', [])
        photos_data = validated_data.pop('photos', [])
        
        itinerary = Itinerary.objects.create(**validated_data)
        
        for day_data in days_data:
            ItineraryDay.objects.create(itinerary=itinerary, **day_data)
            
        for photo_data in photos_data:
            ItineraryPhoto.objects.create(itinerary=itinerary, **photo_data)
            
        return itinerary

    def update(self, instance, validated_data):
        days_data = validated_data.pop('days', [])
        photos_data = validated_data.pop('photos', [])
        
        # Update itinerary fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update or create days
        for day_data in days_data:
            day, created = ItineraryDay.objects.update_or_create(
                itinerary=instance,
                day_number=day_data['day_number'],
                defaults=day_data
            )
            
        # Add new photos
        for photo_data in photos_data:
            ItineraryPhoto.objects.create(itinerary=instance, **photo_data)
            
        return instance

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    user_id = serializers.PrimaryKeyRelatedField(source='user', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_id', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'user_id', 'created_at', 'updated_at']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name
        }