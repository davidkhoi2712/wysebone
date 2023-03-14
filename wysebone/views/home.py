from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from wysebone import constants

@login_required(login_url='/login')
def IndexView(request):
    """Navigation page
    
    Parameters
    ----------
    request: HttpRequest

    Version
    -------
    1.0.2

    Author
    ------
    Dong Nguyen
    """
        
    if request.user.is_staff:
        return HttpResponseRedirect('/admin')
    
    if request.user.has_role(constants.CUSTOMER_ADMIN_ROLE):
        return HttpResponseRedirect('/company-info')

    if request.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE):
        return HttpResponseRedirect('/user')
    
    if request.user.has_role(constants.CUSTOMER_OPERATION_ROLE):
        return HttpResponseRedirect('/user')

    return HttpResponseRedirect('/applications')
