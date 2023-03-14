from django import forms
from wysebone.models.users import User
from django.core.exceptions import ValidationError
from django.core import validators
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import password_validation
from wysebone.auths import get_permissions, get_company, get_groups, get_roles
from wysebone import dates
from django.contrib.auth.models import Group
from wysebone import constants

class LoginForm(forms.Form):
    """Login form
    
    Parameters
    ----------
    Form: django.forms.Form

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """
    email = forms.EmailField(widget=forms.EmailInput(
        attrs={
            'class': 'form-control',
            'placeholder': _('Email address'),
            'autocomplete': 'email',
            'name': 'email'
        }
    ), required=True)
    password = forms.CharField(widget=forms.PasswordInput(
        attrs={
            'class': 'form-control',
            'placeholder': _("Password"),
            'name': 'password'
        }
    ), required=True)


class CreateUserForm(forms.ModelForm):
    """Create User Form
    
    Parameters
    ----------
    Form: django.forms.Form

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """
    error_messages = {
        'password_mismatch': _("The two password fields didn't match."),
    }

    email = forms.CharField(widget=forms.EmailInput(
        attrs={
            'class': 'form-control',
            'placeholder': _('Email address'),
            'name': 'email',
            'autocomplete': 'email',
            'maxlength' : '254'
        }
    ), required=True, validators=[validators.validate_email], error_messages={'invalid':_("Enter a valid email address")})
    password1 = forms.CharField(widget=forms.PasswordInput(
        attrs={
            'class': 'form-control',
            'placeholder': _("Password"),
            'name': 'password',
            'id': 'password1',
            'autocomplete': 'off',
            'maxlength' : '128'
        }
    ), required=True)
    password2 = forms.CharField(widget=forms.PasswordInput(
        attrs={
            'class': 'form-control',
            'placeholder': _('Password confirmation'),
            'name': 'password_confirmation',
            'id': 'password2',
            'autocomplete': 'off',
            'maxlength' : '128'
        }
    ), required=True)
    first_name = forms.CharField(widget=forms.TextInput(
        attrs={
            'class': 'form-control',
            'placeholder': _('First name'),
            'name': 'first_name',
            'autocomplete': 'off',
            'maxlength' : '30'
        }
    ), required=True, max_length=30)
    last_name = forms.CharField(widget=forms.TextInput(
        attrs={
            'class': 'form-control',
            'placeholder': _('Last name'),
            'name': 'last_name',
            'autocomplete': 'off',
            'maxlength' : '150'
        }
    ), required=True, max_length=150)
    phone = forms.CharField(widget=forms.TextInput(
        attrs={
            'class': 'form-control',
            'name': 'phone',
            'id': 'phone',
            'autocomplete': 'off',
            'maxlength' : '20'
        }
    ), max_length=20, required=False,)
    birthday = forms.DateField(widget=forms.DateInput(
        attrs={
            'class': 'form-control User-datepicker',
            'name': 'birthday',
            'id': 'birthday',
            'autocomplete': 'off',
        }
    ), required=False,)
    hire_date = forms.DateField(widget=forms.DateInput(
        attrs={
            'class': 'form-control User-datepicker',
            'name': 'hire_date',
            'id': 'hire_date',
            'autocomplete': 'off',
        }
    ), required=False,)
    avatar = forms.FileField(widget=forms.FileInput(
        attrs={
            'class': 'user-button-file-upload',
            'name': 'avatar',
            'id': 'user_avatar',
            'accept': 'image/*'
        }
    ), required=False)
    permissions_to = forms.MultipleChoiceField(
        label=_('permissions'),
        choices=get_permissions,
        required=False,
        error_messages={'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
    )
    groups_to = forms.MultipleChoiceField(
        label=_('groups'),
        choices=get_groups,
        required=False,
        error_messages={'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
    )
    roles = forms.MultipleChoiceField(
        label=_('Roles'),
        choices=get_roles,
        required=True,
        error_messages={'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
    )

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
                password_validation.validate_password(password, self)
            except forms.ValidationError as error:
                self.add_error('password2', error)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone', 'birthday', 'hire_date',)


class ChangeUserForm(forms.ModelForm):
    """Create User Form
    
    Parameters
    ----------
    Form: django.forms.Form

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """
    email = forms.CharField(widget=forms.EmailInput(
        attrs={
            'class': 'form-control',
            'placeholder': _('Email address'),
            'name': 'email',
            'autocomplete': 'email',
            'maxlength' : '254'
        }
    ), required=True, validators=[validators.validate_email], error_messages={'invalid':_("Enter a valid email address")})
    avatar = forms.FileField(widget=forms.FileInput(
        attrs={
            'class': 'user-button-file-upload',
            'name': 'avatar',
            'id': 'user_avatar',
            'accept': 'image/png, image/jpeg, image/jpg, image/gif'
        }
    ), required=False)
    permissions_to = forms.MultipleChoiceField(
        label=_('permissions'),
        choices=get_permissions,
        required=False,
        error_messages={'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
    )
    groups_to = forms.MultipleChoiceField(
        label=_('groups'),
        choices=get_groups,
        required=False,
        error_messages={'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
    )
    roles = forms.MultipleChoiceField(
        label=_('Roles'),
        choices=get_roles,
        required=True,
        error_messages={'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
    )
    first_name = forms.CharField(widget=forms.TextInput(
        attrs={
            'class': 'form-control',
            'placeholder': _('First name'),
            'name': 'first_name',
            'autocomplete': 'off',
            'maxlength' : '30'
        }
    ), required=True, max_length=30)
    last_name = forms.CharField(widget=forms.TextInput(
        attrs={
            'class': 'form-control',
            'placeholder': _('Last name'),
            'name': 'last_name',
            'autocomplete': 'off',
            'maxlength' : '150'
        }
    ), required=True, max_length=150)
    phone = forms.CharField(widget=forms.TextInput(
        attrs={
            'class': 'form-control',
            'name': 'phone',
            'id': 'phone',
            'autocomplete': 'off',
            'maxlength' : '20'
        }
    ), max_length=20, required=False,)
    birthday = forms.DateField(widget=forms.DateInput(
        attrs={
            'class': 'form-control User-datepicker',
            'name': 'birthday',
            'id': 'birthday',
            'autocomplete': 'off',
        }
    ), required=False,)
    hire_date = forms.DateField(widget=forms.DateInput(
        attrs={
            'class': 'form-control User-datepicker',
            'name': 'hire_date',
            'id': 'hire_date',
            'autocomplete': 'off',
        }
    ), required=False,)
    
    def clean_roles(self):
        roles = self.cleaned_data.get('roles')
        
        if self.instance and self.instance.pk:
            if self.instance.is_dynastyle_admin and str(constants.CUSTOMER_ADMIN_ROLE) not in roles:
                raise forms.ValidationError(_('Can not remove the administrator authority.'))
        
        return roles

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone', 'birthday', 'hire_date',)