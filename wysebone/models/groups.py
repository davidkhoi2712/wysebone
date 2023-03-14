from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.auth.models import Group
from wysebone.models.companies import Company
from wysebone.models.users import User
from wysebone.models.authority import Authority

# Customize group
Group._meta.get_field('name')._unique = False
Group.add_to_class('uuid', models.CharField(verbose_name=_('Employee ID'), editable=False, unique=True, null=True, max_length=10,))
Group.add_to_class('is_admin', models.BooleanField(default=True, editable=False, blank=True))
Group.add_to_class('is_hidden', models.BooleanField(default=False, editable=False, blank=True))
Group.add_to_class('company', models.ForeignKey(Company, on_delete=models.CASCADE, null=True, editable=False))
Group.add_to_class('created_at', models.DateTimeField(_("Creation date"), auto_now_add=True, null=True))
Group.add_to_class('created_by', models.ForeignKey(User, related_name='+', on_delete=models.SET_NULL, null=True, editable=False, default=None))
Group.add_to_class('updated_at', models.DateTimeField(_("Last modified"), auto_now=True, null=True,))
Group.add_to_class('updated_by', models.ForeignKey(User, related_name='+', on_delete=models.SET_NULL, null=True, editable=False, default=None))
Group.add_to_class(
    'app_permissions',
    models.ManyToManyField(
        Authority,
        verbose_name=_('permissions'),
        blank=True,
        editable=False,
    ),
)