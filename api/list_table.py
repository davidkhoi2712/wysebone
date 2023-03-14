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
from django.db import transaction
from django.contrib import messages
from rest_framework.parsers import JSONParser
from wysebone import constants, alert
import datetime
from jsonmerge import merge
from wysebone.models.table_info import TableInfo
from wysebone.forms.apps import AppAddForm


class ListTableView(APIView):
    
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]
    
    parser_classes = [JSONParser]
    
    def get(self, request, app_code):
        """
        API get list table
        GET /api/list-table/<str:app_code>
        
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
        Khoi Pham
        Dong Nguyen
        """
        
        # Verify new or update app
        is_new_app = request.GET.get('is_new_app')
        app = None
        
        if is_new_app != '1':
            try:
                app = App.objects.get(code=app_code, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
            except:
                messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('List Table'), 'key': app_code})
                
                return Response(
                    data={
                        "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('List Table'), 'key': app_code}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
        itemTypes  = ItemType.objects.values()
        # tableItems = TableItem.objects.filter(table_info__in=app.tables.all()).order_by('id').values('id', 'item_code', 'item_name', 'attribute', 'item_json', 'table_info__id')
        appItems   = [] if app is None else app.items.all().order_by('index').values('id', 'table_item', 'code', 'name', 'attribute__id', 'index', 'item_json')
        
        # Get list item get output for list table
        listOutput = list()
        listItem = AppItems.objects.filter(attribute=constants.LIST_OBJECT, company=request.user.company)
        for item in listItem:
            for event in item.item_json['events']:
                if event['type'] == 1:
                    for target in event['target']:
                        if target['object'] == app_code:
                            for items in item.item_json['outputs']:
                                listOutput.append(items)
        # Get event list
        eventList = {
            'initialEvent': {
                constants.RECORD_SEARCH: _('Record search'),
                constants.DISPLAY_CONTENT: _('Display record'),
                constants.ACTION_ON_OTHER_OBJECTS: _('Action on other objects'),
                constants.SET_OUTPUT: _('Set output'),
                constants.SUM: _('Sum'),
                constants.MULTIPLICATION: _('Multiplication')
            },
            'updateEvent': {
                constants.RECORD_REGISTER: _('Record register'),
                constants.DELETE_RECORD: _('Delete record'),
                constants.SCREEN_TRANSITION: _('Screen transition'),
                constants.ACTION_ON_OTHER_OBJECTS: _('Action on other objects'),
            },
        }

        # Get property from app
        try:
            property_app = app.setting_json['property']
        except:
            property_app = None
            
        # Get tables of app
        appTables = [] if app is None else app.tables.all().order_by('pk').values('id', 'data_code', 'data_name')
        
        tableList = dict()
        tableInfo = TableInfo.objects.filter(company=request.user.company)
        for table in tableInfo:
            tableList[table.pk] = {
                'id': table.pk,
                'data_code': table.data_code,
                'name': table.data_name,
                'items': table.fields.all().values('table_info__id', 'id', 'item_code', 'item_name', 'attribute__id', 'attribute__icon', 'item_json')
            }

        # Respone json
        return Response({
            'itemTypes': itemTypes,
            'appItems': appItems,
            'appTables': appTables,
            'eventList': eventList,
            'tableList': tableList,
            'input': listOutput,
            'property': property_app
        })
        

    def put(self, request, app_code):
        """
        API put app
        PUT /api/list-table/<str:app_code>
        
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
        Khoi Pham
        Dong Nguyen
        """
        
        # Verify new or update app
        is_new_app = request.data['is_new_app']
        app = None
        
        if is_new_app != '1':
            try:
                app = App.objects.get(code=app_code, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
            except:
                messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('List Table'), 'key': app_code})
                return Response(
                    data={
                        "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('List Table'), 'key': app_code}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
                
        # Get selected table from form
        tables_selected = request.data['tables']
        
        # Validate
        post_value = {
            'name': request.data['app_name'],
            'icon': request.data['app_icon'],
            'color': request.data['app_color'],
            'type': constants.LIST_VIEW,
            'tables': tables_selected
        }
        form = AppAddForm(post_value, auto_id=False, instance=app)
        form.fields['tables'].required = True
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
                if app is None:
                    app = App.objects.create(
                        company=request.user.company,
                        name=request.data['app_name'],
                        icon=request.data['app_icon'],
                        color=request.data['app_color'],
                        type=constants.LIST_VIEW,
                    )
                else:
                    # Update property for app
                    app.name = request.data['app_name']
                    app.icon = request.data['app_icon']
                    app.color = request.data['app_color']
                    
                # Setting overview
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
                        appItem.index = item['index']
                    
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
                                
                        appItem.save()
                else:
                    appItems.delete()
        except:
            transaction.rollback()
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get message success
        messages.success(request, alert.changed_successfully(
            category=_('List Table'),
            url_name='change.views.list_table',
            url_args=(app.code,),
            obj_name=app.name
        ))

        # Respone json
        return Response({'received': items})
    
    def date_json(self, item):
        """Json for date field"""
        
        return {
            'required': item['required'],
            'default_value': item['default_value'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }
    
    def selection_json(self, item):
        """Json for Numeric field"""
        
        return {
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
            'auto_number': item['auto_number'],
            'thousands_separators': item['thousands_separators'],
            'required': item['required'],
            'min_value': item['min_value'],
            'max_value': item['max_value'],
            'default_value': item['default_value'],
            'decimal_places': item['decimal_places'],
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
            'default_value': item['default_value'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }
    
    def text_json(self, item):
        """Json for text field"""
        
        return {
            'required': item['required'],
            'min_length': item['min_length'],
            'max_length': item['max_length'],
            'default_value': item['default_value'],
            'number_lines': item['number_lines'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events'],
        }
    
    def lookup_json(self, item):
        """Json for Lookup field"""
        
        return {
            'required': item['required'],
            'field_code': item['field_code'],
            'inputs': item['inputs'],
            'outputs': item['outputs'],
            'events': item['events']
        }    
