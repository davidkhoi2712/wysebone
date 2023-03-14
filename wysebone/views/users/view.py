from django.shortcuts import render
from django.utils.translation import gettext_lazy as _
from wysebone.utils import get_next_url
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import permission_required, login_required


@login_required(login_url='/login')
@permission_required('wysebone.view_user', raise_exception=True)
def viewUser(request, uuid):
    """
    View user profile

    @since 1.0.0
    @version 1.0.0
    @author Sanh Nguyen
    """
    
    next = get_next_url(request, '/user')
    User = get_user_model()

    try:
        user = User.objects.get(user_id=uuid, company=request.user.company)
    except:
        messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('user').title(), 'key': uuid})
        return HttpResponseRedirect(next)

    # Render template
    return render(request, 'wysebone/user/view.html', {
        'user': user,
        'user_active': 'active',
    })