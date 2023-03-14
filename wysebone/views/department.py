from django.shortcuts import render
from django.urls import reverse
from wysebone.forms.department import DepartmentForm, ChangMemberForm
from wysebone.models.department import Department
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect, HttpResponse
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.decorators import permission_required, login_required
from django.db import transaction, IntegrityError
import datetime
from django.core.paginator import Paginator



@login_required(login_url='/login')
@permission_required('wysebone.view_department', raise_exception=True)
def index(request, page_number):
    """Management department
    
    Parameters
    ----------
    request: HttpRequest
        The Http request

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """

    User = get_user_model()

    # Get all department
    departments = Department.objects.filter(company=request.user.company).order_by('id')

    # Get all node child department
    child = Department.objects.filter(company=request.user.company, parent_id__isnull=False)

    # Handling to get list node parent
    list_parent = []
    for item in child:
        if item.parent_id not in list_parent:
            list_parent.append(item.parent_id)

    # Get all list user of Company
    all_users = User.objects.filter(company=request.user.company).order_by('-created_at')
    paginator = Paginator(all_users, 15) # Show 15 app per page
    users = paginator.get_page(page_number)

    # Render template
    return render(request, 'wysebone/department/index.html', {
        'departments': departments,
        'list_parent': list_parent,
        'users': users,
        'department_active': 'active',
        'add_user_title': _('Add %s') % _('User'),
        'add_department_title': _('Add %s') % _('Department'),
    })


@login_required(login_url='/login')
@permission_required('wysebone.add_department', raise_exception=True)
def add(request):
    """Add department form
    
    Parameters
    ----------
    request: HttpRequest
        The Http request

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """

    popup = None
    if request.GET.get('popup'):
        popup = 'wysebone/modal.html'

    # Create form
    form = DepartmentForm()

    # Get parent node
    department = None
    node = request.GET.get('node', None)
    if node != None:
        try:
            department = Department.objects.get(uuid=node)
        except Department.DoesNotExist:
            return HttpResponseRedirect('/department')

    # Get parent department
    list_parent = Department.objects.filter(company=request.user.company)

    # POST data
    if request.method == "POST":

        # Get data from form
        form = DepartmentForm(request.POST)
        name = request.POST.get('name')
        parent = request.POST.get('parent')

        # Check parent department
        if parent == '':
            parent = None
        else:
            parent = Department.objects.get(company=request.user.company, uuid=parent)
        description = request.POST.get('description')

        # Validate data form
        if form.is_valid():

            #  Create new Department
            try:
                department = Department.objects.create(
                    name=name,
                    description=description,
                    parent=parent,
                    company=request.user.company,
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now(),
                    created_by=request.user
                )
            except:
                messages.error(request, _('Create department failed.'))
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
            
            try:
                # Commit department
                department.save()
            except IntegrityError:
                transaction.rollback()
                messages.error(request, _('Create department failed.'))
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
            
            if popup:
                return HttpResponse(('<script>parent.closeModal(); parent.department = {"code": "%s", "name": "%s" }</script>') % (department.uuid, department.name))

            # Print success message
            messages.success(request, _('Created department successfully.'))
            return HttpResponseRedirect('/department')
        else:
            # Print error message
            messages.error(request, _('Please correct the errors below.'))

        # Trim about blank
        form = DepartmentForm({'name': name.strip()})
    
    # Render template
    return render(request, 'wysebone/department/add.html', {'form': form, 'list_parent': list_parent, 'department': department, 'popup': popup, 'department_active': 'active'})


@login_required(login_url='/login')
@permission_required('wysebone.change_department', raise_exception=True)
def change_member(request, uuid):
    """Change members for department
    
    URL department/[department_uuid]/change-members

    Parameters
    ----------
    request: HttpRequest
        The Http request
    uuid Department uuid

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """

    try:
        # Get department
        department = Department.objects.get(uuid=uuid)
    except Department.DoesNotExist:
        messages.error(request, _('Department with id: %s does not exist.') % uuid)
        return HttpResponseRedirect('/department')

    User = get_user_model()

    # Get all list user of Company
    all_users = User.objects.exclude(department=department).filter(company=request.user.company).order_by('id')

    # Get list users selected
    department_user = User.objects.filter(company=request.user.company, department=department).order_by('id')

    # Get id users selected
    old_users = []
    for item in department_user:
        old_users.append(str(item.pk))

    # create form
    form = ChangMemberForm()

    # POST data
    if request.method == "POST":
        # Get data from form
        new_users = request.POST.getlist('department_to')
        form = ChangMemberForm(request.POST)

        # Validate data form
        if form.is_valid():
            # Create new department_users
            if list(set(new_users) - set(old_users)):
                for user in list(set(new_users) - set(old_users)):
                    department.users.add(user)

            # Remove department_users
            if list(set(old_users) - set(new_users)):
                for user_id in list(set(old_users) - set(new_users)):
                    department.users.remove(user_id)

            try:
                # Commit department
                department.save()   
            except IntegrityError:
                transaction.rollback()
                messages.error(request, _("Change '%s' members failed.") % department.name)
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

            # print success message
            messages.success(request, _("Change '%s' members successfully.") % department.name)
            return HttpResponseRedirect('/department')
        else:
            # Print error message
            messages.error(request, _('Please correct the errors below.'))
    
    # Render template
    return render(request,
    'wysebone/department/change_member.html',
    {
        'form': form,
        'department_user': department_user,
        'users': all_users,
        'department_active': 'active',
        'department_member':_("'%s' members") % department.name,
    })

@login_required(login_url='/login')
@permission_required('wysebone.change_department', raise_exception=True)
def change(request, uuid):

    """Change department
    
    URL department/[department_uuid]/change

    Parameters
    ----------
    request: HttpRequest
        The Http request
    uuid Department uuid

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """

    try:
        # Get department
        department = Department.objects.get(uuid=uuid, company=request.user.company)
    except Department.DoesNotExist:
        messages.error(request, _('Department with id: %s does not exist.') % uuid)
        return HttpResponseRedirect('/department')

    # Create form
    form = DepartmentForm({'name': department.name })

    # Get parent department
    list_parent = Department.objects.filter(company=request.user.company)

    # POST data
    if request.method == "POST":
    
        # Get data from form
        form = DepartmentForm(request.POST)
        name = request.POST.get('name')
        parent = request.POST.get('parent')

        # Check parent department
        if parent == '':
            parent = None
        else:
            parent = Department.objects.get(company=request.user.company, pk=parent)
        description = request.POST.get('description')

        # Validate data form
        if form.is_valid():
            department.name = name
            department.parent = parent
            department.description = description

            try:
                # Commit department
                department.save()
            except IntegrityError:
                transaction.rollback()
                messages.error(request, _('An error occurred while processing. Please try again later.'))
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

            # Print success message
            messages.success(request, _('The %(name)s \"%(obj)s\" was changed successfully.') % {'name': _('Department'), 'obj': department.name})
            return HttpResponseRedirect('/department')

        # Trim about blank
        form = DepartmentForm({'name': name.strip()})

    # Render template
    return render(request, 'wysebone/department/change.html', 
    {
        'form': form,
        'header': _('Change %s') % _('Department'),
        'department': department, 
        'list_parent': list_parent, 
        'department_active': 'active'})


@login_required(login_url='/login')
@permission_required('wysebone.delete_department', raise_exception=True)
def delete(request, uuid):

    """Delete department
    
    URL department/[department_uuid]/delete

    Parameters 
    ----------
    request: HttpRequest
        The Http request
    uuid Department uuid

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """

    try:
        # Get department
        department = Department.objects.get(uuid=uuid, company=request.user.company)
    except Department.DoesNotExist:
        messages.error(request, _('Department with id: %s does not exist.') % uuid)
        return HttpResponseRedirect('/department')

    # Get request from template
    if request.POST.get('post'):
        try:
            department.users.clear()
            department.delete()
        except:
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return HttpResponseRedirect('/department')

        # Print success message
        messages.success(request, _('The %(name)s \"%(obj)s\" was deleted successfully.') % { 'name': _('Department'), 'obj': department.name})
        return HttpResponseRedirect('/department')
    
    return render(request, 'wysebone/delete_confirmation.html', {
        'name': _('Department'),
        'obj': department.name,
        'department_active': 'active'
        })

    
