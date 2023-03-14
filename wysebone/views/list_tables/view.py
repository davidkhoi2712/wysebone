from django.shortcuts import render
from django.utils.translation import gettext_lazy as _
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required, permission_required
from django.core import serializers
from wysebone import constants
from django.contrib import messages
from wysebone.models.apps import App

@login_required(login_url='/login')
@permission_required('wysebone.use_app', raise_exception=True)
def ViewAppView(request, app_code):

    try:
        app_info = App.objects.get(code=app_code, company_id=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE)
    except:
        messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('List Table'), 'key': app_code})
        return HttpResponseRedirect('/list-table')

    return render(request, 'wysebone/list_table/view.html', {
        'list_active': False if request.user.is_general_role else True,
        'app_current': app_code,
        'app': app_info,
        'apps': App.objects.filter(company=request.user.company).order_by('-created_at', 'pk'),
    })
