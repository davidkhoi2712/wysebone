from django.shortcuts import render
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from django.utils.translation import gettext_lazy as _
from wysebone.models.apps import App
from wysebone.models.table_info import TableInfo
from wysebone.models.table_item import TableItem
from django.http import HttpResponseNotFound, HttpResponseRedirect, JsonResponse
from django.contrib import messages
from django.db.models.expressions import RawSQL
from wysebone.forms.dynamic import DjangoForm
from wysebone.models.dynamic import create_table_data
from django import forms
from django.db import transaction
from wysebone import constants, dates
from django.urls import reverse
from django.db.models import Max
from wysebone.utils import unique_string_dynamic, get_next_url
from wysebone.auths import get_logged_in_user
from django.utils.text import format_lazy
from collections import defaultdict
import ast
from django.core.exceptions import PermissionDenied

class ViewAppView(PermissionRequiredMixin, View):
    permission_required = 'wysebone.use_app'
    
    app = None
    next_url = None

    def get(self, request, app_code):
        """Get app from app_code
    
        Parameters
        ----------
        request: HttpRequest
        app_code: str

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        self.next_url = get_next_url(request, '/app')

        # Get application from app_code
        try:
            self.app = App.objects.get(code=app_code, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': app_code})
            return HttpResponseRedirect(self.next_url)
        
        # Get all the items of app
        app_items = self.app.items.all().order_by('item_json__top', 'item_json__left')
        
        # Get authority of app
        authority = self.get_authority(request)

        if not authority:
            raise PermissionDenied

        # Create dynamic form
        form = DjangoForm(auto_id=False)
        tabindex = 1
        for item in app_items:
            # Get authority of item
            authority_item = item.app_items_authority.values_list('item_mode', flat=True).filter(authority__in=authority).order_by('item_mode')
            item.authority = authority_item[0] if authority_item else constants.VIEW
            
            if item.is_label_field or item.is_button_field or item.is_list_object_field:
                continue
            
            default_value = item.item_json.get('default_value')
            if item.is_number_field and item.item_json.get('auto_number'):
                model_tablePrimary = create_table_data(item.table_info.business_table)
                max_number = model_tablePrimary.objects.aggregate(_max=Max(RawSQL("json_data->>%s", (item.table_item.item_code,))))
                default_value = int(max_number['_max']) + 1 if max_number['_max'] else 1

            # Add item into field
            form.fields[item.code] = item.get_field(tabindex)
            form.initial[item.code] = default_value
            tabindex += 1
                
        return self.render(request, form, app_items)
        

    def post(self, request, app_code):
        """Get app from app_code
    
        Parameters
        ----------
        request: HttpRequest
        app_code: str

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        self.next_url = get_next_url(request, '/app')
        
        try:
            self.app = App.objects.get(code=app_code, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': app_code})
            return HttpResponseNotFound(self.next_url)
        
        # Get all the items of app
        app_items = self.app.items.all().order_by('item_json__top', 'item_json__left')

        # Get authority of app
        authority = self.get_authority(request)
        
        # Setup form
        form = DjangoForm(request.POST, auto_id=False)
        tabindex = 1
        for item in app_items:
            # Get authority of item
            authority_item = item.app_items_authority.values_list('item_mode', flat=True).filter(authority__in=authority).order_by('item_mode')
            item.authority = authority_item[0] if authority_item else constants.VIEW
            
            if item.is_label_field or item.is_button_field or item.is_list_object_field:
                continue
           
            default_value = item.item_json.get('default_value')
            if item.is_number_field and item.item_json.get('auto_number'):
                model_tablePrimary = create_table_data(item.table_info.business_table)
                max_number = model_tablePrimary.objects.aggregate(_max=Max(RawSQL("json_data->>%s", (item.code,))))
                default_value = int(max_number['_max']) + 1 if max_number['_max'] else 1

            # Add item into field
            form.fields[item.code] = item.get_field(tabindex)
            form.initial[item.code] = default_value
            tabindex += 1
        
        if form.is_valid() == False:
            return JsonResponse({'status': 400 , 'errors': form.errors})
        
        try:
            with transaction.atomic():
                
                data_mode = constants.PRODUCTION if request.user.is_general_role else constants.SANDBOX
                table_data = defaultdict(list)
                code = 0
                max_order = {'_max': 0}
                btn_events = ast.literal_eval(request.POST.get('btn_events'))

                for item in app_items:
                    # Get authority of item
                    item.authority = item.app_items_authority.values_list('item_mode', flat=True).filter(authority__in=authority).order_by('item_mode')[0] if authority else constants.UPDATE
            
                    if item.is_label_field or item.is_button_field or item.is_list_object_field or item.authority is not constants.UPDATE:
                        continue

                    try:
                        table_info = item.table_info

                        if table_info.business_table not in table_data:
                            table_data[table_info.business_table] = {}
                            
                        table_data[table_info.business_table][item.code] = item
                    except:
                        pass
                
                for event in btn_events:
                    if event['type'] == 2:
                        for target in event['target']:
                            _condition = {}

                            for action in target['action']:
                                if action['event'] == constants.RECORD_REGISTER:
                                    business_table = TableInfo.objects.get(pk=target['object']).business_table
                                    model_dynamic = create_table_data(business_table)
                                    json_data = {"height": 'auto', "formula": {}}

                                    if business_table in table_data:
                                        for key, item in table_data[business_table].items():
                                            json_data[item.table_item.item_code] = request.POST.get(item.code)

                                    if not code:
                                        code = unique_string_dynamic(model_dynamic, field_name='code')

                                    if not max_order['_max']:
                                        max_order = model_dynamic.objects.aggregate(_max=Max('order_number'))

                                    if action['condition']:
                                        for condition in action['condition']:
                                            table_item = TableItem.objects.get(pk=condition['condition_2'])
                                            json_data[table_item.item_code] = request.POST.get(condition['condition_1'])
                                    
                                    try:
                                        app_data = model_dynamic.objects.get(code=code)
                                        app_data.json_data = {**app_data.json_data, **json_data}
                                        app_data.updated_by = get_logged_in_user()
                                    except model_dynamic.DoesNotExist:
                                        app_data = model_dynamic.objects.create(
                                            data_mode=data_mode,
                                            order_number=max_order['_max'] + 1 if max_order['_max'] else 1,
                                            code=code,
                                            created_by=get_logged_in_user(),
                                            json_data=json_data
                                        )

                                    app_data.save()        
                                        
                messages.success(request, format_lazy(_("The {name} \"{obj}\" was added successfully."), name=_('Application').title(), obj=self.app.name))

                return JsonResponse({'status': 200 , 'app_code': self.app.code})

        except Exception as error:
            print(error)
            transaction.rollback()
            return JsonResponse({'status': 500 , 'message': _('An error occurred while processing. Please try again later.')})
        

    def render(self, request, form, app_items):
        """Render new group form
    
        Parameters
        ----------
        request: HttpRequest
        form: Entryform
        app_items: query_set app_items model

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        height = 0
        min_left = 99999999
        min_top = 99999999
        list_object = False
        event = defaultdict(list)
        _top = 0
        
        for item in app_items:
            top  = item.item_json.get('top')
            left = item.item_json.get('left')
            
            height = max(height, top)
            min_top = min(min_top, top)    
            min_left = min(min_left, left)
                
        
        for item in app_items:
            item.left = item.item_json.get('left') - min_left
            if item.left < 3:
                item.left = 0
            
            if item.authority is constants.HIDDEN:
                _top = _top + item.item_json['height'] + 30 if 'height' in item.item_json else 100
                
            item.top = item.item_json.get('top') - min_top - _top
            if item.top < 3:
                item.top = 0

            # hide_field_name
            hide_field_name = item.item_json.get('hide_field_name')
            if hide_field_name is None:
                hide_field_name = True
            item.is_view_label = hide_field_name == False
            
            if item.is_button_field:
                item.button_type = 'button'
                if item.item_json.get('process') == 'submit':
                    item.button_type = 'submit'

            if item.is_list_object_field:
                list_object = True
            
            if item.is_label_field or item.is_button_field:
                continue

            for input in item.item_json.get('inputs'):
                event[input['code']].append({'code': item.code, 'type': item.attribute.pk, 'events': item.item_json.get('events'), 'outputs': item.item_json.get('outputs')})

        return render(request, 'wysebone/app/view.html', {
            'app': self.app,
            'app_items': app_items,
            'items_form': form,
            'height_form': height + 10,
            'app_active': 'active',
            'app_current': self.app.code,
            'next_url': self.next_url,
            'list_object': list_object,
            'event': dict(event)
        })

    def get_authority(self, request):
        """Get authority of app
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.2

        Author
        ------
        Sanh Nguyen
        """
        
        authority = self.app.app_authority_user.filter(user=request.user).distinct('authority').values_list('authority', flat=True)
        authority_group = self.app.app_authority_group.filter(group__in=request.user.groups.all()).distinct('authority').values_list('authority', flat=True)
        return [*authority, *authority_group]