from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

# Create your models here.
class Itinerary(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='itineraries', null=True, blank=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.IntegerField(help_text="Duration in days")
    image = models.ImageField(upload_to='itineraries/', null=True, blank=True)
    destination = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.name

class ItineraryDay(models.Model):
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name='days')
    day_number = models.IntegerField()
    title = models.CharField(max_length=100)
    description = models.TextField()

    class Meta:
        ordering = ['day_number']
        unique_together = ['itinerary', 'day_number']

    def __str__(self):
        return f"Day {self.day_number} - {self.title}"

class Stop(models.Model):
    STOP_TYPE_CHOICES = [
        ('activity', 'Activity'),
        ('food', 'Food'),
        ('accommodation', 'Accommodation'),
        ('transport', 'Transport'),
        ('other', 'Other'),
    ]

    itinerary_day = models.ForeignKey(ItineraryDay, on_delete=models.CASCADE, related_name='stops')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    stop_type = models.CharField(max_length=20, choices=STOP_TYPE_CHOICES, default='other')
    location_name = models.CharField(max_length=255, default='')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    order = models.PositiveIntegerField(default=0, help_text="Order of the stop within the day")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.get_stop_type_display()}: {self.name} (Day {self.itinerary_day.day_number})"

class ItineraryPhoto(models.Model):
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='itineraries/photos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.itinerary.name}"

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'itinerary']  # One review per user per itinerary
        ordering = ['-created_at']
    
    
