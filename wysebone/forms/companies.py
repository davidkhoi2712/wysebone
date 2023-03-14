from django import forms
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Group, Permission
from django.contrib.auth import (
    get_user_model, password_validation,
)
from wysebone.utils import unique_string, get_countries
from wysebone.validates import validate_phone
from django.contrib.auth.models import BaseUserManager
from wysebone import constants
from django.core import validators
from wysebone.models.companies import Company
from wysebone.models.plans import Plan
from django.utils.safestring import mark_safe
from wysebone import dates
from django.contrib.admin.widgets import AdminDateWidget
import datetime

User = get_user_model()


class CompanyAddForm(forms.ModelForm):
    """Create company form
    
    Parameters
    ----------
    ModelForm: django.forms.ModelForm

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    is_instance = False
    user_admin = None

    error_messages = {
        'password_mismatch': _("The two password fields didn't match."),
    }

    code = forms.CharField(
        label=_("Company code"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        widget=forms.TextInput(
            attrs={
                'class': 'vBigIntegerField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        max_length=Company._meta.get_field('code').max_length,
    )
    name = forms.CharField(
        label=_("Company name"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        widget=forms.TextInput(
            attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        max_length=Company._meta.get_field('name').max_length,
    )
    country = forms.ChoiceField(
        label=_("Country"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        choices=get_countries,
    )
    postal_code = forms.CharField(
        label=_("Postal code"),
        required=False,
        widget=forms.TextInput(
            attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        max_length=Company._meta.get_field('postal_code').max_length,
    )
    street = forms.CharField(
        label=_("Address"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'vTextField',
                'name': 'street',
            }
        ),
        required=True,
        max_length=Company._meta.get_field('street').max_length,
    )
    phone = forms.CharField(
        label=_("Rep. phone number"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'vTextField',
                'name': 'phone',
            }
        ),
        required=True,
        max_length=Company._meta.get_field('phone').max_length,
    )
    contract_start_date = forms.DateField(
        label=_("Contract start date"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        initial=datetime.date.today,
        widget=AdminDateWidget(),
    )
    contract_end_date = forms.DateField(
        label=_("Contract end date"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        widget=AdminDateWidget(),
    )
    contract_plan = forms.ModelChoiceField(
        label=_("Contract plan"),
        queryset=Plan.objects.all(), 
        empty_label=_("Please select"), 
        label_suffix=mark_safe(' <b class="text-danger">*</b>'), 
        required=True
    )
    first_name = forms.CharField(
        label=_('First name'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        widget=forms.TextInput(
            attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        max_length=30
    )
    last_name = forms.CharField(
        label=_('Last name'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        widget=forms.TextInput(
            attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        max_length=60
    )
    contact_phone = forms.CharField(
        label=_('Phone number'),
        widget=forms.TextInput(
           attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            },
        ),
        required=False,
        max_length=20,
        validators=[validate_phone]
    )
    email = forms.EmailField(
        label=_('Email address'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        max_length=254,
        widget=forms.EmailInput(
            attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        error_messages={'invalid':_("Enter a valid email address")}
    )
    password1 = forms.CharField(
        label=_('Password'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        widget=forms.PasswordInput(
            attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        help_text=password_validation.password_validators_help_text_html(),
    )
    password2 = forms.CharField(
        label=_('Password confirmation'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        required=True,
        widget=forms.PasswordInput(
            attrs={
                'class': 'vTextField',
                'placeholder': '',
                'autocomplete': 'off',
            }
        ),
        help_text=_("Enter the same password as before, for verification."),
    )

    def clean_email(self):
        email = self.cleaned_data.get('email')

        if self.user_admin is None:
            if email and User.objects.filter(email=email).count() > 0:
                raise forms.ValidationError(_('This email address is already registered.'))
        else:
            if email and User.objects.filter(email=email).exclude(pk=self.user_admin.pk).exists():
                raise forms.ValidationError(_('This email address is already registered.'))

        return email

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError(
                self.error_messages['password_mismatch'],
                code='password_mismatch',
            )
        return password2

    def _post_clean(self):
        super()._post_clean()
        # Validate the password after self.instance is updated with form data by super().
        password = self.cleaned_data.get('password2')
        if password:
            try:
                password_validation.validate_password(password, self.instance)
            except forms.ValidationError as error:
                self.add_error('password2', error)

    def __init__(self, *args, **kwargs):
        super(CompanyAddForm, self).__init__(*args, **kwargs)

        if self.instance and self.instance.pk:
            self.is_instance = True

            # Get user info from company
            try:
                self.user_admin = User.objects.get(company_id=self.instance.pk, is_dynastyle_admin=True)
                self.fields['password1'].required = False
                self.fields['password1'].label_suffix = None
                self.fields['password2'].required = False
                self.fields['password2'].label_suffix = None

                self.initial['first_name'] = self.user_admin.first_name
                self.initial['last_name'] = self.user_admin.last_name
                self.initial['contact_phone'] = self.user_admin.phone
                self.initial['email'] = self.user_admin.email
            except:
                self.user_admin = None

    class Meta:
        model = Company
        fields = '__all__'


class CompanyInfoForm(forms.ModelForm):
    """Company Info form
    
    Parameters
    ----------
    ModelForm: django.forms.ModelForm

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    name = forms.CharField(
        label=_('Company name'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'name': 'name',
                'id': 'id_name'
            }
        ),
        required=True,
        max_length=Company._meta.get_field('name').max_length,
    )
    country = forms.ChoiceField(
        label=_("Country"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.Select(
            attrs={
                'class': 'form-control',
                'name': 'country',
                'id': 'id_country'
            }
        ),
        required=True,
        choices=get_countries,
    )
    street = forms.CharField(
        label=_("Address"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'name': 'street',
                'placeholder': _("Address")
            }
        ),
        required=True,
        max_length=Company._meta.get_field('street').max_length,
    )
    city = forms.CharField(
        label=_("City"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'name': 'city',
                'placeholder': _("City")
            }
        ),
        required=False,
        max_length=Company._meta.get_field('city').max_length,
    )
    state = forms.CharField(
        label=_("State"),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'name': 'state',
                'placeholder': _("State")
            }
        ),
        max_length=Company._meta.get_field('state').max_length,
        required=False,
    )
    postal_code = forms.CharField(
        label=_("Postal code"),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'name': 'postal_code',
                'placeholder': _("Postal code")
            }
        ),
        max_length=Company._meta.get_field('postal_code').max_length,
        required=False,
    )
    phone = forms.CharField(
        label=_("Rep. phone number"),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
           attrs={
                'class': 'form-control',
                'name': 'phone',
                'id': 'id_phone'
            },
        ),
        required=True,
        max_length=Company._meta.get_field('phone').max_length,
        validators=[validate_phone]
    )
    size = forms.CharField(
        label=_('Number of employees'),
        widget=forms.TextInput(
           attrs={
                'class': 'form-control',
                'name': 'size',
                'id': 'id_size'
            },
        ),
        required=False
    )
    domain_name = forms.CharField(
        label=_("Domain name"),
        widget=forms.TextInput(
           attrs={
                'class': 'form-control',
                'name': 'domain_name',
                'id': 'id_domain_name'
            },
        ),
        required=False,
        max_length=Company._meta.get_field('domain_name').max_length,
    )

    def clean_size(self):
        size = self.cleaned_data['size']
        if not size:
           return None

        return size

    class Meta:
        model = Company
        fields = ('country', 'street', 'city', 'state', 'postal_code', 'phone', 'size')
