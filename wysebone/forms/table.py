from django import forms
from django.template.loader import render_to_string
from wysebone.models.table_info import TableInfo
from wysebone.auths import get_company
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from wysebone.constants import TEXT, NUMBER, DATE, CHECKBOX

# constance
ITEM_TYPES = ((TEXT, _('Text')),(NUMBER, _('Numeric')), (DATE, _('Date')), (CHECKBOX, _('Yes/No')))

def validate_is_unique_table(value, pk=None):
    """Check table is unique in a company.

    Parameters
    ----------
    value: str
        The table name.

    Raises
    ------
    ValidationError
        If the table name already exists in the company.

    Version
    -------
    1.0.0

    Author
    ------
    Bui Huu Phuc
    """

    if TableInfo.objects.filter(data_name=value, company=get_company()).exclude(pk=pk).exists():
        raise ValidationError([_("The table name has been created in the system. Please choose another name.")])

class TableForm(forms.ModelForm):
    use_required_attribute=False

    data_name = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
            }
        ),
        required=True,
        max_length=100,
    )

    def clean_data_name(self):
        """Validate data_name
    
        Returns
        ----------
        name: str
            The permission name

        Version
        -------
        1.0.0

        Author
        ------
        Bui Huu Phuc
        """

        data_name = self.cleaned_data.get('data_name')
        if self.instance:
            validate_is_unique_table(data_name, self.instance.pk)
        else:
            validate_is_unique_table(data_name)
        return data_name

    class Meta:
        model = TableInfo
        fields = ('data_name',)



class BaseItem(forms.Form):
    template = 'wysebone/table/items/text.html'

    use_required_attribute=False

    def as_item(self):
        return render_to_string(
            self.template,
            {
                'data': self,
            }
        )



class TextItem(BaseItem):
    template = 'wysebone/table/items/text.html'

    item_name = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        max_length=64,
        required=True,
    )

    field_size = forms.IntegerField(
        widget=forms.NumberInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        min_value=1,
        max_value=256,
        required=True,
    )

    default_value = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        required=False
    )

    required = forms.BooleanField(
        required=False
    )

    item_type = forms.CharField(
        widget=forms.Select(
            choices=ITEM_TYPES,
            attrs={
                'class': 'form-control form-control-sm item-type',
            }
        ),
        required=True,
    )

class NumericItem(BaseItem):
    template = 'wysebone/table/items/numeric.html'

    item_name = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        max_length=64,
        required=True,
    )

    number_of_digits = forms.IntegerField(
        widget=forms.NumberInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        min_value=1,
        max_value=38,
        required=True,
    )

    decimal_digits = forms.IntegerField(
        widget=forms.NumberInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        min_value=0,
        max_value=38,
        required=True,
    )

    default_value = forms.FloatField(
        widget=forms.NumberInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        required=False
    )

    required = forms.BooleanField(
        required=False
    )

    auto_number = forms.BooleanField(
        required=False
    )

    item_type = forms.CharField(
        widget=forms.Select(
            choices=ITEM_TYPES,
            attrs={
                'class': 'form-control form-control-sm item-type',
            }
        ),
        required=True,
    )

class DateItem(BaseItem):
    template = 'wysebone/table/items/date.html'

    item_name = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        max_length=64,
        required=True,
    )

    default_value = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'form-control form-control-sm datepicker',
            }
        ),
        required=False
    )

    required = forms.BooleanField(
        required=False
    )

    item_type = forms.CharField(
        widget=forms.Select(
            choices=ITEM_TYPES,
            attrs={
                'class': 'form-control form-control-sm item-type',
            }
        ),
        required=True,
    )

class YesNoItem(BaseItem):
    template = 'wysebone/table/items/yesno.html'

    item_name = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'form-control form-control-sm',
            }
        ),
        max_length=64,
        required=True,
    )

    default_value = forms.BooleanField(
        required=False
    )

    item_type = forms.CharField(
        widget=forms.Select(
            choices=ITEM_TYPES,
            attrs={
                'class': 'form-control form-control-sm item-type',
            }
        ),
        required=True,
    )