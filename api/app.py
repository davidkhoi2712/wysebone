from rest_framework.response import Response
from rest_framework.views import status, APIView
from django.utils.translation import gettext_lazy as _
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.decorators import action
from django.http import JsonResponse
from wysebone.models.apps import App, AppItems
from wysebone.models.table_item import TableItem
from wysebone.models.item_type import ItemType
from wysebone.models.dynamic import create_table_data
from django.db import transaction
from django.contrib import messages
from rest_framework.parsers import JSONParser
from wysebone import constants, alert, validates, exceptions
from django.db.models.expressions import RawSQL
from wysebone.auths import get_logged_in_user
from wysebone.models.table_info import TableInfo
from jsonmerge import merge
from collections import defaultdict
from wysebone.forms.apps import AppAddForm
from itertools import chain

class AppView(APIView):
    
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]
    
    parser_classes = [JSONParser]
    
    def get(self, request, app_code):
        """
        API get app
        GET /api/app/<str:app_code>
        
        Parameters
        ----------
        request: HttpRequest
        app_code: str

        return: JsonResponse

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        """
        
        # Verify new or update app
        is_new_app = request.GET.get('is_new_app')
        
        app = None
        
        if is_new_app != '1':
            try:
                app = App.objects.get(code=app_code, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
            except:
                messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': app_code})
                
                return Response(
                    data={
                        "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': app_code}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
        itemTypes  = ItemType.objects.values()
        appItems = [] if app is None else app.items.all().values('id', 'table_item', 'code', 'name', 'attribute__id', 'index', 'item_json').order_by('item_json__top', 'item_json__left')
    
        eventList = {
            'initialEvent': {
                constants.RECORD_SEARCH: _('Record search'),
                constants.DISPLAY_CONTENT: _('Display record'),
                constants.ACTION_ON_OTHER_OBJECTS: _('Action on other objects'),
                constants.SET_OUTPUT: _('Set output'),
                constants.SUM: _('Sum')
            },
            'updateEvent': {
                constants.RECORD_REGISTER: _('Record register'),
                constants.DELETE_RECORD: _('Delete record'),
                constants.SCREEN_DISPLAY: _('Screen display'),
                constants.ACTION_ON_OTHER_OBJECTS: _('Action on other objects'),
            },
            'clickEvent': {
                constants.ACTION_ON_OTHER_OBJECTS: _('Action on other objects'),
                constants.SCREEN_TRANSITION: _('Screen transition'),
                constants.RESET: _('Reset'),
            },
        }

        # Get all app
        listApp = App.objects.filter(company=request.user.company, type__in=[constants.LIST_VIEW, constants.ENTRY_FORM], delete_flag=constants.DELETE_FLAG_ENABLE).order_by('name').values('code', 'name', 'type')

        # Get property from app
        try:
            property_app = app.setting_json['property']
        except:
            property_app = None

        listTable = TableInfo.objects.filter(company=request.user.company)
        appTables = [] if app is None else app.tables.all().order_by('pk').values('id', 'data_code', 'data_name')

        tableList = defaultdict(list)
        tableInfo = TableInfo.objects.filter(company=request.user.company)
        for table in tableInfo:
            tableList[table.pk] = {
                'id': table.pk,
                'data_code': table.data_code,
                'name': table.data_name,
                'items': table.fields.all().values('table_info__id', 'id', 'item_code', 'item_name', 'attribute__id', 'attribute__icon', 'item_json')
            }
            
        tableList['user'] = {
                                'name': _('Users'), 
                                'id': 'users', 
                                'items': [
                                    {'id':'user_id', 'item_name': _('Employee ID')},
                                    {'id':'full_name', 'item_name': _('Display Name')},
                                    {'id':'email', 'item_name': _('Email')}
                                ]
                            }

        return Response({
            'itemTypes': itemTypes,
            'appItems': appItems,
            'eventList': eventList,
            'tableList': tableList,
            'listApp': listApp,
            'appTables': appTables,
            'property': property_app,
        })

    def put(self, request, app_code):
        """
        API put app
        PUT /api/app/<str:app_code>
        
        Parameters
        ----------
        request: HttpRequest
        app_code: str

        return: JsonResponse

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        Khoi Pham
        """
        
        # Verify new or update app
        is_new_app = request.data['is_new_app']
        app = None
        
        if is_new_app != '1':
            try:
                app = App.objects.get(code=app_code, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
            except:
                messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': app_code})
                return Response(
                    data={
                        "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': app_code}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
        # Get app type
        app_type = constants.ENTRY_FORM
        if request.data['menu']:
            app_type = constants.MENU
            
        # Get selected table from form
        tables_selected = request.data['tables']
            
        # Validate
        post_value = {
            'name': request.data['app_name'],
            'icon': request.data['app_icon'],
            'color': request.data['app_color'],
            'type': app_type,
            'tables': tables_selected
        }
        form = AppAddForm(post_value, auto_id=False, instance=app)
        if form.is_valid() == False:
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.'),
                    'errors': form.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Create app
                if app is None:
                    validates.app_over_threshold()
                    
                    app = App.objects.create(
                        company=request.user.company,
                        name=request.data['app_name'],
                        icon=request.data['app_icon'],
                        color=request.data['app_color'],
                        type=app_type,
                    )
                else:
                    # Update property for app
                    app.name = request.data['app_name']
                    app.icon = request.data['app_icon']
                    app.color = request.data['app_color']
                    app.type = app_type

                # Setting property
                if len(request.data['property']) > 0:
                    app.setting_json = merge(app.setting_json, {'property': request.data['property']})
                else:
                    app.setting_json = merge(app.setting_json, {'property': []})
                    
                # Get table existing from DB
                tables_existing = app.tables.all()
                
                if tables_selected:
                    # Remove table existing
                    for table in tables_existing:
                        if str(table.data_code) in tables_selected:
                            continue
                        app.tables.remove(table)
                        
                    tables_existing = app.tables.all()

                    # Add new chosen tables
                    for table_code in tables_selected:
                        table = TableInfo.objects.get(data_code=table_code, company=request.user.company)
                        if table in tables_existing:
                            continue
                        app.tables.add(table)
                else:
                    # Empty all tables
                    app.tables.clear()
                
                # Save app
                app.save()
                
                # Get app items from database
                appItems = app.items.all()
                
                # New items from request
                items = request.data['items']
                if items:
                    # Remove app item
                    for item in appItems:
                        exiting_item = [item_put for item_put in items if item_put['code'] == item.code]
                        if len(exiting_item) > 0:
                            continue
                        item.delete()
                        
                    # Add or update app item
                    for item in items:
                        item_type = ItemType.objects.get(pk=int(item['attribute_id']))
                        
                        try:
                            appItem = AppItems.objects.get(code=item['code'])
                        except AppItems.DoesNotExist:
                            appItem = AppItems.objects.create(
                                company = request.user.company,
                                app = app,
                                name = item['name'],
                                attribute = item_type,
                            )
                            
                        appItem.name = item['name']
                    
                        # Text field
                        if item_type.pk == constants.TEXT:
                            appItem.item_json = self.text_json(item)
                            
                        if item_type.pk == constants.CHECKBOX:
                            appItem.item_json = self.checkbox_json(item)
                            
                        if item_type.pk == constants.NUMBER:
                            appItem.item_json = self.number_json(item)
                            
                        if item_type.pk == constants.SELECTION:
                            appItem.item_json = self.selection_json(item)
                            
                        if item_type.pk == constants.DATE:
                            appItem.item_json = self.date_json(item)

                        if item_type.pk == constants.LOOKUP:
                            appItem.item_json = self.lookup_json(item)    

                        if 'table_item_id' in item:
                            if item['table_item_id'] != '':
                                appItem.table_item = TableItem.objects.get(pk=int(item['table_item_id']), company=request.user.company)
                                appItem.table_info = appItem.table_item.table_info
                            else:
                                appItem.table_item = None
                                appItem.table_info = None

                        # Label field
                        if item_type.pk == constants.LABEL:
                            appItem.item_json = self.label_json(item)
                            
                        if item_type.pk == constants.BUTTON:
                            appItem.item_json = self.button_json(item)

                        if item_type.pk == constants.LIST_OBJECT:
                            appItem.item_json = self.list_object_json(item)

                        if item_type.pk == constants.IFRAME:
                            appItem.item_json = self.iframe_json(item)    
                                    
                        appItem.save()
                else:
                    appItems.delete()
        except exceptions.AppOverThreshold as mess:
            transaction.rollback()
            messages.error(request, str(mess))
            return Response(
                data={
                    "message": str(mess)
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as error:
            print(error)
            transaction.rollback()
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        messages.success(request, alert.changed_successfully(
            category=_('Application'),
            url_name='change.form.app',
            url_args=(app.code,),
            obj_name=app.name
        ))

        return Response({'received': items})
    
    def button_json(self, item):
        """Json for button field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'bg_color': item['bg_color'],
            'text_color': item['text_color'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }
    
    def date_json(self, item):
        """Json for date field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'hide_field_name': item['hide_field_name'],
            'required': item['required'],
            'default_value': item['default_value'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }
        
    
    def selection_json(self, item):
        """Json for Selection field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'hide_field_name': item['hide_field_name'],
            'required': item['required'],
            'options': item['options'],
            'default_value': item['default_value'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }
    
    
    def number_json(self, item):
        """Json for Numeric field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'auto_number': item['auto_number'],
            'hide_field_name': item['hide_field_name'],
            'thousands_separators': item['thousands_separators'],
            'required': item['required'],
            'min_value': eval(str(item['min_value'])) if item['min_value'] != '' else '',
            'max_value': eval(str(item['max_value'])) if item['max_value'] != '' else '',
            'default_value': eval(str(item['default_value'])) if item['default_value'] != '' else '',
            'decimal_places': eval(str(item['decimal_places'])) if item['decimal_places'] != '' else '',
            'unit_measure': item['unit_measure'],
            'unit_measure_position': item['unit_measure_position'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }
    
    
    def checkbox_json(self, item):
        """Json for Checkbox field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'hide_field_name': item['hide_field_name'],
            'default_value': item['default_value'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }
    
    
    def label_json(self, item):
        """Json for label field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'display': item['display'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }
    
    
    def text_json(self, item):
        """Json for text field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'hide_field_name': item['hide_field_name'],
            'required': item['required'],
            'min_length': eval(str(item['min_length'])) if item['min_length'] != '' else '',
            'max_length': eval(str(item['max_length'])) if item['max_length'] != '' else '',
            'default_value': item['default_value'],
            'number_lines': eval(str(item['number_lines'])) if item['number_lines'] != '' else '',
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events'],
        }

    def list_object_json(self, item):
        """Json for list_object field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events'],
        }

    def lookup_json(self, item):
        """Json for Lookup field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'hide_field_name': item['hide_field_name'],
            'required': item['required'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }   

    def iframe_json(self, item):
        """Json for iframe field"""
        
        return {
            'left': item['left'],
            'top': item['top'],
            'width': item['width'],
            'height': item['height'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events'],
        }     


class AppListUpdate(viewsets.ViewSet):
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]
    app_info = None
    
    def list(self, request):
        return Response(status=status.HTTP_200_OK)

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
        
        authority = self.app_info.app_authority_user.filter(user=request.user).values_list('authority')
        authority_group = self.app_info.app_authority_group.filter(group__in=request.user.groups.all()).values_list('authority')

        authority = list(chain(authority, authority_group))

        return authority    

    def retrieve(self, request, pk=None):
        """
        API get app
        GET /api/apps/(?P<pk>[^/.]+)
        
        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.0

        Author
        ------
        Sanh Nguyen
        """

        if pk is None:
            return Response({'header': [], 'list': []})

        try:
            self.app_info = App.objects.get(code=pk, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
        except:
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': pk}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        app_header = []
        data = []
        display_content = True

        try:
            # relationship = app_info.setting_json['relationship']['foreign_key']
            # relationship.append(app_info.setting_json['relationship']['primary_key'])
            # business_table = TableInfo.objects.filter(pk__in=relationship).values_list('id', 'business_table')
            # business_table = dict(business_table)
            business_table = []
            events = defaultdict(list)

            app_items = self.app_info.items.filter(index__isnull=False).order_by('index')

            # Get authority of app
            authority = self.get_authority(request)

            if not app_items:
                app_items = self.app_info.items.all().order_by('index')

            for item in app_items:
                if item.is_label_field or item.is_button_field:
                    continue

                item_type = item.item_json
                item_type['code'] = item.attribute.codename
                table_data = item.table_info.business_table if item.table_item else ''

                # Get authority of item
                authority_item = item.app_items_authority.values_list('item_mode', flat=True).filter(authority__in=authority).order_by('item_mode')
                item.authority = authority_item[0] if authority_item else constants.VIEW

                if item.authority is not constants.HIDDEN:
                    app_header.append({
                        "col": item.table_item.item_code if item.table_item else item.code,
                        "name": item.name,
                        "type": item_type,
                        "width": "200px",
                        'table': table_data,
                        'display': item.check_event_type(constants.DISPLAY_CONTENT) or item.authority is constants.VIEW
                    })

                if table_data and table_data not in business_table:
                    business_table.append(table_data)

                for input in item.item_json.get('inputs'):
                    if item.is_button_field == False:
                        events[input['code']].append({'code': item.code, 'type': item.attribute.pk, 'events': item.item_json.get('events'), 'outputs': item.item_json.get('outputs')})

            for event in self.app_info.setting_json['property']['events']:
                if event['type'] == 1:
                    for target in event['target']:
                        for action in target['action']:
                            if action['event'] == constants.RECORD_SEARCH:
                                display_content = False

            if not self.app_info.setting_json['property']['inputs'] and display_content:    

                data_mode = constants.PRODUCTION if request.user.is_general_role else constants.SANDBOX

                model_dynamic = create_table_data(business_table[0])
                data = model_dynamic.objects.filter(data_mode=data_mode).order_by('order_number').values('code', 'order_number', 'json_data')
                item_code = [item['code'] for item in data]

                for item in business_table[1:]:
                    model_dynamic = create_table_data(item)
                
                    app_data = model_dynamic.objects.filter(data_mode=data_mode, code__in=item_code).order_by('order_number').values_list('code', 'json_data')
                    app_data = dict(app_data)
                    
                    for key, item in enumerate(data):
                        if item['code'] in app_data:
                            data[key]['json_data'] = {**item['json_data'], **app_data[item['code']]}    
                                
        except Exception as error:
            print(error)
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'header': app_header, 'list': data, 'configs': self.app_info.setting_json, 'events': events,'is_updated': not self.app_info.setting_json['property']['inputs'] and display_content})


    @action(detail=True, methods=['post'])
    def create_row(self, request, pk=None):
        """
        API create record
        POST /api/apps/(?P<pk>[^/.]+)/create_row
        
        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.0

        Author
        ------
        Sanh Nguyen
        """

        try:
            app_info = App.objects.get(code=pk, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)

            data_mode = request.user.is_general_role if constants.PRODUCTION else constants.SANDBOX
            
            with transaction.atomic():
                order_number = ( request.data['order_number'] + request.data['order_number_after']) / 2
                
                for key in request.data['json_table']:
                    model_dynamic = create_table_data(key)
                    app_data = model_dynamic.objects.create(
                        data_mode = data_mode,
                        order_number=order_number,
                        code=request.data['code'],
                        created_by=get_logged_in_user(),
                        json_data=request.data['json_table'][key]
                    )

            return Response({"message": _("Created successfully.")})

        except App.DoesNotExist:
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': pk}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except:
            transaction.rollback()
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['put'])
    def update_setting(self, request, pk=None):

        """
        API update setting of app
        PUT /api/apps/(?P<pk>[^/.]+)/update_setting

        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.0

        Author
        ------
        Sanh Nguyen
        """

        try:
            app_info = App.objects.get(code=pk, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
            data_json = app_info.setting_json

            if data_json is None:
                data_json = {}

            app_info.setting_json = merge(app_info.setting_json, request.data)
            app_info.save()

        except:
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': pk}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({'status': status.HTTP_200_OK})

    def update(self, request, pk=None):
        """
        API update record of app
        PUT /api/apps/(?P<pk>[^/.]+)/

        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.0

        Author
        ------
        Sanh Nguyen
        """
        
        try:
            app_info = App.objects.get(code=pk, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
        except:
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': pk}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            model_dynamic = create_table_data(request.data['table'])
            with transaction.atomic():
                try:
                    items = model_dynamic.objects.get(code=request.data['code'])
                    items.json_data = {**items.json_data, **request.data['data']['json_data']}
                    items.updated_by = get_logged_in_user()
                    
                except model_dynamic.DoesNotExist:
                    data_mode = request.user.is_general_role if constants.PRODUCTION else constants.SANDBOX
                    items = model_dynamic(code=pk, order_number=request.data['data']['order_number'], json_data=request.data['data']['json_data'], created_by=get_logged_in_user(), data_mode=data_mode)
               
                items.save()

            return Response({"message": _("Updated successfully.")})

        except:
            transaction.rollback()
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['put'])
    def clear(self, request, pk=None):
        """
        API clear record of app
        PUT /api/apps/(?P<pk>[^/.]+)/clear

        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.0

        Author
        ------
        Sanh Nguyen
        """

        try:
            app_info = App.objects.get(code=pk, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)

            with transaction.atomic():
                for key in request.data['data']:
                    model_dynamic = create_table_data(key)
                    obj = model_dynamic.objects.get(code=request.data['code'])
                    obj.json_data = {**obj.json_data, **request.data['data'][key]}
                    obj.save()

            return Response({"message": _("Updated successfully.")})

        except App.DoesNotExist:
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': pk}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except:
            transaction.rollback()
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, pk=None):
        """
        API delete record of app
        DELETE /api/apps/(?P<pk>[^/.]+)/

        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.0

        Author
        ------
        Sanh Nguyen
        """

        try:
            app_info = App.objects.get(code=pk, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)

            with transaction.atomic():
                for item in request.data['table']:
                    model_dynamic = create_table_data(item)
                    try:
                        app_info = model_dynamic.objects.get(code=request.data['code'])
                        app_info.delete()
                    except model_dynamic.DoesNotExist:
                        pass

            return Response({"message": _("Deleted successfully.")})

        except App.DoesNotExist:
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': pk}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except:
            transaction.rollback()
            return Response (
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def search(self, request, pk=None):
        """
        API search record of app
        POST /api/apps/(?P<pk>[^/.]+)/search

        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.1

        Author
        ------
        Sanh Nguyen
        """        

        try:
            app_info = App.objects.get(code=pk, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
        except:
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': pk}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            table = {}
            display_content = False
            data = []

            for target in request.data['event']:
                if (target['object'] not in table):
                    table[target['object']] = TableInfo.objects.get(pk=target['object']).business_table

                _condition = {}

                for action in target['action']:
                    if action['event'] == constants.RECORD_SEARCH:
                        for condition in action['condition']:
                            table_item = TableItem.objects.get(pk=condition['condition_2'])
                            _condition["json_data__%s" % table_item.item_code] = request.data['input'][condition['condition_1']]
                            
                    if action['event'] == constants.DISPLAY_CONTENT:
                        model_dynamic = create_table_data(table[target['object']])
                        if not data:
                            data = model_dynamic.objects.filter(**_condition).order_by('order_number').values('code', 'order_number', 'json_data')
                        else:
                            app_data = model_dynamic.objects.filter(**_condition).order_by('order_number').values_list('code', 'json_data')
                            app_data = dict(app_data)
                    
                            for key, item in enumerate(data):
                                if item['code'] in app_data:
                                    data[key]['json_data'] = {**item['json_data'], **app_data[item['code']]}


            return Response({"list": data})

        except:
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['put'])
    def updateData(self, request, pk=None):
        """
        API update or instert record of app
        PUT /api/apps/(?P<pk>[^/.]+)/updateData

        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.1

        Author
        ------
        Sanh Nguyen
        """        

        try:
            app_info = App.objects.get(code=pk, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
        except:
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Application').title(), 'key': pk}
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        if len(request.data['list']) > 0:    
            try:
                table = {}

                with transaction.atomic():
                    for target in request.data['event']:
                        if (target['object'] not in table):
                            table[target['object']] = TableInfo.objects.get(pk=target['object'])

                        _condition = {}
                        _item_field = {}

                        for action in target['action']:
                            if action['event'] == constants.RECORD_REGISTER:
                                for condition in action['condition']:
                                    tableitem = TableItem.objects.get(pk=condition['condition_2'])
                                    _condition["json_data__%s" % tableitem.item_code] = request.data['input'][condition['condition_1']]
                                    _item_field[tableitem.item_code] = request.data['input'][condition['condition_1']]
                                    
                                model_dynamic = create_table_data(table[target['object']].business_table)
                                for item in request.data['list']:
                                    data = {'height': item['json_data']['height'], 'formula': item['json_data']['formula']}

                                    for table_item in table[target['object']].fields.all():
                                        if table_item.item_code in item['json_data']:
                                            data[table_item.item_code] = item['json_data'][table_item.item_code]

                                    try:
                                        _condition['code'] = item['code']
                                        app_info = model_dynamic.objects.get(**_condition)
                                        app_info.json_data = {**app_info.json_data, **data}
                                        app_info.updated_by = get_logged_in_user()
                                        
                                    except model_dynamic.DoesNotExist:
                                        data_mode = request.user.is_general_role if constants.PRODUCTION else constants.SANDBOX
                                        data = {**data, **_item_field}
                                        app_info = model_dynamic(code=item['code'], order_number=item['order_number'], json_data=data, created_by=get_logged_in_user(), data_mode=data_mode)
                                
                                    app_info.save()

            except Exception as error:
                print(error)
                transaction.rollback()
                return Response(
                    data={
                        "message": _('An error occurred while processing. Please try again later.')
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response({"message": _("Updated successfully.")})


    @action(detail=False, methods=['post'])
    def triggerEvent(self, request):
        """
        API triggerEvent record of app
        PUT /api/apps/(?P<pk>[^/.]+)/triggerEvent

        Parameters
        ----------
        request: HttpRequest
        pk: str

        return: JsonResponse

        Version
        -------
        1.0.1

        Author
        ------
        Sanh Nguyen
        """        

        data = {}
        table = {}

        for item in request.data['event']:
            for event in item['events']:
                if event['type'] == 1:
                    for target in event['target']:
                        if (target['object'].isdigit() and target['object'] not in table):
                            table_info = TableInfo.objects.get(pk=target['object'])
                            table[target['object']] = table_info.business_table
                            table_item = dict(table_info.fields.all().values_list('pk', 'item_code'))

                        _condition = {}

                        for action in target['action']:
                            if action['event'] == constants.RECORD_SEARCH:
                                for condition in action['condition']:
                                    _condition["json_data__%s" % table_item[int(condition['condition_2'])]] = request.data['input']
                                    
                            if action['event'] == constants.DISPLAY_CONTENT and item['type'] != constants.LOOKUP:
                                model_dynamic = create_table_data(table[target['object']])
                                result = model_dynamic.objects.filter(**_condition).first()
                                
                                for condition in action['condition']:
                                    item_code = table_item[int(condition['condition_1'])]
                                    data[item['code']] = (data[item['code']] + ' ' if item['code'] in data else '' ) + result.json_data[item_code] if result and item_code in result.json_data else ""

                            if action['event'] == constants.SET_OUTPUT:
                                try:
                                    model_dynamic = create_table_data(table[target['object']])
                                    result = model_dynamic.objects.get(**_condition)

                                    for condition in action['condition']:
                                        data[condition['condition_1']] = result.json_data[table_item[int(condition['condition_2'])]]

                                except:
                                    for output in item['outputs']:
                                        data[output['code']] = request.data['input']
        
        return Response({'data': data})
