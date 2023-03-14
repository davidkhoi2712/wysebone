from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from wysebone.utils import unique_string
from wysebone.forms.groups import AdminGroupForm

class GroupAdmin(BaseGroupAdmin):
    """Group for admin

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    form = AdminGroupForm

    def save_model(self, request, obj, form, change):
        """
        Set default uuid
        """
        if not obj.pk:
            obj.uuid = unique_string(obj, field_name='uuid')
            obj.created_by = request.user
        else:
            obj.updated_by = request.user

        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        groups = super().get_queryset(request)

        if request.user.is_staff:
            return groups.filter(is_admin=True)

        return groups.filter(is_admin=False)