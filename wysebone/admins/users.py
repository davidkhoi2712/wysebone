from django.utils.translation import gettext_lazy as _
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from wysebone.forms.users import UserCreationForm, UserChangeForm
from wysebone.models.users import User
from django.contrib import admin
from django.utils.encoding import smart_text
from django.contrib.auth.models import Group

class GroupsListFilter(admin.SimpleListFilter):
    title = _('groups')
    parameter_name = 'groups__id__exact'

    def lookups(self, request, model_admin):
        groups = Group.objects.filter(is_admin=True)
        for group in groups:
            yield (str(group.pk), smart_text(group))

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(groups__id=self.value())


class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm

    model = User
    list_display = ['email', 'get_full_name', 'is_superuser', 'is_active', 'date_joined','last_login']
    list_filter = ('is_superuser', 'is_active', GroupsListFilter)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal information'), {'fields': ('first_name', 'last_name', 'phone')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'fields': ('email', 'password1', 'password2'),
        }),
    )

    search_fields = ('email', 'first_name', 'last_name', 'phone',)
    ordering = ('-date_joined',)
    filter_horizontal = ('groups', 'user_permissions',)

    def save_model(self, request, obj, form, change):
        """
        Set default is_staff is True
        """
        if not obj.pk:
            obj.is_staff = True

        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        """
        Display the user is staff only
        """
        users = super().get_queryset(request)
        return users.filter(is_staff=True)