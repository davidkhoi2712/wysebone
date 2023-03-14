from django.db import models
from django.utils.translation import gettext_lazy as _
from datetime import date
from wysebone.models.companies import Company
from wysebone.utils import unique_string
from django.conf import settings
from wysebone.auths import get_logged_in_user

class Department(models.Model):
    uuid = models.CharField(verbose_name=_('UUID'), editable=False, unique=True, null=True, max_length=10)
    name = models.CharField(_("Name"), max_length=120, null=False, blank=True)
    description = models.CharField(_("Description"), max_length=254, null=True, blank=False)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True ,related_name='children')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=False, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL)

    def save(self, *args, **kwargs):

        # Add user_id when insert new user
        if not self.pk:
            self.created_by = get_logged_in_user()
            self.uuid = unique_string(self, field_name='uuid')
        else:
            self.updated_by = get_logged_in_user()

        super().save(*args, **kwargs)

    class Meta:
        db_table = "department"
