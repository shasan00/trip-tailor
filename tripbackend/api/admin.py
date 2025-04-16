from django.contrib import admin
# Import all relevant models
from .models import Itinerary, ItineraryDay, Stop, Review, ItineraryPhoto

# Customize Admin views for better usability

class StopInline(admin.TabularInline):
    """Inline configuration for Stops within ItineraryDay admin."""
    model = Stop
    extra = 1 # Show 1 extra blank stop form by default
    fields = ('name', 'stop_type', 'latitude', 'longitude', 'order', 'description')
    ordering = ('order',)

class ItineraryDayAdmin(admin.ModelAdmin):
    """Admin configuration for ItineraryDay."""
    list_display = ('itinerary', 'day_number', 'title')
    list_filter = ('itinerary__destination', 'itinerary__user') # Filter by itinerary destination or user
    search_fields = ('title', 'description')
    inlines = [StopInline] # Allow editing stops directly within the day view

class ItineraryDayInline(admin.TabularInline): # Or StackedInline for a different layout
    """Inline configuration for ItineraryDays within Itinerary admin."""
    model = ItineraryDay
    extra = 1 # Show 1 extra blank day form
    fields = ('day_number', 'title', 'description')
    show_change_link = True # Allows clicking to the full ItineraryDay edit page
    ordering = ('day_number',)

class ItineraryPhotoInline(admin.TabularInline):
    """Inline configuration for ItineraryPhotos within Itinerary admin."""
    model = ItineraryPhoto
    extra = 1
    fields = ('image', 'caption')

class ItineraryAdmin(admin.ModelAdmin):
    """Admin configuration for Itinerary."""
    list_display = ('name', 'destination', 'user', 'duration', 'price', 'status', 'rating', 'created_at')
    list_filter = ('status', 'destination', 'user') # Add filters
    search_fields = ('name', 'destination', 'description', 'user__username') # Allow searching
    readonly_fields = ('created_at', 'updated_at', 'rating') # Fields not directly editable here
    fieldsets = (
        (None, {
            'fields': ('name', 'user', 'destination', 'status')
        }),
        ('Details', {
            'fields': ('description', 'duration', ('latitude', 'longitude'), 'price', 'image')
        }),
        ('Read Only Info', {
            'fields': ('rating', 'created_at', 'updated_at'),
            'classes': ('collapse',), # Make this section collapsible
        }),
    )
    inlines = [ItineraryDayInline, ItineraryPhotoInline] # Allow editing days and photos inline

class ReviewAdmin(admin.ModelAdmin):
    """Admin configuration for Review."""
    list_display = ('itinerary', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'user', 'itinerary__destination')
    search_fields = ('comment', 'user__username', 'itinerary__name')
    readonly_fields = ('created_at', 'updated_at')

class StopAdmin(admin.ModelAdmin):
    """Admin configuration for Stop."""
    list_display = ('name', 'itinerary_day', 'stop_type', 'order')
    list_filter = ('stop_type', 'itinerary_day__itinerary__destination')
    search_fields = ('name', 'description')

class ItineraryPhotoAdmin(admin.ModelAdmin):
    """Admin configuration for ItineraryPhoto."""
    list_display = ('itinerary', 'caption', 'uploaded_at')
    search_fields = ('caption', 'itinerary__name')
    readonly_fields = ('uploaded_at',)

# Register models with their custom admin configurations
admin.site.register(Itinerary, ItineraryAdmin)
admin.site.register(ItineraryDay, ItineraryDayAdmin)
admin.site.register(Stop, StopAdmin)
admin.site.register(Review, ReviewAdmin)
admin.site.register(ItineraryPhoto, ItineraryPhotoAdmin)

