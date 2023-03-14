from django.shortcuts import render
from django.db import transaction
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone import alert
from django.utils.translation import gettext_lazy as _
from wysebone.forms.apps import AppAddForm
from wysebone.models.apps import App
from wysebone.models.table_info import TableInfo
from wysebone.models.plans import Plan
from django.contrib import messages
from django.http import HttpResponseRedirect
from wysebone.utils import  get_next_url
from wysebone import constants
from django.urls import reverse


class AddAppView(PermissionRequiredMixin, View):
    permission_required = 'wysebone.add_app'

    def get(self, request):
        """New App form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        """
        
        item_types = {
            'TEXT':               constants.TEXT,
            'CHECKBOX':           constants.CHECKBOX,
            'SELECTION':          constants.SELECTION,
            'DATE':               constants.DATE,
            'TIME':               constants.TIME,
            'NUMBER':             constants.NUMBER,
            'RADIO':              constants.RADIO,
            'URL':                constants.URL,
            'ATTACHMENT':         constants.ATTACHMENT,
            'LOOKUP':             constants.LOOKUP,
            'CREATED_TIME':       constants.CREATED_TIME,
            'LAST_MODIFIED_TIME': constants.LAST_MODIFIED_TIME,
            'LABEL':              constants.LABEL,
            'BUTTON':             constants.BUTTON,
            'LIST_OBJECT':        constants.LIST_OBJECT,
        }
        
        events = {
            'RECORD_SEARCH':           constants.RECORD_SEARCH,
            'DISPLAY_CONTENT':         constants.DISPLAY_CONTENT,
            'ACTION_ON_OTHER_OBJECTS': constants.ACTION_ON_OTHER_OBJECTS,
            'RECORD_REGISTER':         constants.RECORD_REGISTER,
            'DELETE_RECORD':           constants.DELETE_RECORD,
            'SCREEN_TRANSITION':       constants.SCREEN_TRANSITION,
            'SET_OUTPUT':              constants.SET_OUTPUT,
            'SUM':                     constants.SUM,
            'MULTIPLICATION':          constants.MULTIPLICATION,
        }
        
        return render(request, 'wysebone/app/form_setting.html', {
            'the_title': _('Add %s') % _('Application'),
            'app_active': 'active',
            'app': None,
            'tables': None,
            'item_types': item_types,
            'events': events,
            'is_app_menu': True
            # 'closed_sidebar': 'closed-sidebar'
        })
