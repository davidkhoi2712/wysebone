from django.shortcuts import render
from django.urls import reverse
from wysebone.forms.plan import PlanForm
from wysebone.models.plans import Plan
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.decorators import permission_required, login_required
from django.db import transaction, IntegrityError
import datetime
from wysebone import alert

@login_required(login_url='/login')
@permission_required('wysebone.view_plan', raise_exception=True)
def index(request):
    """Management contract plans
    
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

    # Get all contract plans
    plans = Plan.objects.all().order_by('id')

    # Render template
    return render(request, 'wysebone/plan/index.html', { 
        'plans': plans, 
        'contract_plan_active': 'active',
        'Add_Plan': _('Add %s') % _('Contract plan'),
        'Edit_title': _('Change %s') % _('Contract plan'),
        'Delete_title': _('Delete %s') % _('Contract plan')
    })

@login_required(login_url='/login')
@permission_required('wysebone.add_plan', raise_exception=True)
def add(request):
    """Add contract plan form
    
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
    form = PlanForm()

    # POST data
    if request.method == "POST":

        # Get data from form
        form = PlanForm(request.POST)
        name = request.POST.get('name')
        account_limit = request.POST.get('account_limit') if request.POST.get('account_limit') else None
        app_limit = request.POST.get('app_limit') if request.POST.get('app_limit') else None

        # Validate data form
        if form.is_valid():
            #  Create new contract plan
            plan = Plan(name=name, account_limit=account_limit, app_limit = app_limit)
            
            try:
                # Commit plan
                plan.save()
            except IntegrityError:
                transaction.rollback()
                messages.error(request, _('An error occurred while processing. Please try again later.'))
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

            # Print success message
            messages.success(request, alert.added_successfully(
                category=_('Contract plan'),
                url_name='edit.contract_plan',
                url_args=(plan.id,),
                obj_name=plan.name
            ))

            return HttpResponseRedirect('/plan')
        else:
            # Print error message
            messages.error(request, _('Please correct the errors below.'))   
    
    # Render template
    return render(request, 'wysebone/plan/add.html', {
        'form': form,
        'contract_plan_active': 'active',
        'the_title': _('Add %s') % _('Contract plan'),
    })


@login_required(login_url='/login')
@permission_required('wysebone.change_plan', raise_exception=True)
def edit(request, uuid):
    """Edit contract plans
    
    URL plan/[uuid]/change

    Parameters uuid Contract plans uuid
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

    # Get contract plans
    plan = Plan.objects.get(id=uuid)
    # create form
    form = PlanForm(initial={
        'name': plan.name,
        'account_limit': plan.account_limit,
        'app_limit': plan.app_limit
    }, instance=plan)

    # POST data
    if request.method == "POST":
        # Get data from form
        form = PlanForm(request.POST, instance=plan)
        name = request.POST.get('name')
        account_limit = request.POST.get('account_limit') if request.POST.get('account_limit') else None
        app_limit = request.POST.get('app_limit') if request.POST.get('app_limit') else None

        # Validate data form
        if form.is_valid():
            plan.name=name
            plan.app_limit=app_limit
            plan.account_limit=account_limit

            try:
                # Commit contract plans
                plan.save()
            except IntegrityError:
                transaction.rollback()
                messages.error(request, _('An error occurred while processing. Please try again later.'))
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

            # Print success message
            messages.success(request, alert.changed_successfully(
                category=_('plan'),
                url_name='edit.contract_plan',
                url_args=(plan.id,),
                obj_name=plan.name
            ))
            return HttpResponseRedirect('/plan')

        else:
            # Print error message
            messages.error(request, _('Please correct the errors below.'))

    # Render template
    return render(request,
    'wysebone/plan/edit.html',
    {
        'form': form,
        'contract_plan_active': 'active',
        'the_title': _('Change %s') % _('Contract plan'),
    })

@login_required(login_url='/login')
@permission_required('wysebone.delete_plan', raise_exception=True)
def delete(request, uuid):

    """Delete contract plan
    
    URL plan/[uuid]/delete

    Parameters uuid Plan uuid
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

    try:
        # Get contract plan
        plan = Plan.objects.get(id=uuid)
    except Plan.DoesNotExist:
        messages.error(request, _('Plan with id: %s does not exist.') % uuid)
        return HttpResponseRedirect('/plan')

    if request.method == "POST":
        try:
            plan.delete()
        except IntegrityError:
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return HttpResponseRedirect('/plan')

        # Print success message
        messages.success(request, _("The %(name)s \"%(obj)s\" was deleted successfully.") % {'name': _('Contract plan'), 'obj': plan.name})
        return HttpResponseRedirect('/plan')
        
    return render(request, 'wysebone/delete_confirmation.html', {
        'name': _('Contract plan'),
        'obj': plan.name,
        'contract_plan_active': 'active'
    })