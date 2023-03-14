from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from wysebone.models.companies import Company
from wysebone.models.users import User
from wysebone.utils import unique_string
from wysebone.auths import get_logged_in_user
from django.contrib.postgres.fields import JSONField
from wysebone.models.authority import Authority
from django.contrib.auth.models import Group
from wysebone.models.table_item import TableItem
from wysebone.models.table_info import TableInfo
from wysebone.models.item_type import ItemType
from wysebone import constants
from django import forms
from wysebone.models.table_info import TableInfo
from django.utils.safestring import mark_safe
from django.db.models.functions import Concat
from django.db.models import Value
from wysebone.models.dynamic import create_table_data


def app_directory_path(instance, filename):
    """File will be uploaded to MEDIA_ROOT/uploads/apps/<app_id>/<filename>
    
    Parameters
    ----------
    instance: instance Model
    filename: str
        The name of upload file

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    return 'apps/app_{0}/{1}'.format(instance.id, filename)


class App(models.Model):
    """App model
    
    Parameters
    ----------
    models: instance Model

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    id          = models.BigAutoField(primary_key=True)
    company     = models.ForeignKey(Company, on_delete=models.CASCADE, null=False, blank=True, editable=False, related_name='apps')
    code        = models.CharField(_("Application code"), max_length=10, null=False, unique=True)
    name        = models.CharField(_("Application name"), max_length=100, null=False)
    status      = models.PositiveIntegerField(_('Status'), default=constants.APP_PROCESSING, null=True)
    icon        = models.CharField(_("Icon"), null=True, blank=True, max_length=60, default='fa fa-list-alt')
    color       = models.CharField(_("Color"), null=True, blank=True, max_length=10, default='#b97a56')
    type        = models.PositiveIntegerField(_('Type'), default=constants.ENTRY_FORM, null=True)
    delete_flag = models.PositiveIntegerField(_('Delete Flag'), default=0, null=True)
    setting_json = JSONField(null=True)
    created_at  = models.DateTimeField(_("Creation date"), auto_now_add=True, null=True)
    created_by  = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at  = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by  = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    deleted_at   = models.DateTimeField(null=True)
    deleted_by  = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    tables = models.ManyToManyField(
        TableInfo,
        verbose_name=_('tables'),
        blank=True,
    )

    class Meta:
        db_table = "app_info"
        permissions = [
            ('approve_app', 'Approve app'),
            ("use_app", "Use app"),
            ("add_list_table", "Add list table"),
            ("change_list_table", "Change list table"),
            ("delete_list_table", "Delete list table"),
            ("view_list_table", "View list table"),
        ]

    def save(self, *args, **kwargs):
        """Extend model save function,
        Add CODE when insert new app

        Parameters
        ----------
        args: *args
        kwargs: kwargs

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        if not self.pk:
            self.code = unique_string(self, field_name='code')
            self.created_by = get_logged_in_user()
        else:
            self.updated_by = get_logged_in_user()

        super().save(*args, **kwargs)


class AppAuthorityGroup(models.Model):
    """App authority model, Relationship between app, authority and group.
    
    Parameters
    ----------
    models: instance Model

    Version
    -------
    1.0.1

    Author
    ------
    Dong Nguyen
    Khoi Pham
    """

    app = models.ForeignKey(App, on_delete=models.CASCADE, related_name='app_authority_group')
    authority = models.ForeignKey(Authority, on_delete=models.PROTECT)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='app_authority')
    created_at = models.DateTimeField(_("Creation date"), auto_now_add=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)

    class Meta:
        db_table = "app_authority_group"

    def save(self, *args, **kwargs):
        """Extend model save function

        Parameters
        ----------
        args: *args
        kwargs: kwargs

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        if not self.pk:
            self.created_by = get_logged_in_user()
        else:
            self.updated_by = get_logged_in_user()

        super().save(*args, **kwargs)

class AppAuthorityUser(models.Model):
    """App authority model, Relationship between app, authority, user
    
    Parameters
    ----------
    models: instance Model

    Version
    -------
    1.0.1

    Author
    ------
    Khoi Pham
    """

    app = models.ForeignKey(App, on_delete=models.CASCADE, related_name='app_authority_user')
    authority = models.ForeignKey(Authority, on_delete=models.PROTECT)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='app_authority')
    created_at = models.DateTimeField(_("Creation date"), auto_now_add=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)

    class Meta:
        db_table = "app_authority_user"

    def save(self, *args, **kwargs):
        """Extend model save function

        Parameters
        ----------
        args: *args
        kwargs: kwargs

        Version
        -------
        1.0.1

        Author
        ------
        Khoi Pham
        """

        if not self.pk:
            self.created_by = get_logged_in_user()
        else:
            self.updated_by = get_logged_in_user()

        super().save(*args, **kwargs)


class AppItems(models.Model):
    """App item model
    
    Parameters
    ----------
    models: instance Model

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    id          = models.BigAutoField(primary_key=True)
    company     = models.ForeignKey(Company, on_delete=models.CASCADE, null=False, blank=True, editable=False)
    app         = models.ForeignKey(App, on_delete=models.CASCADE, null=False, blank=True, editable=False, related_name='items')
    table_item  = models.ForeignKey(TableItem, on_delete=models.SET_NULL, null=True, blank=True, editable=False)
    table_info  = models.ForeignKey(TableInfo, on_delete=models.SET_NULL, null=True, blank=True, editable=False)
    code        = models.CharField(_("Item Code"), max_length=10, null=False, unique=True)
    name        = models.CharField(_("Item Name"), max_length=150, null=False)
    attribute   = models.ForeignKey(ItemType, on_delete=models.DO_NOTHING, null=True, blank=True, editable=False)
    index       = models.IntegerField(_("Index Item"), null=True, db_index=True)
    item_json   = JSONField(null=True)
    delete_flag = models.PositiveIntegerField(_('Delete Flag'), default=0, null=False)
    created_at  = models.DateTimeField(_("Creation date"), auto_now_add=True)
    created_by  = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at  = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by  = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    deleted_at  = models.DateTimeField(null=True)
    deleted_by  = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)

    class Meta:
        db_table = "app_items"

    def save(self, *args, **kwargs):
        """Extend model save function,
        Add CODE when insert new item

        Parameters
        ----------
        args: *args
        kwargs: kwargs

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        if not self.pk:
            self.code = unique_string(self, field_name='code')
            self.created_by = get_logged_in_user()
        else:
            self.updated_by = get_logged_in_user()

        super().save(*args, **kwargs)
        
    @property
    def is_label_field(self):
        return self.attribute.pk == constants.LABEL
        
    @property
    def is_checkbox_field(self):
        return self.attribute.pk == constants.CHECKBOX
    
    @property
    def is_button_field(self):
        return self.attribute.pk == constants.BUTTON

    @property
    def is_number_field(self):
        return self.attribute.pk == constants.NUMBER

    @property
    def is_list_object_field(self):
        return self.attribute.pk == constants.LIST_OBJECT
    
    @property
    def unit_measure(self):
        unit = self.item_json.get('unit_measure')
        if unit is None:
            unit = ''
        return unit
    
    @property
    def has_prefix(self):
        return self.item_json.get('unit_measure_position') == constants.PREFIX_POSITION
        
    @property
    def has_suffix(self):
        return self.item_json.get('unit_measure_position') == constants.SUFFIX_POSITION

    def check_event_type(self, event=constants.RECORD_REGISTER):
        check = False
        for item in self.item_json.get('events'):
            for target in item.get('target'):
                    for action in target.get('action'):
                        if action['event'] == event:
                            check = True
                            break
                
        
        return check                

    def get_field(self, tabindex):
        """General field for item
        
        Returns
        -------
        Field

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        required = self.item_json.get('required')
        if required is None:
            required = False
            
        # Date field
        if self.attribute.pk == constants.DATE:
            return forms.DateField(
                label = self.name,
                widget = forms.DateInput(
                    attrs={
                        'class': 'form-control User-datepicker',
                        'name': self.code,
                        'id': self.item_json['field_code'],
                        'autocomplete': 'off',
                        'tabindex': tabindex,
                        'readonly': self.check_event_type(constants.DISPLAY_CONTENT),
                        'disabled': self.authority == constants.VIEW
                    },
                ),
                required = required,
            )
            
        # Selection field
        if self.attribute.pk == constants.SELECTION:
            choices = [('', _('Please select'))]
            options = self.item_json.get('options')
            for option in options:
                choices.append((option, option))
            
            return forms.ChoiceField(
                label = self.name,
                widget = forms.Select(
                    attrs={
                        'class': 'form-control',
                        'name': self.code,
                        'id': self.item_json['field_code'],
                        'tabindex': tabindex,
                        'readonly': self.check_event_type(constants.DISPLAY_CONTENT),
                        'disabled': self.authority == constants.VIEW
                    },
                ),
                choices = choices,
                required = required,
                error_messages = {'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
            )
            
        # Yes/No field
        if self.attribute.pk == constants.CHECKBOX:
            return forms.BooleanField(
                label = self.name,
                widget = forms.CheckboxInput(
                    attrs={
                        'class': 'custom-control-input',
                        'name': self.code,
                        'id': self.item_json['field_code'],
                        'tabindex': tabindex,
                        'readonly': self.check_event_type(constants.DISPLAY_CONTENT),
                        'disabled': self.authority == constants.VIEW
                    },
                ),
                required = required,
            )
            
        # Numeric field
        if self.attribute.pk == constants.NUMBER:
            attrs = {
                'class': 'form-control',
                'name': self.code,
                'id': self.item_json['field_code'],
                'tabindex': tabindex,
                'readonly': self.check_event_type(constants.DISPLAY_CONTENT),
                'disabled': self.authority == constants.VIEW
            }

            if self.item_json.get('auto_number'):
                attrs['readonly'] = 'readonly'

            return forms.DecimalField(
                label = self.name,
                widget = forms.TextInput(
                    attrs=attrs,
                ),
                required = required,
                decimal_places = None if self.item_json.get('decimal_places') == '' else eval(str(self.item_json.get('decimal_places'))),
                min_value = None if self.item_json.get('min_value') == '' else eval(str(self.item_json.get('min_value'))),
                max_value = None if self.item_json.get('max_value') == '' else eval(str(self.item_json.get('max_value'))),
            )
        
        # Text field
        if self.attribute.pk == constants.TEXT:
            number_lines = eval(str(self.item_json.get('number_lines')))
            widget = None
            if number_lines == 1:
                widget = forms.TextInput(
                    attrs={
                        'class': 'form-control',
                        'name': self.code,
                        'id': self.item_json['field_code'],
                        'tabindex': tabindex,
                        'readonly': self.check_event_type(constants.DISPLAY_CONTENT),
                        'disabled': self.authority == constants.VIEW
                    }
                )
            else:
                widget = forms.Textarea(
                    attrs={
                        'class': 'form-control',
                        'name': self.code,
                        'id': self.item_json['field_code'],
                        'rows': number_lines,
                        'tabindex': tabindex,
                        'readonly': self.check_event_type(constants.DISPLAY_CONTENT),
                        'disabled': self.authority == constants.VIEW
                    }
                )
                
            return forms.CharField(
                label=self.name,
                widget=widget,
                required=required,
                min_length=eval(str(self.item_json.get('min_length'))) if self.item_json.get('min_length') != '' else None,
                max_length=eval(str(self.item_json.get('max_length'))) if self.item_json.get('max_length') != '' else None,
            )

        # Lookup field
        if self.attribute.pk == constants.LOOKUP:
            choices = [('', _('Please select'))]
            events = self.item_json.get('events')
            current_user = get_logged_in_user()
            
            try:
                for event in events:
                    if event['type'] == 1:
                        for target in event['target']:
                            if (target['object'] == 'user'):
                                users = User.objects.filter(company=current_user.company, roles=constants.CUSTOMER_GENERAL_ROLE).annotate(full_name=Concat('first_name', Value(' '), 'last_name')).order_by('full_name').values('user_id', 'email', 'full_name')
                                for action in target['action']:
                                    if action['event'] == constants.DISPLAY_CONTENT:
                                        for item in users:
                                            _condition = None

                                            for condition in action['condition']:
                                                _condition = (_condition + ' ' if _condition else '') + item[condition['condition_1']]

                                            choices.append((item[action['value']], _condition))

                            else:
                                table = TableInfo.objects.get(pk=target['object'])
                                table_item = dict(table.fields.all().values_list('pk', 'item_code'))
                                
                                for action in target['action']:
                                    if action['event'] == constants.DISPLAY_CONTENT:
                                        model_dynamic = create_table_data(table.business_table)
                                        result = model_dynamic.objects.all()
                                        
                                        for item in result:
                                            _condition = None

                                            for condition in action['condition']:
                                                item_code = table_item[int(condition['condition_1'])]
                                                
                                                if item_code in item.json_data and item.json_data[item_code].strip():
                                                    _condition = (_condition + ' ' if _condition else '') + item.json_data[item_code]

                                            item_code = table_item[int(action['value'])]
                                            if item_code in item.json_data and item.json_data[item_code].strip():
                                                choices.append((item.json_data[item_code], _condition))
                                        
            except:
                pass

            return forms.ChoiceField(
                label = self.name,
                widget = forms.Select(
                    attrs={
                        'class': 'form-control',
                        'name': self.code,
                        'id': self.item_json['field_code'],
                        'tabindex': tabindex,
                        'disabled': self.authority == constants.VIEW
                    },
                ),
                choices = choices,
                required = required,
                error_messages = {'invalid_choice':_("Select a valid choice. That choice is not one of the available choices.")},
            )    
            
        
class ItemAuthority(models.Model):
    """Item authority model, Relationship between item, authority, item mode
    
    Parameters
    ----------
    models: instance Model

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    item = models.ForeignKey(AppItems, on_delete=models.CASCADE, related_name='app_items_authority')
    authority = models.ForeignKey(Authority, on_delete=models.CASCADE)
    item_mode = models.PositiveSmallIntegerField(_("Item mode"), null=True)
    created_at = models.DateTimeField(_("Creation date"), auto_now_add=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)

    class Meta:
        db_table = "app_items_authority"

    def save(self, *args, **kwargs):
        """Extend model save function

        Parameters
        ----------
        args: *args
        kwargs: kwargs

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        if not self.pk:
            self.created_by = get_logged_in_user()
        else:
            self.updated_by = get_logged_in_user()

        super().save(*args, **kwargs)