from django.shortcuts import render
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from wysebone.utils import get_next_url
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from wysebone import constants
from django.contrib.auth.decorators import permission_required, login_required


@login_required(login_url='/login')
@permission_required('wysebone.delete_user', raise_exception=True)
def deleteUser(request, uuid):
    """Delete user
    
    URL user/[user_uuid]/delete

    Parameters 
    ----------
    request: HttpRequest
        The Http request
    uuid User uuid

    Version
    -------
    1.0.1

    Author
    ------
    Khoi Pham
    Dong Nguyen
    """

    next = get_next_url(request, '/user')
    User = get_user_model()
    
    try:
        user = User.objects.get(user_id=uuid, company=request.user.company)
    except:
        messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('user').title(), 'key': uuid})
        return HttpResponseRedirect(next)
    
    if user == request.user:
        raise PermissionDenied
    
    if request.user.has_role(constants.CUSTOMER_ADMIN_ROLE):
        pass
    else:
        if request.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE):
            if user.has_role(constants.CUSTOMER_ADMIN_ROLE):
                raise PermissionDenied
        elif request.user.has_role(constants.CUSTOMER_OPERATION_ROLE):
            if user.has_role(constants.CUSTOMER_DEVELOPER_ROLE) or user.has_role(constants.CUSTOMER_ADMIN_ROLE) or user.has_role(constants.CUSTOMER_TESTER_ROLE):
                raise PermissionDenied

        # Get request from template
    if request.POST.get('post'):
        try:
            with transaction.atomic():

                # Clear avatar
                user.avatar.delete(save=True)

                # Delete users
                user.delete()
        except:
            transaction.rollback()
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return HttpResponseRedirect(next)

        # Print success message
        messages.success(request, _('The %(name)s \"%(obj)s\" was deleted successfully.') % { 'name': _('User'), 'obj': user.get_full_name()})
        return HttpResponseRedirect(next)

    if next == '/group/':
        active = 'group_active'
    else:
        active = 'user_active'

    return render(request, 'wysebone/delete_confirmation.html', {
        'name': _('User'),
        'obj': user.get_full_name(),
        'department_active': 'active',
        active: 'active',
    })