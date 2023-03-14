from django.shortcuts import render
from wysebone.forms.groups import NewGroupForm
from django.contrib.auth.models import Group
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from django.db import transaction
from django.contrib import messages
from django.http import HttpResponseRedirect
from wysebone.models.authority import Authority
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from wysebone import alert


class ChangeGroupView(PermissionRequiredMixin, View):
    permission_required = 'auth.change_group'

    # Group object
    group = None

    def get(self, request, uuid):
        """Change group form
    
        Parameters
        ----------
        request: HttpRequest
        uuid: str
            The uuid of group

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        # Get group from uuid
        try:
            self.group = Group.objects.get(uuid=uuid, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('group').title(), 'key': uuid})
            return HttpResponseRedirect('/group')

        # Get form
        form = NewGroupForm(initial={
            'name': self.group.name
        }, auto_id=False)

        return self.render(request, form)

    def post(self, request, uuid):
        """Post change group form
    
        Parameters
        ----------
        request: HttpRequest
        uuid: str
            The uuid of group

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        Thanh Pham
        """

        # Get group from uuid
        try:
            self.group = Group.objects.get(uuid=uuid, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('group').title(), 'key': uuid})
            return HttpResponseRedirect('/group')

        # User model
        User = get_user_model()

        # Get form
        form = NewGroupForm(request.POST, auto_id=False, instance=self.group)

        # Validate form
        if form.is_valid() is False:
            messages.error(request, _('Please correct the errors below.'))
            return self.render(request, form)

        # Update DB
        try:
            with transaction.atomic():
                self.group.name = request.POST.get('name')
                self.group.save()
                
                 # Get selected users from DB
                selected_users = User.objects.filter(groups=self.group, company=request.user.company)

                # Get chosen users from form
                chosen_users = request.POST.getlist('users_to')
                
                if chosen_users:
                    # Remove selected user from group
                    for user in selected_users:
                        if str(user.pk) in chosen_users:
                            continue
                        user.groups.remove(self.group)

                    # Add new chosen user
                    for user_id in chosen_users:
                        user = User.objects.get(pk=user_id, company=request.user.company)
                        if user in selected_users:
                            continue
                        user.groups.add(self.group)
                else:
                    # Empty user from group
                    for user in selected_users:
                        user.groups.remove(self.group)

                # Get selected authority from DB
                selected_authority = self.group.app_permissions.all()

                # Get chosen authority from form
                chosen_authority = request.POST.getlist('permissions_to')
        
                if chosen_authority:
                    # Remove selected authority from group
                    for auth in selected_authority:
                        if str(auth.pk) in chosen_authority:
                            continue
                        self.group.app_permissions.remove(auth)

                    # Add new chosen authority
                    for auth_id in chosen_authority:
                        auth = Authority.objects.get(pk=auth_id, company=request.user.company)
                        if auth in selected_authority:
                            continue
                        self.group.app_permissions.add(auth)
                else:
                    # Empty authority from group
                    self.group.app_permissions.clear()

                messages.success(request, alert.changed_successfully(
                    category=_('group'),
                    url_name='change.group',
                    url_args=(self.group.uuid,),
                    obj_name=self.group.name
                ))
                return HttpResponseRedirect('/group')
        except:
            transaction.rollback()
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return self.render(request, form)

    def render(self, request, form):
        """Render edit group form
        
        Parameters
        ----------
        request: HttpRequest
        form: wysebone.forms.groups.NewGroupForm

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        Thanh Pham
        """

        # Get selected permissions
        selected_perms = self.group.app_permissions.order_by('name')

        # Get available permissions
        available_perms = Authority.objects.filter(company=request.user.company).exclude(id__in=selected_perms).order_by('name')

         # User model
        User = get_user_model()

        # Get selected users
        selected_users = User.objects.filter(groups=self.group, company=request.user.company).order_by('first_name')

        # Get available users
        available_users = User.objects.filter(company=request.user.company).exclude(groups=self.group).order_by('first_name')

        return render(request, 'wysebone/groups/change.html', {
            'form': form,
            'the_title': _('Change %s') % _('group'),
            'users': available_users,
            'selected_users': selected_users,
            'available_users': _('Available %s') % _('users'),
            'chosen_users': _('Chosen %s') % _('users'),
            'available_permissions': _('Available %s') % _('Permissions'),
            'chosen_permissions': _('Chosen %s') % _('Permissions'),
            'available_perms': available_perms,
            'selected_perms': selected_perms,
            'group_active': 'active',
        })
        