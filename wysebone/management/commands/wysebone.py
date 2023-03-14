import glob
import os

from django.core.management.base import BaseCommand
from django.core import management
from django.core.management.commands import loaddata
from django.conf import settings

class Command(BaseCommand):
    help = 'Load default data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--v', '-version', dest='version',
            help='Version of app.',
        )

    def handle(self, *args, **options):
        fixture_dirs = settings.FIXTURE_DIRS[0]
        fixture_str = "%s/*"

        if options['version'] is not None:
            fixture_str += "_"+options['version']

        fixture_str += ".json"

        for currentFile in glob.glob(fixture_str % fixture_dirs):
            management.call_command(loaddata.Command(), currentFile, verbosity=0)

        self.stdout.write(self.style.SUCCESS('Successfully load data.'))    
