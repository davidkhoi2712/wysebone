from django import forms
from django.utils.translation import gettext_lazy as _
from django.utils.safestring import mark_safe
from django.contrib.auth.models import Permission
from django.contrib.admin.widgets import FilteredSelectMultiple
from wysebone.auths import get_permissions, format_users_MultipleChoice
from wysebone.validates import validate_is_unique_group
from django.contrib.auth.models import Group, Permission
from wysebone.auths import get_admin_permissions


class AdminGroupForm(forms.ModelForm):
    name = forms.CharField(
        label=_('Name'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        required=True,
        max_length=Group._meta.get_field('name').max_length,
    )
    permissions = forms.MultipleChoiceField(
        label=_('permissions').title(),
        choices=get_admin_permissions,
        required=False,
        widget=FilteredSelectMultiple(
            verbose_name=_('permissions'),
            is_stacked=False
        ),
    )

    def __init__(self, *args, **kwargs):
        super(AdminGroupForm, self).__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk:
            self.initial['permissions'] = list(self.instance.permissions.all().values_list('id', flat=True))
        
    class Meta:
        model = Group
        fields = ('name', 'permissions',)


class NewGroupForm(forms.ModelForm):
    """New group form

    Parameters
    ----------
    Form: django.forms.Form

    Version
    -------
    1.0.2

    Author
    ------
    Dong Nguyen
    Thanh Pham
    """

    name = forms.CharField(
        label=_('Name'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'name': 'name',
            }
        ),
        required=True,
        max_length=150,
    )
    users_to = forms.MultipleChoiceField(
        label=_('users'),
        required=False,
        choices=format_users_MultipleChoice,
        error_messages={'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
    )
    permissions_to = forms.MultipleChoiceField(
        label=_('permissions'),
        choices=get_permissions,
        required=False,
        error_messages={'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
    )

    def clean_name(self):
        """Validate group name
    
        Returns
        ----------
        name: str
            The group name

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        name = self.cleaned_data.get('name')
        if self.instance:
            validate_is_unique_group(name, self.instance.pk)
        else:
            validate_is_unique_group(name)
        return name

    class Meta:
        model = Group
        fields = ('name', 'permissions_to',)      