from django.utils.translation import gettext_lazy as _
from django.db import models

class Role(models.Model):
    """ Role model
    
    @since 1.0.0
    @version 1.0.0
    @author Thanh Pham
    """
    name = models.CharField(_("Role Name"), max_length=150, null=False)

    class Meta:
        db_table = "auth_role"