from django.shortcuts import render
from django.contrib.auth.decorators import permission_required, login_required
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Group


@login_required(login_url='/login')
@permission_required('auth.view_group', raise_exception=True)
def ListGroupView(request):
    """Change group form
    
    Parameters
    ----------
    request: HttpRequest
        The Http request

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    Thanh Pham
    """

    group_name = request.GET.get('name','')
        
    if group_name:
        groups = Group.objects.filter(company=request.user.company, name__icontains=group_name, is_admin=False).order_by('name')
        group_path = "/group/?name="+group_name+'&'
    else:
        groups = Group.objects.filter(company=request.user.company, is_admin=False).order_by('name')
        group_path = "/group/?"
    
    return render(request, 'wysebone/groups/index.html', {
        'the_title': _('groups').title(),
        'objects': groups,
        'group_name': group_name,
        'object_path': group_path,
        'object_target': 'group',
        'group_active': 'active'
    })
