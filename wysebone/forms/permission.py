from django import forms
from django.utils.translation import gettext_lazy as _
from wysebone.auths import format_users_MultipleChoice
from wysebone.models.authority import Authority
from django.core.exceptions import ValidationError
from wysebone.auths import get_company


def validate_is_unique_permission(value, pk=None):
    """Check permission is unique in a company.

    Parameters
    ----------
    value: str
        The permission name.

    Raises
    ------
    ValidationError
        If the permission name already exists in the company.

    Version
    -------
    1.0.0

    Author
    ------
    Thanh Pham
    """

    if Authority.objects.filter(name=value, company=get_company()).exclude(pk=pk).exists():
        raise ValidationError([_("Permission has been created in the system. Please choose another name.")])

class PermissionForm(forms.ModelForm):
    name = forms.CharField(widget=forms.TextInput(
        attrs={
            'class': 'form-control',
            'name': 'name',
            'placeholder': _('Permission Name'),
            'maxlength': 150
        }
    ), required=True)

    def clean_name(self):
        """Validate permission name
    
        Returns
        ----------
        name: str
            The permission name

        Version
        -------
        1.0.0

        Author
        ------
        Thanh Pham
        """

        name = self.cleaned_data.get('name')
        if self.instance:
            validate_is_unique_permission(name, self.instance.pk)
        else:
            validate_is_unique_permission(name)
        return name

    class Meta:
        model = Authority
        fields = ('name',)