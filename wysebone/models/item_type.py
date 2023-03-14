from django.utils.translation import gettext_lazy as _
from django.db import models
from django.conf import settings

class ItemType(models.Model):
    name = models.CharField(_("Name"), max_length=120, null=False)
    codename = models.CharField(_('Code Name'), max_length=60, unique=True)
    icon = models.CharField(_('Icon'), blank=True, max_length=60, null=True)
    description = models.TextField(_('Description'), blank=True, max_length=500, null=True)

    class Meta:
        verbose_name = _('content type')
        verbose_name_plural = _('content types')
        db_table = 'item_type'