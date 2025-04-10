from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Itinerary
from .serializers import ItinerarySerializer

# Create your views here.
@api_view(['GET'])
def itinerary_list(request):
    itineraries = Itinerary.objects.all()
    serializer = ItinerarySerializer(itineraries, many=True)
    return Response(serializer.data)

