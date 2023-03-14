from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from wysebone.models.users import User
from wysebone.admins.users import UserAdmin

from wysebone.models.companies import Company
from wysebone.admins.companies import CompanyAdmin

from wysebone.models.plans import Plan
from wysebone.admins.plans import PlansAdmin

from django.contrib.auth.models import Group
from wysebone.admins.groups import GroupAdmin

# Register WyseboneUser into admin
admin.site.register(User, UserAdmin)

# Register Wysebone company into admin
admin.site.register(Company, CompanyAdmin)

# Register Wysebone plan into admin
admin.site.register(Plan, PlansAdmin)

# Register group admin
admin.site.unregister(Group)
admin.site.register(Group, GroupAdmin)