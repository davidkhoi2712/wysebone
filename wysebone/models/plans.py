from django.utils.translation import gettext_lazy as _
from django.db import models
from datetime import date
from django.conf import settings
from django.core.validators import MinValueValidator

class Plan(models.Model):
    name = models.CharField(verbose_name=_("Plan name"), max_length=120, null=False)
    account_limit = models.PositiveSmallIntegerField(verbose_name=_('Limit the number of accounts'), null=True, blank=True, validators=[MinValueValidator(1)])
    app_limit = models.PositiveSmallIntegerField(verbose_name=_('Limit the number of applications'), null=True, blank=True, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(verbose_name=_("Creation date"), auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at = models.DateTimeField(verbose_name=_("Last modified"), auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = _("Contract plan")
        verbose_name_plural = _('Contract plan')
        db_table = "contract_plans"

    def __str__(self):
        return self.name
