from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator
from wysebone.forms.permission import PermissionForm
from wysebone.models.authority import Authority
from wysebone.models.companies import Company
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.decorators import permission_required, login_required
from django.db import transaction, IntegrityError, models
import datetime
from wysebone import alert
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.views.pagination import Pagination

class ListAuthorityView(PermissionRequiredMixin, View, Pagination):
    permission_required = 'wysebone.view_authority'
    
    def get(self, request):
        """Reder New Authority form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.1

        Author
        ------
        Sanh Nguyen
        Khoi Pham
        Thanh Pham
        """
        
        authority_name = request.GET.get('name','')
        
        if authority_name:
            authorities = Authority.objects.filter(company=request.user.company, name__icontains=authority_name).order_by('-updated_at', 'pk')
            authority_path = "/permission/?name="+authority_name+'&'
        else:
            authorities = Authority.objects.filter(company=request.user.company).order_by('-updated_at', 'pk')
            authority_path = "/permission/?"
        
        # Get per page from url
        self.get_per_page(request)
    
        # Get paginator from authorities and per_page
        paginator = Paginator(authorities, self.per_page)
        
        # Get page number
        self.get_page_number(request, paginator)
        
        # If need redirect to new uri
        if self.is_redirect:
            return HttpResponseRedirect(self.get_redirect_url(authority_path))
        
        return render(request, 'wysebone/permission/index.html', {
            'authority_active': True,
            'objects': paginator.get_page(self.page_number),
            'authority_name': authority_name,
            'object_path': authority_path,
            'object_target': 'permission',
            'object_per_page': self.per_page
        })

@login_required(login_url='/login')
@permission_required('wysebone.add_authority', raise_exception=True)
def add(request):
    """Add permission form
    
    Parameters
    ----------
    request: HttpRequest
        The Http request

    Version
    -------
    1.0.0

    Author
    ------
    Thanh Pham
    """

    # Create form
    form = PermissionForm()

    # POST data
    if request.method == "POST":

        # Get data from form
        form = PermissionForm(request.POST)
        name = request.POST.get('name')
        
        # Validate data form
        if form.is_valid():

            #  Create new permission
            permission = Authority(name=name, company=request.user.company)
            
            try:
                # Commit permission
                permission.save()
            except IntegrityError:
                transaction.rollback()
                messages.error(request, _('An error occurred while processing. Please try again later.'))
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

            # Print success message
            messages.success(request, alert.added_successfully(
                category=_('permission'),
                url_name='edit.authority',
                url_args=(permission.code,),
                obj_name=permission.name
            ))

            return HttpResponseRedirect('/permission')
        else:
            # Print error message
            messages.error(request, _('Please correct the errors below.'))   
    
    # Render template
    return render(request, 'wysebone/permission/add.html', {
        'form': form,
        'authority_active': 'active',
        'the_title': _('Add %s') % _('permission'),
    })


@login_required(login_url='/login')
@permission_required('wysebone.change_authority', raise_exception=True)
def edit(request, code):
    """Edit permission
    
    URL permission/[code]/edit

    Parameters code Permission code
    ----------
    request: HttpRequest
        The Http request

    Version
    -------
    1.0.0

    Author
    ------
    Thanh Pham
    Khoi Pham
    """

    # Get permission
    try:
        permission = Authority.objects.get(company=request.user.company, code=code)
    except Authority.DoesNotExist:
        messages.error(request, _('Permission with code: %s does not exist.') % code)
        return HttpResponseRedirect('/permission')

    # create form
    form = PermissionForm(initial={
        'name': permission.name
    }, instance=permission)

    # POST data
    if request.method == "POST":
        # Get data from form
        form = PermissionForm(request.POST, instance=permission)
        name = request.POST.get('name')

        # Validate data form
        if form.is_valid():
            permission.name=name

            try:
                # Commit permission
                permission.save()
            except IntegrityError:
                transaction.rollback()
                messages.error(request, _('An error occurred while processing. Please try again later.'))
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

            # Print success message
            messages.success(request, alert.changed_successfully(
                category=_('permission'),
                url_name='edit.authority',
                url_args=(permission.code,),
                obj_name=permission.name
            ))
            return HttpResponseRedirect('/permission')

        else:
            # Print error message
            messages.error(request, _('Please correct the errors below.'))

    # Render template
    return render(request,
    'wysebone/permission/edit.html',
    {
        'form': form,
        'authority_active': 'active',
        'the_title': _('Change %s') % _('permission'),
    })

@login_required(login_url='/login')
@permission_required('wysebone.delete_authority', raise_exception=True)
def delete(request, code):
    """Delete permission
    
    URL permission/[code]/delete

    Parameters
    ----------
    request: HttpRequest
        The Http request
    code: Permission code

    Version
    -------
    1.0.1

    Author
    ------
    Thanh Pham
    Dong Nguyen
    """

    try:
        # Get permission
        permission = Authority.objects.get(company=request.user.company, code=code)
    except Authority.DoesNotExist:
        messages.error(request, _('Permission with code: %s does not exist.') % code)
        return HttpResponseRedirect('/permission')

    if request.method == "POST":
        try:
            permission.delete()
        except models.ProtectedError:
            messages.error(request, _('Failed to delete because the "%s" permission is being associated with an application.') % permission.name)
            return HttpResponseRedirect('/permission')
        except IntegrityError:
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return HttpResponseRedirect('/permission')

        # Print success message
        messages.success(request, _("The %(name)s \"%(obj)s\" was deleted successfully.") % {'name': _('permission'), 'obj': permission.name})
        return HttpResponseRedirect('/permission')
        
    return render(request, 'wysebone/delete_confirmation.html', {
        'name': _('permission'),
        'obj': permission.name,
        'authority_active': 'active'
    })