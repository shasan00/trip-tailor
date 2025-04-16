from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Itinerary, ItineraryDay, ItineraryPhoto, Review, Stop
import logging
import json

# Set up logger
logger = logging.getLogger(__name__)

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

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = ['id', 'name', 'description', 'stop_type', 'latitude', 'longitude', 'order', 'location_name']
        read_only_fields = ['id']

class ItineraryDaySerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, required=False)

    class Meta:
        model = ItineraryDay
        fields = ['id', 'day_number', 'title', 'description', 'stops']
        read_only_fields = ['id']

class ItinerarySerializer(serializers.ModelSerializer):
    days = ItineraryDaySerializer(many=True, read_only=True)
    photos = ItineraryPhotoSerializer(many=True, required=False, read_only=True)
    user = serializers.SerializerMethodField(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Itinerary
        fields = [
            'id', 'user', 'name', 'description', 'duration', 'destination',
            'latitude', 'longitude',
            'price', 'rating', 'status', 'created_at', 'updated_at',
            'days',
            'photos',
            'image'
        ]
        read_only_fields = ['user', 'rating', 'created_at', 'updated_at', 'id']

    def get_user(self, obj):
        if obj.user:
            return {
                'username': obj.user.username,
                'id': obj.user.id,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name
            }
        return None

    def save(self, **kwargs):
        user = kwargs.pop('user', None)
        days_data = kwargs.pop('days_data', None)
        
        if not self.instance and user:
            self.validated_data['user'] = user
            
        self.context['days_data'] = days_data
        
        return super().save(**kwargs)

    def create(self, validated_data):
        days_data = self.context.get('days_data', None)
        logger.info(f"Creating itinerary with validated data: {validated_data}")
        logger.info(f"Received Days data in create via context: {days_data}")
        
        itinerary = Itinerary.objects.create(**validated_data)
        logger.info(f"Created itinerary with ID: {itinerary.id}")

        try:
            if days_data:
                logger.info(f"Processing {len(days_data)} days for itinerary {itinerary.id}")
                for day_data in days_data:
                    stops_data = day_data.pop('stops', [])
                    if isinstance(stops_data, str):
                        try:
                            stops_data = json.loads(stops_data)
                            logger.info(f"Parsed stops_data from JSON string for day {day_data.get('day_number', 'N/A')}. Type: {type(stops_data)}, Content: {stops_data}")
                        except Exception as e:
                            logger.error(f"Error parsing stops data: {e}")
                            stops_data = []
                    else:
                         logger.info(f"Received stops_data directly for day {day_data.get('day_number', 'N/A')}. Type: {type(stops_data)}, Content: {stops_data}")

                    logger.info(f"Creating day with data: {day_data}")
                    day_instance = ItineraryDay.objects.create(itinerary=itinerary, **day_data)
                    logger.info(f"Created day with ID: {day_instance.id}")

                    if stops_data: 
                        for stop_data in stops_data:
                            logger.info(f"Attempting to create stop with data: {stop_data}")
                            if 'location_name' not in stop_data and 'address' in stop_data:
                                stop_data['location_name'] = stop_data.pop('address')
                            elif 'location_name' not in stop_data:
                                lat = stop_data.get('latitude', '0')
                                lng = stop_data.get('longitude', '0')
                                stop_data['location_name'] = f"Location: {lat}, {lng}"
                            logger.info(f"Final stop data before creation: {stop_data}")
                            Stop.objects.create(itinerary_day=day_instance, **stop_data)
                            logger.info(f"Successfully created stop for day {day_instance.id}")
                    else:
                         logger.info(f"No stops data found or processed for day {day_instance.id}")
                         
            elif 'duration' in validated_data:
                logger.info(f"No days data provided, creating default days based on duration: {validated_data['duration']}")
                for day_number in range(1, validated_data['duration'] + 1):
                    ItineraryDay.objects.create(itinerary=itinerary, day_number=day_number, title=f"Day {day_number}", description="")
                    logger.info(f"Created default day {day_number}")
            else:
                 logger.info("No days data provided and no duration found.")
                 
        except Exception as e:
            logger.exception(f"Error creating related objects: {str(e)}")
            raise
            
        return itinerary

    def update(self, instance, validated_data):
        days_data = self.context.get('days_data', None)
        logger.info(f"Updating itinerary {instance.id} with validated data: {validated_data}")
        logger.info(f"Received Days data in update via context: {days_data}")
        
        instance = super().update(instance, validated_data)
        
        if days_data is not None: 
            logger.info(f"Processing {len(days_data)} days for itinerary update {instance.id}")
            
            for day_data in days_data:
                stops_data = day_data.pop('stops', [])
                if isinstance(stops_data, str):
                    try:
                        stops_data = json.loads(stops_data)
                        logger.info(f"Parsed stops_data from JSON string for day {day_data.get('day_number', 'N/A')} update. Type: {type(stops_data)}, Content: {stops_data}")
                    except Exception as e:
                        logger.error(f"Error parsing stops data for update: {e}")
                        stops_data = []
                else:
                    logger.info(f"Received stops_data directly for day {day_data.get('day_number', 'N/A')} update. Type: {type(stops_data)}, Content: {stops_data}")
                
                day_number = day_data.get('day_number')
                day_instance = instance.days.filter(day_number=day_number).first()
                
                if day_instance:
                    logger.info(f"Updating existing day {day_instance.id} with data: {day_data}")
                    for attr, value in day_data.items():
                        setattr(day_instance, attr, value)
                    day_instance.save()
                else:
                    logger.info(f"Creating new day {day_number} during update with data: {day_data}")
                    day_instance = ItineraryDay.objects.create(itinerary=instance, **day_data)

                if stops_data:
                    logger.info(f"Processing {len(stops_data)} stops for updated/new day {day_instance.id}")
                    for stop_data in stops_data:
                        logger.info(f"Attempting to create/update stop with data: {stop_data}")
                        if 'location_name' not in stop_data and 'address' in stop_data:
                             stop_data['location_name'] = stop_data.pop('address')
                        elif 'location_name' not in stop_data:
                             lat = stop_data.get('latitude', '0')
                             lng = stop_data.get('longitude', '0')
                             stop_data['location_name'] = f"Location: {lat}, {lng}"
                            
                        stop_id = stop_data.pop('id', None)
                        logger.info(f"Final stop data before update/creation: {stop_data}, ID: {stop_id}")
                        
                        if stop_id:
                            stop_instance = day_instance.stops.filter(id=stop_id).first()
                            if stop_instance:
                                logger.info(f"Updating existing stop {stop_id}")
                                for attr, value in stop_data.items():
                                    setattr(stop_instance, attr, value)
                                stop_instance.save()
                                logger.info(f"Successfully updated stop {stop_id}")
                            else:
                                logger.warning(f"Stop with ID {stop_id} not found for day {day_instance.id}. Creating new stop instead.")
                                Stop.objects.create(itinerary_day=day_instance, **stop_data)
                                logger.info(f"Successfully created new stop after failing to find ID {stop_id}")
                        else:
                            logger.info("No stop ID provided, creating new stop.")
                            Stop.objects.create(itinerary_day=day_instance, **stop_data)
                            logger.info(f"Successfully created new stop for day {day_instance.id}")
                else:
                    logger.info(f"No stops data found or processed for updated/new day {day_instance.id}")
        else:
            logger.info("No days data provided for update.")
            
        try:
            pass
        except Exception as e:
            logger.exception(f"Error during final update steps: {str(e)}")
            raise
            
        return instance

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'user', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at', 'id']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name
        }