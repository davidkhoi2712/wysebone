from django.db import models
from django.utils.translation import gettext_lazy as _
from datetime import date
from django.conf import settings
from django.contrib.postgres.fields import JSONField
from wysebone.models.companies import Company
from wysebone.models.table_info import TableInfo
from wysebone.models.item_type import ItemType
from wysebone.utils import unique_string
from wysebone.auths import get_logged_in_user

class TableItem(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=False)
    table_info = models.ForeignKey(TableInfo, on_delete=models.CASCADE, null=False, related_name='fields')
    item_code = models.CharField(_("Item Code"), max_length=100, null=False, unique=True)
    item_name = models.CharField(_("Item Name"), max_length=100, null=False)
    attribute = models.ForeignKey(ItemType, on_delete=models.DO_NOTHING, null=True, blank=True, editable=False)
    item_json = JSONField(null=True)
    delete_flag = models.PositiveIntegerField(_('Delete Flag'), default=0, null=False)
    created_at = models.DateTimeField(_("Creation date"), auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    delete_at = models.DateTimeField(null=True)
    deleted_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True)


    class Meta:
        db_table = "table_item"
        ordering = ['id']
        
    def save(self, *args, **kwargs):
        """Extend model save function,
        Add CODE when insert new table item

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
            self.item_code = unique_string(self, field_name='item_code')
            self.created_by = get_logged_in_user()
        else:
            self.updated_by = get_logged_in_user()
            
        super().save(*args, **kwargs)