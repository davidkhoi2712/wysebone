from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from wysebone import constants

class Command(BaseCommand):
    def handle(self, *args, **options):
        User = get_user_model()
        
        # Get list of company'users
        users = User.objects.filter(is_staff=False)
        for user in users:
            if user.has_perm('wysebone.view_company_info'):
                user.roles.add(constants.CUSTOMER_ADMIN_ROLE)
                user.is_dynastyle_admin = True
                continue
            
            if user.has_perm('auth.view_group'):
                user.roles.add(constants.CUSTOMER_DEVELOPER_ROLE)
                continue
            
            user.roles.add(constants.CUSTOMER_GENERAL_ROLE)
