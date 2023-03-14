from django.core.management.base import BaseCommand
from wysebone.models.item_type import ItemType

class Command(BaseCommand):
    def handle(self, *args, **options):
        ItemType.objects.all().delete()