from django.shortcuts import render
from django.utils.translation import gettext_lazy as _
from django.http import HttpResponseRedirect
from django.contrib import messages
from wysebone.views.list_tables.change import ChangeAppView
from django.db import transaction
from wysebone import alert
from wysebone.utils import get_next_url
from wysebone.models.apps import App, AppItems
from wysebone import constants


class AppViewsSettingView(ChangeAppView):
    """Views tab settings class

    Version
    -------
    1.0.2

    Author
    ------
    Khoi Pham
    """

    def get(self, request, app_code):
        """Views tab settings
    
        Parameters
        ----------
        request: HttpRequest
        app_code: str

        Version
        -------
        1.0.0

        Author
        ------
        Khoi Pham
        """

        # Get application from app_code
        try:
            self.app = App.objects.get(code=app_code, type=constants.LIST_VIEW, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('List Table'), 'key': app_code})
            return HttpResponseRedirect('/list-table')

        # Render data from super class
        render_data = self.get_render()

        # Get table item
        render_data['tables'] = self.app.tables.all()

        # Get Item_type ID
        render_data['item_types'] = {
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
        }

        # Get Event ID
        render_data['events'] = {
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
        
        # Render http
        return render(request, 'wysebone/list_table/views_setting.html', render_data)