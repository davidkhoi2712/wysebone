from django.utils.translation import gettext_lazy as _
from django.contrib import admin
from wysebone.forms.plan import AdminPlanForm
from wysebone.models.plans import Plan
from wysebone.models.companies import Company
from django.contrib import messages

class PlansAdmin(admin.ModelAdmin):
    form = AdminPlanForm

    list_display  = ('name', 'account_limit', 'app_limit', 'created_at', 'updated_at')
    list_filter   = ['created_at']
    search_fields = ['name',]
    ordering = ('-created_at',)

    def save_model(self, request, obj, form, change):
        """
        Update created_by and updated_by for company
        """
        if not obj.pk:
            obj.created_by = request.user
        else:
            obj.updated_by = request.user

        account_limit = request.POST.get('account_limit')
        app_limit = request.POST.get('app_limit')

        if account_limit:
            if len(account_limit.strip()) == 0:
                obj.account_limit = None
            else:
                obj.account_limit = account_limit
        else:
            obj.account_limit = None

        if app_limit:
            if len(app_limit.strip()) == 0:
                obj.app_limit = None
            else:
                obj.app_limit = app_limit
        else:
            obj.app_limit = None

        super().save_model(request, obj, form, change)
        

    def has_delete_permission(self, request, obj=None):
        if obj != None and Company.objects.filter(contract_plan=obj).exists():
            self.message_user(request, _("Cannot delete because of the already associated plan %s.") % obj, level=messages.WARNING)
            return False
        return super(PlansAdmin, self).has_delete_permission(request, obj)