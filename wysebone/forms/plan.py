from django import forms
from django.utils.translation import gettext_lazy as _
from wysebone.models.plans import Plan
from django.utils.safestring import mark_safe

class AdminPlanForm(forms.ModelForm):
    name = forms.CharField(
        label=_('Plan name'),
        label_suffix=mark_safe(' <b class="text-danger">*</b>'),
        widget=forms.TextInput(
            attrs={
                'class': 'vTextField',
                'name': 'name',
                'placeholder': _('Plan name'),
                'autocomplete': 'off'
            }
        ),
        required=True,
        max_length=Plan._meta.get_field('name').max_length,
    )

    account_limit = forms.CharField(
        label=_('Limit the number of accounts'),
        widget=forms.TextInput(
           attrs={
                'class': 'vIntegerField',
                'name': 'account_limit',
                'id': 'id_account_limit',
            },
        ),
        required=False
    )

    app_limit = forms.CharField(
        label=_('Limit the number of applications'),
        widget=forms.TextInput(
           attrs={
                'class': 'vIntegerField',
                'name': 'app_limit',
                'id': 'id_app_limit',
            },
        ),
        required=False
    )
        
    class Meta:
        model = Plan
        fields = ('name', 'account_limit', 'app_limit')

class PlanForm(forms.ModelForm):
    name = forms.CharField(
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'name': 'name',
                'placeholder': _('Plan name'),
                'maxlength': 120
            }
        ), required=True
    )

    account_limit = forms.CharField(
        label=_('Limit the number of accounts'),
        widget=forms.TextInput(
           attrs={
                'class': 'form-control',
                'name': 'account_limit',
                'id': 'id_account_limit',
            },
        ),
        required=False
    )

    app_limit = forms.CharField(
        label=_('Limit the number of applications'),
        widget=forms.TextInput(
           attrs={
                'class': 'form-control',
                'name': 'app_limit',
                'id': 'id_app_limit',
            },
        ),
        required=False
    )

    class Meta:
        model = Plan
        fields = ('name', 'account_limit', 'app_limit')