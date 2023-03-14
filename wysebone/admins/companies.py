from django.utils.translation import gettext_lazy as _
from django.contrib import admin

from wysebone.models.users import User
from wysebone.forms.companies import CompanyAddForm
from wysebone.models.companies import Company

from wysebone import constants
from django.contrib.auth.models import BaseUserManager
from wysebone.utils import unique_string


class CompanyAdmin(admin.ModelAdmin):
    """Company admin
    
    Parameters
    ----------
    ModelAdmin: django.contrib.admin.ModelAdmin

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    form = CompanyAddForm
    # add_form_template = 'admin/company/add_form.html'

    model = Company

    # save_on_top = True
    fieldsets = [
        (_('Company information'), {'fields': ('code', 'name', 'country', 'postal_code', 'street', 'city', 'state', 'phone', 'size', 'domain_name', 'contract_start_date', 'contract_end_date', 'contract_plan')}),
        (_('Administrator information'), {'fields': ('first_name', 'last_name', 'contact_phone', 'email', 'password1', 'password2')}),
    ]

    list_display  = ('name', 'total_users', 'total_tables', 'total_apps', 'created_at', 'updated_at')
    list_filter   = ['created_at']
    ordering = ('-updated_at',)
    search_fields = ['code', 'name', 'country', 'postal_code', 'street', 'city', 'state', 'phone', 'domain_name']

    def save_model(self, request, obj, form, change):
        """
        Update created_by and updated_by for company
        """

        if not obj.pk:
            obj.created_by = request.user
        else:
            obj.updated_by = request.user

        super().save_model(request, obj, form, change)

        try:
            user_admin = User.objects.get(company_id=obj.pk, is_dynastyle_admin=True)
            
            user_admin.first_name = request.POST.get('first_name')
            user_admin.last_name  = request.POST.get('last_name')
            user_admin.email      = request.POST.get('email')
            user_admin.phone      = request.POST.get('contact_phone')

            password = request.POST.get('password1')
            if password:
                user_admin.set_password(password)

            user_admin.save()

        except:
            # Create admin-user for customer
            user_admin = User.objects.create(
                first_name=request.POST.get('first_name'),
                last_name=request.POST.get('last_name'),
                email=BaseUserManager.normalize_email(request.POST.get('email')),
            )

            user_admin.set_password(request.POST.get('password1'))

            user_admin.company      = obj
            user_admin.is_superuser = False
            user_admin.is_staff     = False
            user_admin.is_active    = True
            user_admin.phone        = request.POST.get('contact_phone')
            user_admin.user_id      = unique_string(user_admin, field_name='user_id')
            user_admin.roles.add(constants.CUSTOMER_ADMIN_ROLE)
            user_admin.is_dynastyle_admin     = True

            user_admin.save()
            