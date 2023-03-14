from django.utils.translation import gettext_lazy as _
from django.db import models
from datetime import date
from wysebone.utils import unique_string
from wysebone.models.companies import Company
from django.conf import settings
from wysebone.auths import get_logged_in_user

class Authority(models.Model):
    """ Permission model
    
    @since 1.0.0
    @version 1.0.0
    @author Thanh Pham
    """
    code = models.CharField(_("Code"), max_length=10, null=True, editable=False, unique=True)
    name = models.CharField(_("Permission Name"), max_length=150, null=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=False)    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, default=None)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, default=None)

    class Meta:
        db_table = "app_permission"
        unique_together = [['name', 'company']]

    def save(self, *args, **kwargs):
        """Extend model save function
        
        @since 1.0.0
        @version 1.0.0
        @author Thanh Pham
        """

        # Add code when insert new permission
        if not self.pk:
            self.created_by = get_logged_in_user()
            self.code = unique_string(self, field_name='code')
        else:
            self.updated_by = get_logged_in_user()

        super().save(*args, **kwargs)