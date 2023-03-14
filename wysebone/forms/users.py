from django import forms
from django.contrib.auth.forms import PasswordResetForm, ReadOnlyPasswordHashField
from django.utils.translation import gettext_lazy as _

from django.contrib.auth.models import Group
from django.contrib.admin.widgets import FilteredSelectMultiple
from wysebone.auths import get_admin_permissions

from django.contrib.auth import (
    get_user_model, password_validation,
)
from django.template import loader
from django.core.mail import EmailMultiAlternatives

User = get_user_model()

class UserCreationForm(forms.ModelForm):
    error_messages = {
        'password_mismatch': _("The two password fields didn't match."),
    }

    """A form for creating new users. Includes all the required
    fields, plus a repeated password."""
    password1 = forms.CharField(
        label=_('Password'),
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

    class Meta:
        model = User
        fields = '__all__'

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

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """A form for updating users. Includes all the fields on
    the user, but replaces the password field with admin's
    password hash display field.
    """
    password = ReadOnlyPasswordHashField(label=_('Password'))
    groups = forms.ModelMultipleChoiceField(
        label=_('groups').title(),
        queryset=Group.objects.all().filter(is_admin=True),
        required=False,
        widget=FilteredSelectMultiple(
            verbose_name=_('groups'),
            is_stacked=False
        )
    )
    user_permissions = forms.MultipleChoiceField(
        label=_('user permissions').title(),
        choices=get_admin_permissions,
        required=False,
        widget=FilteredSelectMultiple(
            verbose_name=_('permissions'),
            is_stacked=False
        ),
    )

    def __init__(self, *args, **kwargs):
        super(UserChangeForm, self).__init__(*args, **kwargs)
        self.initial['user_permissions'] = list(self.instance.user_permissions.all().values_list('id', flat=True))

    class Meta:
        model = User
        fields = ('email', 'password',)

    def clean_password(self):
        # Regardless of what the user provides, return the initial value.
        # This is done here, rather than on the field, because the
        # field does not have access to the initial value
        return self.initial["password"]


class ProfileUserForm(forms.ModelForm):
    """
    Form user profile

    @since 1.0.0
    @version 1.0.0
    @author Sanh Nguyen
    """
    first_name = forms.CharField(
        label=_('First name'),
        required=True,
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'placeholder': _('First name'),
                'autocomplete': 'off',
            }
        ),
        max_length=User._meta.get_field('first_name').max_length
    )

    last_name = forms.CharField(
        label=_('Last name'),
        required=True,
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'placeholder': _('Last name'),
                'autocomplete': 'off',
            }
        ),
        max_length=User._meta.get_field('last_name').max_length
    )

    def is_valid(self):
        ret = forms.ModelForm.is_valid(self)
        for f in self.errors:
            self.fields[f].widget.attrs.update(
                {'class': self.fields[f].widget.attrs.get('class', '') + ' is-invalid'})
        return ret

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone', 'birthday', 'language', 'time_zone', 'avatar']
        widgets = {
            'email': forms.EmailInput(
                attrs={
                    'class': 'form-control',
                    'autocomplete': 'email',
                    'placeholder': _('Email Address')
                }
            ),
            'birthday': forms.DateInput(
                attrs={
                    'class': 'form-control datepicker',
                    'autocomplete': 'off',
                    'placeholder': _('Birthday'),
                }
            ),
            'phone': forms.TextInput(
                attrs={
                    'class': 'form-control',
                    'autocomplete': 'off',
                    'placeholder': _('Phone'),
                }
            )
        }
        error_messages = {
            'email': {
                'required': _("Enter a valid email address"),
            },
        }

class UserForgotPasswordForm(PasswordResetForm):
    """
    Form user profile

    @since 1.0.0
    @version 1.0.0
    @author Sanh Nguyen
    """
    
    email = forms.EmailField(
        label=_("Email Address"),
        max_length=64,
        widget=forms.EmailInput(attrs={'autocomplete': 'email', 'class': 'form-control', 'placeholder': _('Email Address')})
    )

    class Meta:
        abstract = True

    def is_valid(self):
        ret = forms.ModelForm.is_valid(self)
        for f in self.errors:
            self.fields[f].widget.attrs.update(
                {'class': self.fields[f].widget.attrs.get('class', '') + ' is-invalid'})
        return ret    
            
    def send_mail(self, subject_template_name, email_template_name,
                  context, from_email, to_email, html_email_template_name=None):
        """
        Send a django.core.mail.EmailMultiAlternatives to `to_email`.
        """
        subject = loader.render_to_string(subject_template_name, context)
        # Email subject *must not* contain newlines
        subject = ''.join(subject.splitlines())
        body = loader.render_to_string(email_template_name, context)

        email_message = EmailMultiAlternatives(subject, body, from_email, [to_email])
        if html_email_template_name is not None:
            html_email = loader.render_to_string(html_email_template_name, context)
            email_message.attach_alternative(html_email, 'text/html')

        try:
            email_message.send()
        except:
            pass