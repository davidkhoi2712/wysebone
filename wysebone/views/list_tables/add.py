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
    permission_required = 'wysebone.add_list_table'

    def get(self, request):
        """New App form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        form = AppAddForm(auto_id=False)
        
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
        
        return render(request, 'wysebone/list_table/views_setting.html', {
            'the_title': _('Add %s') % _('List Table'),
            'list_active': 'active',
            'app': None,
            'tables': None,
            'item_types': item_types,
            'events': events,
        })

    def post(self, request):
        """Post New App form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.1

        Author
        ------
        Dong Nguyen
        Khoi Pham
        """

        post_value = request.POST.copy()
        post_value['type'] = constants.LIST_VIEW
        form = AppAddForm(post_value, auto_id=False)
        form.fields['tables'].required = True
        
        if form.is_valid() == False:
            messages.error(request, _('Please correct the errors below.'))
            return self.render(request, form)
    
        try:
            with transaction.atomic():
                app = App.objects.create(
                    company=request.user.company,
                    name=request.POST.get('name'),
                    icon=request.POST.get('icon'),
                    color=request.POST.get('color'),
                    type=constants.LIST_VIEW,
                )
                
                # Get tables list
                tables = request.POST.getlist('tables')
                for table_code in tables:
                    table = TableInfo.objects.get(data_code=table_code, company=request.user.company)
                    app.tables.add(table)
                    
                app.save()

                return HttpResponseRedirect(reverse('change.views.list_table', args=[app.code]))
        except:
            transaction.rollback()
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return self.render(request, form)

    def render(self, request, form):
        """Reder New App form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        return render(request, 'wysebone/list_table/add.html', {
            'form': form,
            'tables': TableInfo.objects.filter(company=request.user.company),
            'the_title': _('Add %s') % _('List Table'),
            'list_active': 'active',
        })