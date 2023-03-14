from django.shortcuts import render
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from django.utils.translation import gettext_lazy as _
from wysebone.models.apps import App
from django.http import HttpResponseRedirect
from django.contrib import messages
from wysebone import constants


class ChangeAppView(PermissionRequiredMixin, View):
    permission_required = 'wysebone.change_list_table'
    app = None
    
    def get_render(self):
        """Change App form

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        Khoi Pham
        """

        return {
            'the_title': _('Change %s') % _('List Table'),
            'list_active': 'active',
            'app': self.app,
        }