from django.db import models
from django.contrib.auth.models import User

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
    activities = models.JSONField(default=list)

    class Meta:
        ordering = ['day_number']
        unique_together = ['itinerary', 'day_number']

    def __str__(self):
        return f"Day {self.day_number} - {self.title}"

class ItineraryPhoto(models.Model):
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='itineraries/photos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.itinerary.name}"
    
    
