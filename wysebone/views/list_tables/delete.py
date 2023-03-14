from django.shortcuts import render
from django.contrib.auth.decorators import login_required, permission_required
from django.http import HttpResponseRedirect
from django.utils.translation import gettext_lazy as _
from django.utils.translation import (
    LANGUAGE_SESSION_KEY, check_for_language, activate
)
from wysebone.models.apps import App
from django.contrib import messages
from wysebone import constants
import datetime

@login_required(login_url='/login')
@permission_required('wysebone.delete_list_table', raise_exception=True)
def DeleteAppView(request, app_code):
    """
    Delete app

    @since 1.0.0
    @version 1.0.0
    @author Sanh Nguyen
    @author Khoi Pham
    """
    try:
        app_info = App.objects.get(code=app_code, company_id=request.user.company)
    except:
        messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('List Table'), 'key': app_code})
        return HttpResponseRedirect('/list-table')

    if request.POST.get('post'):
        app_info.delete_flag = constants.DELETE_FLAG_DISABLE
        app_info.deleted_at  = datetime.datetime.now()
        app_info.deleted_by  = request.user
        app_info.save()
        messages.success(request, _("The %(name)s \"%(obj)s\" was deleted successfully.") % {'name': _('List Table'), 'obj': app_info.name})

        return HttpResponseRedirect('/list-table')
        
    return render(request, 'wysebone/delete_confirmation.html', {
        'list_active': True,
        'name': _("List Table"),
        'obj': app_info.name
    })
