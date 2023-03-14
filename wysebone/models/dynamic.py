from django.db import models
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.postgres.fields import JSONField
from django.apps import apps
from wysebone import constants

def create_model(name, fields=None, app_label='', module='', options=None, admin_opts=None):
    """Create specified model
    
    Parameters
    ----------
    models: instance Model
    
    Returns
    -------
    Model

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    class Meta:
        # Using type('Meta', ...) gives a dictproxy error during model creation
        db_table = name

    if app_label:
        # app_label must be set using the Meta inner class
        setattr(Meta, 'app_label', app_label)

    # Update Meta with any options that were provided
    # if options is not None:
    #     for key, value in options.iteritems():
    #         setattr(Meta, key, value)

    # Set up a dictionary to simulate declarations within a class
    attrs = {'__module__': module, 'Meta': Meta}

    # Add in any fields that were provided
    if fields:
        attrs.update(fields)

    # Create the class, which automatically triggers ModelBase processing
    model = type(name, (models.Model,), attrs)

    return model


def create_table_data(table_name):
    """App model
    
    Parameters
    ----------
    models: instance Model
    
    Returns
    -------
    Model

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    try:
        model = apps.get_registered_model('wysebone', table_name)
        return model

    except LookupError:
        pass

    fields = {
        'id': models.AutoField(primary_key=True),
        'code': models.CharField(_("Table code"), max_length=10, null=False, unique=True),
        'json_data': JSONField(null=True),
        'order_number': models.FloatField(default=1, null=True,),
        'data_mode': models.SmallIntegerField(default=constants.SANDBOX, null=True, db_index=True),
        'created_at': models.DateTimeField(_("Creation date"), auto_now_add=True, null=True),
        'created_by': models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False),
        'updated_at': models.DateTimeField(_("Last modified"), auto_now=True),
        'updated_by': models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    }

    options = {
        'ordering': ['created_at'],
        'verbose_name': 'Table code',
    }

    app_data = create_model(table_name, fields, options=options,
                            admin_opts=None, app_label='wysebone')

    return app_data
