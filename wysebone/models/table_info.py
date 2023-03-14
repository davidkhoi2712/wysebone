from django.db import models
from django.utils.translation import gettext_lazy as _
from datetime import date
from wysebone.models.companies import Company
from django.conf import settings
from wysebone.utils import unique_string
from wysebone.auths import get_logged_in_user

class TableInfo(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=False, default=None, editable=False, related_name='tables')
    data_code = models.CharField(_("Data Code"), max_length=30, null=False, unique=True)
    data_name = models.CharField(_("Data Name"), max_length=100, null=False)
    business_database = models.CharField(_("Business Database"), max_length=200, null=True)
    business_table = models.CharField(_("Business Table"), max_length=200, null=True)
    delete_flag = models.PositiveIntegerField(_('Delete Flag'), default=0, null=False)
    created_at = models.DateTimeField(_("Creation date"), auto_now_add=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    delete_at = models.DateTimeField(null=True)
    deleted_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = "table_info"
        unique_together = [['data_name', 'company']]
        
    def save(self, *args, **kwargs):
        """Extend model save function,
        Add CODE when insert new table

        Parameters
        ----------
        args: *args
        kwargs: kwargs

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        if not self.pk:
            self.data_code = unique_string(self, field_name='data_code')
            self.created_by = get_logged_in_user()
        else:
            self.updated_by = get_logged_in_user()
            
        super().save(*args, **kwargs)