from django.shortcuts import render
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.decorators import permission_required, login_required
from wysebone.forms.table import TableForm, TextItem, NumericItem, DateItem, YesNoItem
from wysebone.models.table_info import TableInfo
from wysebone.models.table_item import TableItem
from wysebone.models.apps import App, AppItems
from wysebone.utils import unique_string, get_next_url
from wysebone.constants import TEXT, NUMBER, DATE, CHECKBOX
from django.db import transaction, IntegrityError
from django.contrib import messages
from django.http import HttpResponseRedirect
from wysebone.models.item_type import ItemType
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone import alert
from django.db import connection
from datetime import datetime as dt
from wysebone import dates
from wysebone import constants
from django.core.paginator import Paginator
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.views.pagination import Pagination


class ListTableView(PermissionRequiredMixin, View, Pagination):
    permission_required = 'wysebone.view_tableinfo'
    
    def get(self, request):
        """Reder New Authority form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        Khoi Pham
        Thanh Pham
        """
        
        table_name = request.GET.get('name','')
        
        if table_name:
            tables = TableInfo.objects.filter(company=request.user.company, data_name__icontains=table_name).order_by('-updated_at', 'pk')
            table_path = "/table/?name="+table_name+'&'
        else:
            tables = TableInfo.objects.filter(company=request.user.company).order_by('-updated_at', 'pk')
            table_path = "/table/?"
        
        # Get per page from url
        self.get_per_page(request)
    
        # Get paginator from authorities and per_page
        paginator = Paginator(tables, self.per_page)
        
        # Get page number
        self.get_page_number(request, paginator)
        
        # If need redirect to new uri
        if self.is_redirect:
            return HttpResponseRedirect(self.get_redirect_url(table_path))
        
        return render(request, 'wysebone/table/index.html', {
            'table_active': 'active',
            'objects': paginator.get_page(self.page_number),
            'table_name': table_name,
            'object_path': table_path,
            'object_target': 'table',
            'next': request.get_full_path(),
            'object_per_page': self.per_page
        })

@login_required(login_url='/login')
@permission_required('wysebone.change_tableinfo', raise_exception=True)
def change(request, data_code):

    next = get_next_url(request, '/table')
    
    try:
        # Get table
        table_info = TableInfo.objects.get(data_code=data_code, company=request.user.company)
    except:
        messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('table').title(), 'key': data_code})
        return HttpResponseRedirect(next)

    items = []

    if request.method == "POST":
        form = TableForm(request.POST, instance = table_info)

        # validate each item
        item_valid = True
        post_items = format_items_data(request.POST)

        for key in post_items:
            item = TextItem(post_items[key], prefix=key)
            if int(post_items[key][key+'-item_type']) == TEXT:
                item = TextItem(post_items[key], prefix=key)
            elif int(post_items[key][key+'-item_type']) == NUMBER:
                item = NumericItem(post_items[key], prefix=key)
            elif int(post_items[key][key+'-item_type']) == DATE:
                item = DateItem(post_items[key], prefix=key)
                if post_items[key][key+'-default_value']:
                    choice_date=dt.replace(dates.locale_to_db(post_items[key][key+'-default_value']),tzinfo=None)
                    min_date=dt.strptime("01/01/1900", "%m/%d/%Y")
                    max_date=dt.strptime("12/31/2100", "%m/%d/%Y")
                    if choice_date<min_date or choice_date>max_date:
                        item.add_error('default_value', _('Please input date from 01/01/1900 to 12/31/2100'))
            elif int(post_items[key][key+'-item_type']) == CHECKBOX:
                item = YesNoItem(post_items[key], prefix=key)

            if not item.is_valid():
                item_valid = False

            #check duplicate name
            for key2 in post_items:

                # itself
                if key == key2:
                    continue

                # empty string
                if post_items[key][key+'-item_name'] == '':
                    continue

                if post_items[key][key+'-item_name'] == post_items[key2][key2+'-item_name']:
                    item.add_error('item_name', _('Duplicate item name'))
                    item_valid = False

            items.append(item)

        #save data
        if item_valid and form.is_valid():
            
            try:
                with transaction.atomic():
                    table_info.data_name = form.cleaned_data.get('data_name')
                    table_info.save()
                    
                    # delete items
                    remain_item_ids = []
                    table_item_ids = []
                    item_delete_ids = []
                    for key in post_items:
                        if key.startswith('item_update_'):
                            remain_item_ids.append(int(key.split('-')[0].replace('item_update_', '')))
                    
                    tableItem=TableItem.objects.filter(table_info=table_info).values('id')
                    for key in tableItem:
                        table_item_ids.append(key['id'])
                    item_delete_ids = list(set(table_item_ids) - set(remain_item_ids))

                    if item_delete_ids:
                        for id in item_delete_ids:
                            tableItemInfo=TableItem.objects.get(id=id)
                            appItems=AppItems.objects.filter(table_info=table_info, table_item=tableItemInfo).exclude(delete_flag__in=[constants.DELETE_FLAG_DISABLE])
                            if appItems:
                                messages.error(request, _('Items is being using. Please try again later.'))
                                return HttpResponseRedirect(next)

                    TableItem.objects.filter(table_info=table_info).exclude(id__in=remain_item_ids).delete()
                    
                    # save items
                    for key in post_items:

                        # update item
                        if key.startswith('item_update_'):
                            item_id = int(key.split('-')[0].replace('item_update_', ''))
                            table_item = TableItem.objects.get(pk=item_id)
                        else: # new item
                            # common data item
                            table_item = TableItem(
                                company = request.user.company,
                                table_info = table_info,
                            )
                            table_item.item_code = unique_string(table_item, field_name='item_code')

                        try:
                            item_type = ItemType.objects.get(pk=int(post_items[key][key+'-item_type']))
                        except:
                            transaction.rollback()
                            messages.error(request, _('An error occurred while processing. Please try again later.'))
                            return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

                        table_item.item_name = post_items[key][key+'-item_name']
                        table_item.attribute = item_type

                        # data for each item type
                        if table_item.attribute.pk == TEXT:
                            table_item.item_json = {
                                'required': True if key+'-required' in post_items[key] and post_items[key][key+'-required'] == 'on' else False,
                                'default_value': post_items[key][key+'-default_value'],
                                'field_size': eval(post_items[key][key+'-field_size'])
                            }
                        elif table_item.attribute.pk == NUMBER:
                            table_item.item_json = {
                                'required': True if key+'-required' in post_items[key] and post_items[key][key+'-required'] == 'on' else False,
                                'default_value': post_items[key][key+'-default_value'],
                                'number_of_digits': eval(post_items[key][key+'-number_of_digits']),
                                'decimal_digits': eval(post_items[key][key+'-decimal_digits']),
                                'auto_number': True if key+'-auto_number' in post_items[key] and post_items[key][key+'-auto_number'] == 'on' else False,
                            }
                        elif table_item.attribute.pk == DATE:
                            table_item.item_json = {
                                'required': True if key+'-required' in post_items[key] and post_items[key][key+'-required'] == 'on' else False,
                                'default_value': post_items[key][key+'-default_value']
                            }
                        elif table_item.attribute.pk == CHECKBOX:
                            table_item.item_json = {
                                'default_value': True if key+'-default_value' in post_items[key] and post_items[key][key+'-default_value'] == 'on' else False
                            }
                        else:
                            pass

                        table_item.save()

                    # Print success message
                    messages.success(request, alert.changed_successfully(
                        category=_('table'),
                        url_name='change.table',
                        url_args=(table_info.data_code,),
                        obj_name=table_info.data_name
                    ))
                    
                    return HttpResponseRedirect(next)
            except:
                transaction.rollback()
                messages.error(request, _('An error occurred while processing. Please try again later.'))
                return render_add_table_form(request, form, items, next, _('Change %s') % _('table'))
        else:
            # Print error message
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = TableForm(initial = {'data_name': table_info.data_name})
        items = get_items_by_table(table_info)
        
    return render_add_table_form(request, form, items, next, _('Change %s') % _('table'))


@login_required(login_url='/login')
@permission_required('wysebone.add_tableinfo', raise_exception=True)
def add(request):
    next = get_next_url(request, '/table')

    items = []
    if request.method == "POST":
        form = TableForm(request.POST)

        # validate each item
        item_valid = True
        post_items = format_items_data(request.POST)
        for key in post_items:
            item = TextItem(post_items[key], prefix=key)
            if int(post_items[key][key+'-item_type']) == TEXT:
                item = TextItem(post_items[key], prefix=key)
                field_size = eval(str(post_items[key][key+'-field_size'])) if post_items[key][key+'-field_size'] != '' else 0
                default_value=post_items[key][key+'-default_value']
                if len(default_value) > field_size:
                    item.add_error('default_value', _('The length of characters over the limit allow'))
            elif int(post_items[key][key+'-item_type']) == NUMBER:
                item = NumericItem(post_items[key], prefix=key)
            elif int(post_items[key][key+'-item_type']) == DATE:
                item = DateItem(post_items[key], prefix=key)
                if post_items[key][key+'-default_value']:        
                    choice_date=dt.replace(dates.locale_to_db(post_items[key][key+'-default_value']),tzinfo=None)
                    min_date=dt.strptime("01/01/1900", "%m/%d/%Y")
                    max_date=dt.strptime("12/31/2100", "%m/%d/%Y")
                    if choice_date<min_date or choice_date>max_date:
                        item.add_error('default_value', _('Please input date from 01/01/1900 to 12/31/2100'))
            elif int(post_items[key][key+'-item_type']) == CHECKBOX:
                item = YesNoItem(post_items[key], prefix=key)
            
            if not item.is_valid():
                item_valid = False

            #check duplicate name
            for key2 in post_items:

                # itself
                if key == key2:
                    continue

                # empty string
                if post_items[key][key+'-item_name'] == '':
                    continue

                if post_items[key][key+'-item_name'] == post_items[key2][key2+'-item_name']:
                    item.add_error('item_name', _('Duplicate item name'))
                    item_valid = False

            items.append(item)

        #save data
        if item_valid and form.is_valid():
            try:
                with transaction.atomic():
                    # save table info
                    table_info = TableInfo.objects.create(
                        data_name = request.POST.get('data_name'),
                        company = request.user.company,
                    )
                    table_info.business_table ='data_' + table_info.data_code
                    table_info.save()
                    
                    # Generate table data
                    generate_table(table_info.data_code)
                    
                
                    # save items
                    for key in post_items:
                        item_type = ItemType.objects.get(pk=int(post_items[key][key+'-item_type']))

                        # common data item
                        table_item = TableItem.objects.create(
                            company = request.user.company,
                            table_info = table_info,
                            item_name = post_items[key][key+'-item_name'],
                            attribute = item_type,
                        )

                        # data for each item type
                        if table_item.attribute.pk == TEXT:
                            table_item.item_json = {
                                'required': True if key+'-required' in post_items[key] and post_items[key][key+'-required'] == 'on' else False,
                                'default_value': post_items[key][key+'-default_value'],
                                'field_size': eval(post_items[key][key+'-field_size'])
                            }
                        elif table_item.attribute.pk == NUMBER:
                            table_item.item_json = {
                                'required': True if key+'-required' in post_items[key] and post_items[key][key+'-required'] == 'on' else False,
                                'default_value': post_items[key][key+'-default_value'],
                                'number_of_digits': eval(post_items[key][key+'-number_of_digits']),
                                'decimal_digits': eval(post_items[key][key+'-decimal_digits']),
                                'auto_number': True if key+'-auto_number' in post_items[key] and post_items[key][key+'-auto_number'] == 'on' else False,
                            }
                        elif table_item.attribute.pk == DATE:
                            table_item.item_json = {
                                'required': True if key+'-required' in post_items[key] and post_items[key][key+'-required'] == 'on' else False,
                                'default_value': post_items[key][key+'-default_value']
                            }
                        elif table_item.attribute.pk == CHECKBOX:
                            table_item.item_json = {
                                'default_value': True if key+'-default_value' in post_items[key] and post_items[key][key+'-default_value'] == 'on' else False
                            }
                        else:
                            pass
                    
                        table_item.save()
                
                    # print success message
                    messages.success(request, alert.added_successfully(
                        category=_('table'),
                        url_name='change.table',
                        url_args=(table_info.data_code,),
                        obj_name=table_info.data_name
                    ))
                
                    return HttpResponseRedirect(next)
            except:
                transaction.rollback()
                messages.error(request, _('An error occurred while processing. Please try again later.'))
                return render_add_table_form(request, form, items, next, _('Add %s') % _('table'))
        else:
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = TableForm()
        items.append(TextItem(
            initial = {
                'item_name': '',
                'required': False,
                'field_size': 256,
                'default_value': '',
                'item_type': TEXT
            },
            prefix = "item_new_01"
        ))
        
    return render_add_table_form(request, form, items, next, _('Add %s') % _('table'))
    
    
def render_add_table_form(request, form, items, next, title):
    """Post new group form
    
    Parameters
    ----------
    request: HttpRequest
    form: wysebone.forms.table.TableForm
    items: list
    next: str
    title: str
    
    Returns
    -------
    django.shortcuts.render

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """
        
    return render(request, 'wysebone/table/add.html', {
        'form': form,
        'items': items,
        'the_title': title,
        'table_active': 'active',
        'next_uri': next,
        'js_item_text': TextItem(
            initial = {
                'item_name': '',
                'required': False,
                'field_size': 256,
                'default_value': '',
                'item_type': TEXT
            },
        ),
        'js_item_numeric': NumericItem(
            initial = {
                'item_type': NUMBER,
                'number_of_digits': 38,
                'decimal_digits': 38
            },
        ),
        'js_item_date': DateItem(
            initial = {
                'item_type': DATE
            },
        ),
        'js_item_yes_no': YesNoItem(
            initial = {
                'item_type': CHECKBOX
            },
        ),
    })
    
    
def generate_table(table_code):
    """Change group form
    
    Parameters
    ----------
    table_code: str

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """
        
    table_name = 'data_%s' % table_code
    
    with connection.cursor() as cursor:
        cursor.execute('CREATE TABLE "%s" ("id" serial NOT NULL PRIMARY KEY, "code" varchar(10) NOT NULL UNIQUE, "json_data" jsonb NULL, "order_number" double precision NULL, data_mode smallint DEFAULT 0, "created_at" timestamp with time zone NULL, "updated_at" timestamp with time zone NOT NULL, "created_by_id" integer NULL, "updated_by_id" integer NULL);' % table_name)
        cursor.execute('ALTER TABLE "%s" ADD CONSTRAINT "%s_created_by_id_%s_fk_auth_user_id" FOREIGN KEY ("created_by_id") REFERENCES "auth_user" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;' % (table_name, table_name, table_code))
        cursor.execute('ALTER TABLE "%s" ADD CONSTRAINT "%s_updated_by_id_%s_fk_auth_user_id" FOREIGN KEY ("updated_by_id") REFERENCES "auth_user" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;' % (table_name, table_name, table_code))
        cursor.execute('CREATE INDEX "%s_code_%s_like" ON "%s" ("code" varchar_pattern_ops);' % (table_name, table_code, table_name))
        cursor.execute('CREATE INDEX "%s_data_mode_%s" ON "%s" ("data_mode");' % (table_name, table_code, table_name))
        cursor.execute('CREATE INDEX "%s_created_by_id_%s" ON "%s" ("created_by_id");' % (table_name, table_code, table_name))
        cursor.execute('CREATE INDEX "%s_updated_by_id_%s" ON "%s" ("updated_by_id");' % (table_name, table_code, table_name))
    
    
class DeleteTableView(PermissionRequiredMixin, View):
    permission_required = 'wysebone.delete_tableinfo'

    def get(self, request, data_code):
        """Change group form
    
        Parameters
        ----------
        request: HttpRequest
        data_code: str
            The data_code of tableinfo

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        next = get_next_url(request, '/table')

        try:
            # Get table
            table_info = TableInfo.objects.get(data_code=data_code, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('table').title(), 'key': data_code})
            return HttpResponseRedirect(next)
            
        return render(request, 'wysebone/delete_confirmation.html', {
            'name': _('table'),
            'obj': table_info.data_name,
            'table_active': 'active',
        })

    def post(self, request, data_code):
        """Post delete table
    
        Parameters
        ----------
        request: HttpRequest
        data_code: str
            The data_code of tableinfo

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        next = get_next_url(request, '/table')

        # Get table from date_code
        try:
            # Get table
            table_info = TableInfo.objects.get(data_code=data_code, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('table').title(), 'key': data_code})
            return HttpResponseRedirect(next)

        #Get app relate
        app_info = App.objects.filter(tables=table_info).exclude(delete_flag__in=[constants.DELETE_FLAG_DISABLE])
        if app_info:
            messages.error(request, _('This table is being using. Please try again later.'))
            return HttpResponseRedirect(next)

        try:
            with transaction.atomic():
                # Delete table
                table_info.delete()
                
                # Drop table
                if table_info.business_table in connection.introspection.table_names():
                    with connection.cursor() as cursor:
                        cursor.execute('DROP TABLE "%s";' % table_info.business_table)

                # Display success message
                messages.success(request, _("The %(name)s \"%(obj)s\" was deleted successfully.") % {'name': _('table'), 'obj': table_info.data_name})
                return HttpResponseRedirect(next)
        except:
            transaction.rollback()
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return render(request, 'wysebone/delete_confirmation.html', {
                'name': _('table'),
                'obj': table_info.data_name,
                'table_active': 'active',
            })


"""format item data.

    Parameters
    ----------
    value: post_data
        post data

    Version
    -------
    1.0.0

    Author
    ------
    Bui Huu Phuc
    """
def format_items_data(post_data):
    ret = {}
    for key, value in post_data.items():
        if not key.startswith('item'):
            continue

        arr_key = key.split('-')

        if arr_key[0] in ret.keys():
            ret[arr_key[0]].update({key: value})
        else:
            ret.update({arr_key[0]: {key: value}})

    return ret

"""get items by table.

    Parameters
    ----------
    value: table_info
        table_info query set

    Version
    -------
    1.0.0

    Author
    ------
    Bui Huu Phuc
    """
def get_items_by_table(table_info):
    table_items = TableItem.objects.filter(table_info=table_info)
    items = []
    if table_items:
        for item in table_items:
            prefix = 'item_update_' + str(item.id)
            if item.attribute.id == TEXT:
                items.append(TextItem(
                    initial={
                        'item_name': item.item_name,
                        'required': item.item_json['required'],
                        'default_value': item.item_json['default_value'],
                        'item_type': TEXT,
                        'field_size': item.item_json['field_size']
                    }, 
                    prefix=prefix
                ))
            elif item.attribute.id == NUMBER:
                items.append(NumericItem(
                    initial={
                        'item_name': item.item_name,
                        'required': item.item_json['required'],
                        'default_value': item.item_json['default_value'],
                        'item_type': NUMBER,
                        'number_of_digits': item.item_json['number_of_digits'],
                        'decimal_digits': item.item_json['decimal_digits'],
                        'auto_number': item.item_json['auto_number']
                    }, 
                    prefix=prefix
                ))
            elif item.attribute.id == DATE:
                items.append(DateItem(
                    initial={
                        'item_name': item.item_name,
                        'required': item.item_json['required'],
                        'default_value': item.item_json['default_value'],
                        'item_type': DATE
                    }, 
                    prefix=prefix
                ))
            elif item.attribute.id == CHECKBOX:
                items.append(YesNoItem(
                    initial={
                        'item_name': item.item_name,
                        'item_type': CHECKBOX,
                        'default_value': item.item_json['default_value'],
                    }, 
                    prefix=prefix
                ))
    return items
