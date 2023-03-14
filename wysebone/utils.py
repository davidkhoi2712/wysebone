from django.utils.translation import gettext_lazy as _
from strgen import StringGenerator
from django.utils.crypto import get_random_string
import string
from django.utils.http import is_safe_url

from django.utils import translation
from django.utils.translation import (
    LANGUAGE_SESSION_KEY, activate
)
from wysebone import constants


def random_string(size=10):
    """Generate random string
    
    Parameters
    ----------
    size: int
        Length of string

    Returns
    -------
    random_string: str

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    return get_random_string(length=size, allowed_chars=string.ascii_letters[26:] + string.digits)


def unique_string(instance, field_name='uuid', size=10):
    """Generate unique string
    
    Parameters
    ----------
    instance: model instance
    field_name: str
        The name of the field in the table
    size: int
        Length of string

    Returns
    -------
    random_string: str

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    random_string = get_random_string(length=size, allowed_chars=string.ascii_letters[26:] + string.digits)

    if instance.__class__._default_manager.filter(**{field_name: random_string}).exists():
        return unique_string(instance, field_name, size)

    return random_string

def get_countries():
    """Get list of countries

    Returns
    -------
    countries: array
        List of support coutries

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    return [
        ('', _('Please select')),
        ('JP', _('Japan')),
        ('VN', _('Vietnam')),
    ]


def get_item_mode():
    """Get list of item mode

    Returns
    -------
    item_mode: array

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    return [
        (constants.UPDATE, _('Update')),
        (constants.VIEW, _('View')),
        (constants.HIDDEN, _('Hidden')),
    ]


def get_next_url(request, default="/"):
    """Get next url

    Parameters
    ----------
    request: HttpRequest
    default: str

    Returns
    -------
    next: str

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    next = request.POST.get('next', request.GET.get('next'))
    if not is_safe_url(url=next, allowed_hosts=request.get_host()):
        next = default

    return next


def unique_string_dynamic(instance, field_name='uuid', size=10):
    """Generate unique string
    
    Parameters
    ----------
    instance: model instance
    field_name: str
        The name of the field in the table
    size: int
        Length of string

    Returns
    -------
    random_string: str

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    random_string = get_random_string(
        length=size, allowed_chars=string.ascii_letters[26:] + string.digits)

    if instance.objects.filter(**{field_name: random_string}).exists():
        return unique_string(instance, field_name, size)

    return random_string
