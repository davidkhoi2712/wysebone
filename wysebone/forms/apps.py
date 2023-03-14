from django import forms
from django.utils.translation import gettext_lazy as _
from wysebone.models.apps import App
from wysebone.models.table_info import TableInfo
from wysebone import auths
from django.utils.safestring import mark_safe
from wysebone import constants
from django.core.exceptions import ValidationError


def get_tables():
    list = []
    
    tables = TableInfo.objects.filter(company=auths.get_company())
    for table in tables:
        list.append((table.data_code, table.data_name))
        
    return list

def validate_is_unique_app(self, name, app_type, pk=None):
    """Check app is unique in a company.

    Parameters
    ----------
    value: str
        The app name.

    Raises
    ------
    ValidationError
        If the app name already exists in the company.

    Version
    -------
    1.0.2

    Author
    ------
    Khoi Pham
    Dong Nguyen
    """

    if app_type in [constants.ENTRY_FORM, constants.MENU]:
        if App.objects.filter(name=name, type__in=[constants.ENTRY_FORM, constants.MENU], company=auths.get_company(), delete_flag=constants.DELETE_FLAG_ENABLE).exclude(pk=pk).exists():
            self.add_error('name', ValidationError([_('The %s name has been created in the system. Please choose another name.') % _('Application')]))
    else:
        if App.objects.filter(name=name, type=app_type, company=auths.get_company(), delete_flag=constants.DELETE_FLAG_ENABLE).exclude(pk=pk).exists():
            self.add_error('name', ValidationError([_('The %s name has been created in the system. Please choose another name.') % _('List Table')]))


class AppAddForm(forms.ModelForm):
    name = forms.CharField(
        label=_('Application name'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'name': 'name',
            }
        ),
        required=True,
        max_length=App._meta.get_field('name').max_length,
    )
    icon = forms.CharField(
        widget=forms.HiddenInput(
            attrs={
                'id': 'app_icon'
            }
        ),
    )
    color = forms.CharField(
        widget=forms.HiddenInput(
            attrs={
                'id': 'app_color'
            }
        ),
    )
    tables = forms.MultipleChoiceField(
        label=_('table'),
        choices=get_tables,
        required=False,
        error_messages={
            'invalid_choice':_("Select a valid choice. That choice is not one of the available choices."),
            'required': _("Please select a table."),
        },
    )

    type = forms.IntegerField(
        widget=forms.HiddenInput(
            attrs={
                'id': 'type'
            }
        ),
    )

    def clean(self):
        """Validate name
    
        Returns
        ----------
        name: str
            The app name

        Version
        -------
        1.0.0

        Author
        ------
        Khoi Pham
        """
        name = self.cleaned_data.get('name')
        if self.instance:
            validate_is_unique_app(self, name, self.cleaned_data.get('type'), self.instance.pk)
        else:
            validate_is_unique_app(self, name, self.cleaned_data.get('type'))

    def is_valid(self):
        ret = forms.ModelForm.is_valid(self)
        for f in self.errors:
            self.fields[f].widget.attrs.update(
                {'class': self.fields[f].widget.attrs.get('class', '') + ' is-invalid'})
        return ret

    class Meta:
        model = App
        fields = ('name',)