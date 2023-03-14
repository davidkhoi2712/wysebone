from django.shortcuts import render
from django.db import transaction
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.forms.groups import NewGroupForm
from wysebone.auths import get_permissions
from wysebone.utils import unique_string
from django.contrib.auth.models import Group, Permission
from django.contrib import messages
from django.http import HttpResponseRedirect
from wysebone.models.authority import Authority
from django.contrib.auth import get_user_model
from wysebone import alert
from django.utils.translation import gettext_lazy as _


class AddGroupView(PermissionRequiredMixin, View):
    permission_required = 'auth.add_group'

    def get(self, request):
        """New group form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        # Create form
        form = NewGroupForm(auto_id=False)

        # Render http
        return self.render(request, form)

    def post(self, request):
        """Post new group form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        Thanh Pham
        """

        form = NewGroupForm(request.POST, auto_id=False)

         # User model
        User = get_user_model()

        if form.is_valid() == False:
            messages.error(request, _('Please correct the errors below.'))
            return self.render(request, form)

        try:
            with transaction.atomic():
                # Create new group
                group = Group.objects.create(
                    name=request.POST.get('name'),
                    company=request.user.company,
                    is_admin=False,
                    is_hidden=False,
                    created_by=request.user
                )
                group.uuid = unique_string(group, field_name='uuid')

                 # Get chosen users from form
                chosen_users = request.POST.getlist('users_to')

                if chosen_users:
                    # Add new chosen user
                    for user_id in chosen_users:
                        user = User.objects.get(pk=user_id, company=request.user.company)
                        user.groups.add(group)

                # Get post permissions
                permissions = request.POST.getlist('permissions_to')
                if permissions:
                    for auth_id in permissions:
                        perm = Authority.objects.get(pk=auth_id, company=request.user.company)
                        group.app_permissions.add(perm)

                # Commit group
                group.save()

                # print success message
                messages.success(request, alert.added_successfully(
                    category=_('group'),
                    url_name='change.group',
                    url_args=(group.uuid,),
                    obj_name=group.name
                ))

                return HttpResponseRedirect('/group')

        except:
            transaction.rollback()
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return self.render(request, form)

    def render(self, request, form):
        """Render new group form
    
        Parameters
        ----------
        request: HttpRequest
        form: NewGroupForm

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        Thanh Pham
        """

         # User model
        User = get_user_model()

        # Get available users
        available_users = User.objects.filter(company=request.user.company).order_by('first_name')

        return render(request, 'wysebone/groups/add.html', {
            'form': form,
            'the_title': _('Add %s') % _('group'),
            'users': available_users,
            'available_users': _('Available %s') % _('users'),
            'chosen_users': _('Chosen %s') % _('users'),
            'available_permissions': _('Available %s') % _('Permissions'),
            'chosen_permissions': _('Chosen %s') % _('Permissions'),
            'permissions': get_permissions(),
            'group_active': 'active',
        })