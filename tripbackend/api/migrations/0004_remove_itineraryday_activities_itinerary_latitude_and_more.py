# Generated by Django 5.2 on 2025-04-16 03:23

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_review"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="itineraryday",
            name="activities",
        ),
        migrations.AddField(
            model_name="itinerary",
            name="latitude",
            field=models.DecimalField(
                blank=True, decimal_places=6, max_digits=9, null=True
            ),
        ),
        migrations.AddField(
            model_name="itinerary",
            name="longitude",
            field=models.DecimalField(
                blank=True, decimal_places=6, max_digits=9, null=True
            ),
        ),
        migrations.CreateModel(
            name="Stop",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=150)),
                ("description", models.TextField(blank=True)),
                (
                    "stop_type",
                    models.CharField(
                        choices=[
                            ("activity", "Activity"),
                            ("food", "Food"),
                            ("accommodation", "Accommodation"),
                            ("transport", "Transport"),
                            ("other", "Other"),
                        ],
                        default="other",
                        max_length=20,
                    ),
                ),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                (
                    "order",
                    models.PositiveIntegerField(
                        default=0, help_text="Order of the stop within the day"
                    ),
                ),
                (
                    "itinerary_day",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stops",
                        to="api.itineraryday",
                    ),
                ),
            ],
            options={
                "ordering": ["order"],
            },
        ),
    ]
