from django.utils.translation import gettext_lazy as _
from django.db import models
from datetime import date
from wysebone.models.plans import Plan
from django.conf import settings
from django.core.exceptions import ValidationError
from wysebone.validates import validate_phone
from django.core.validators import MinValueValidator
from wysebone import constants

class Company(models.Model):
    """Company model
    
    Parameters
    ----------
    Model: django.db.models.Model

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    code = models.CharField(_("Company code"), max_length=20, null=True, unique=True, blank=True,)
    name = models.CharField(_("Company name"), max_length=60, null=False)
    country = models.CharField(_("Country"), max_length=2, null=False, blank=True, db_index=True)
    street = models.CharField(_("Address"), max_length=60, null=False, blank=True,)
    city = models.CharField(_("City"), max_length=60, null=False, blank=True,)
    state = models.CharField(_("State"), max_length=60, null=True, blank=True)
    postal_code = models.CharField(_("Postal code"), max_length=8, null=True, blank=True, db_index=True)
    phone = models.CharField(_("Rep. phone number"), max_length=20, validators=[validate_phone], null=True, blank=True)
    size = models.PositiveIntegerField(_('Number of employees'), null=True, blank=True, validators=[MinValueValidator(1)])
    domain_name = models.URLField(_("Domain name"), max_length=150, null=True, blank=True, unique=True, error_messages={'unique':_("This domain name already exists")})
    contract_start_date = models.DateField(_("Contract start date"), default=date.today, null=False)
    contract_end_date = models.DateField(_("Contract end date"), null=False)
    contract_plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, verbose_name=_("Contract plan"), null=True, blank=True, editable=True)
    created_at = models.DateTimeField(_("Creation date"), auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)

    def clean(self):
        if (self.contract_end_date is not None  and self.contract_start_date is not None):
            if (self.contract_end_date <= self.contract_start_date):
                raise ValidationError({'contract_end_date': [_("End time must be greater than start time")]})

    class Meta:
        verbose_name = _('Company')
        verbose_name_plural = _('Companies')
        ordering = ['-created_at']
        db_table = "company"

        permissions = [
            ("view_company_info", "View own company information"),
            ("view_development_account", "View own development account"),
        ]
        
    def total_users(self):
        return self.users.count()
    
    def total_tables(self):
        return self.tables.count()
    
    def total_apps(self):
        return self.apps.filter(type=constants.ENTRY_FORM, delete_flag=constants.DELETE_FLAG_ENABLE).count()
    
    total_users.short_description = _('Number of users')
    total_tables.short_description = _('Number of tables')
    total_apps.short_description = _('Number of applications')