from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import re
from django.contrib.auth.models import Group
from wysebone.auths import get_company
from wysebone.exceptions import AppOverThreshold


def validate_phone(value):
    if (value is not None and bool(re.match('^[0-9]*$', value.replace(" ", "")))):
        if (len(re.sub("[^0-9]", "", value)) < 10):
            raise ValidationError([_("Phone number is at least 10 numbers")])  

        if (len(re.sub("[^0-9]", "", value)) > 20):
            raise ValidationError([_("Phone number is at most 20 numbers")])
    if (not re.match(r'^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*((x|ext|#)?(\d{1,4}))*$', value)):
        raise ValidationError([_("The phone is at least 10 number and contain only  +()-. and x#")])   
    

def validate_is_unique_group(value, pk=None):
    """Check group is unique in a company.

    Parameters
    ----------
    value: str
        The group name.
    pk: int
        Primary key of group

    Raises
    ------
    ValidationError
        If the group name already exists in the company.

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    if Group.objects.filter(name=value, is_admin=False, company=get_company()).exclude(pk=pk).exists():
        raise ValidationError([_("The group name has been created in the system. Please choose another name.")])
    
    
def app_over_threshold():
    """Check number of applications that have exceeded the threshold in the contract plan.

    Raises
    ------
    AppOverThreshold

    Version
    -------
    1.0.2

    Author
    ------
    Dong Nguyen
    """
    
    from wysebone.models.apps import App
    from wysebone import constants
    
    company=get_company()
    
    if company.contract_plan is not None:
        app_limit = company.contract_plan.app_limit
        if (app_limit != None):
            total_apps = App.objects.filter(company=company, delete_flag=constants.DELETE_FLAG_ENABLE, type__in=[constants.ENTRY_FORM, constants.MENU]).count()
            if (total_apps >= app_limit):
                raise AppOverThreshold(_('The number of apps over the limit allow.'))