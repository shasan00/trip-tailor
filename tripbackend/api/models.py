from django.db import models

# Create your models here.
class Itinerary(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.IntegerField()
    image = models.ImageField(upload_to='itineraries/')
    destination = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    rating = models.DecimalField(max_digits=3, decimal_places=1)

    def __str__(self):
        return self.name
    
    
