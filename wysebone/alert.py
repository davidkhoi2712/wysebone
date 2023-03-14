from django.urls import reverse
from django.utils.text import format_lazy
from django.utils.functional import lazy
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from django.utils.html import escape
mark_safe_lazy = lazy(mark_safe, str)


def added_successfully(category, url_name, url_args, obj_name):
    """Added successfully messages
    
    Parameters
    ----------
    category: str
        The category name
    url_name: str
    url_args: list
        The args of url
    obj_name: str
        The name of object

    Returnes
    --------
    messages: str

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    edit_link = '<a href="%s">%s</a>' % (reverse(url_name, args=url_args), escape(obj_name))
    return mark_safe_lazy(format_lazy(_("The {name} \"{obj}\" was added successfully."), name=category, obj=edit_link))


def changed_successfully(category, url_name, url_args, obj_name):
    """Changed successfully messages
    
    Parameters
    ----------
    category: str
        The category name
    url_name: str
    url_args: list
        The args of url
    obj_name: str
        The name of object

    Returnes
    --------
    messages: str

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    edit_link = '<a href="%s">%s</a>' % (reverse(url_name, args=url_args), escape(obj_name))
    return mark_safe_lazy(_("The %(name)s \"%(obj)s\" was changed successfully.") % {'name': category, 'obj': edit_link})