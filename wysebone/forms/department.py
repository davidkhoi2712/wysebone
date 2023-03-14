from django import forms
from django.utils.translation import gettext_lazy as _
from wysebone.auths import format_users_MultipleChoice
from wysebone.models.department import Department

class DepartmentForm(forms.ModelForm):
    name = forms.CharField(widget=forms.TextInput(
        attrs={
            'class': 'form-control',
            'name': 'name',
            'placeholder': _('Department name'),
            'maxlength' : 120
        }
    ), required=True)

    class Meta:
        model = Department
        fields = ('name',)

class ChangMemberForm(forms.Form):
    department_to = forms.MultipleChoiceField(
        label=_('Department name'),
        choices=format_users_MultipleChoice,
        required=False,
    )
