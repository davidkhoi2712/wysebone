from django.shortcuts import render
from django.db import transaction
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.forms.account import ChangeUserForm
from django.utils.translation import gettext_lazy as _
from wysebone import constants, auths, dates
from django.contrib.auth import get_user_model
from wysebone.models.department import Department
from wysebone.models.authority import Authority
from wysebone.models.role import Role
from django.contrib.auth.models import Group
from wysebone.utils import get_next_url
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.contrib.auth.hashers import make_password
from django.core.files.base import ContentFile
import base64
from django.core.exceptions import PermissionDenied


class ChangeUser(PermissionRequiredMixin, View):
    permission_required = 'wysebone.change_user'
    
    user = None
    current_deparments = None
    selected_perms = None
    available_perms = None
    selected_groups = None
    available_groups = None
    
    def get(self, request, uuid):
        """Change user form
        URL user/[user_uuid]/change
    
        Parameters
        ----------
        request: HttpRequest
        uuid: user uuid

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
            self.user = User.objects.get(user_id=uuid, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('user').title(), 'key': uuid})
            return HttpResponseRedirect(next)
        
        if request.user == self.user:
            pass
        else:
            if request.user.has_role(constants.CUSTOMER_ADMIN_ROLE):
                if self.user.is_dynastyle_admin:
                    raise PermissionDenied
            else:
                if request.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE):
                    if self.user.has_role(constants.CUSTOMER_ADMIN_ROLE):
                        raise PermissionDenied
                elif request.user.has_role(constants.CUSTOMER_OPERATION_ROLE):
                    if self.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE) or self.user.has_role(constants.CUSTOMER_ADMIN_ROLE) or self.user.has_role(constants.CUSTOMER_TESTER_ROLE):
                        raise PermissionDenied
        
        # Create form
        form = ChangeUserForm(initial={
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'phone': self.user.phone,
            'hire_date': self.user.hire_date,
            'birthday': self.user.birthday,
        })
        
        # Get data from db
        self.get_data_from_db(request)

        # Render http
        return self.render(request, form)
    
    def post(self, request, uuid):
        """Post change user
    
        Parameters
        ----------
        request: HttpRequest
        uuid: user uuid

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
            self.user = User.objects.get(user_id=uuid, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('user').title(), 'key': uuid})
            return HttpResponseRedirect(next)
        
        if request.user == self.user:
            pass
        else:
            if request.user.has_role(constants.CUSTOMER_ADMIN_ROLE):
                if self.user.is_dynastyle_admin:
                    raise PermissionDenied
            else:
                if request.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE):
                    if self.user.has_role(constants.CUSTOMER_ADMIN_ROLE):
                        raise PermissionDenied
                elif request.user.has_role(constants.CUSTOMER_OPERATION_ROLE):
                    if self.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE) or self.user.has_role(constants.CUSTOMER_ADMIN_ROLE) or self.user.has_role(constants.CUSTOMER_TESTER_ROLE):
                        raise PermissionDenied
        
        # Create form
        form = ChangeUserForm(request.POST, instance=self.user)
        
        if form.is_valid() is False:
            # print error message
            messages.error(request, _('Please correct the errors below.'))
            return self.render(request, form)
        
        # Get data from db
        self.get_data_from_db(request)

        # Get department from user
        old_deparment = []
        for item in self.current_deparments:
            old_deparment.append(item.uuid)

        status      = False if request.POST.get('status') == None else True
        departments = request.POST.getlist('department')
        hire_date   = None if request.POST.get('hire_date') == '' else dates.locale_to_db(request.POST.get('hire_date'))
        birthday    = None if request.POST.get('birthday') == '' else dates.locale_to_db(request.POST.get('birthday'))
        language    = request.LANGUAGE_CODE if request.POST.get('language') == '' else request.POST.get('language')
            
        try:
            with transaction.atomic():
                # Set value for user
                self.user.first_name = request.POST.get('first_name')
                self.user.last_name  = request.POST.get('last_name')
                self.user.emai       = request.POST.get('email')
                self.user.phone      = request.POST.get('phone')
                self.user.birthday   = birthday
                self.user.hire_date  = hire_date
                self.user.language   = language
                self.user.time_zone  = request.POST.get('time_zone')
                
                # Update status
                if self.user != request.user:
                    self.user.is_active  = status
                    
                # Update avatar
                avatar = request.POST.get('upload_avatar')
                if avatar:
                    if self.user.avatar:
                        self.user.avatar.delete(save=True)
                    try:
                        import uuid as _uuid
                        format, imgstr = avatar.split(';base64,')
                        ext = format.split('/')[-1]
                        data = ContentFile(base64.b64decode(imgstr), name=_uuid.uuid4().hex + '.' + ext)
                        self.user.avatar = data
                    except:
                        pass

                    
                # Update department
                if list(set(departments) - set(old_deparment)):
                    for item_new in list(set(departments) - set(old_deparment)):
                        new_node = Department.objects.get(uuid=item_new)
                        new_node.users.add(self.user)

                if list(set(old_deparment) - set(departments)):
                    for item_old in list(set(old_deparment) - set(departments)):
                        old_node = Department.objects.get(uuid=item_old)
                        old_node.users.remove(self.user)
                        
                # Update authority
                chosen_authority = request.POST.getlist('permissions_to')
                if chosen_authority:
                    # Remove selected authority from group
                    for auth in self.selected_perms:
                        if str(auth.pk) in chosen_authority:
                            continue
                        self.user.app_permissions.remove(auth)

                    # Add new chosen authority
                    for auth_id in chosen_authority:
                        auth = Authority.objects.get(pk=auth_id, company=request.user.company)
                        if auth in self.selected_perms:
                            continue
                        self.user.app_permissions.add(auth)
                else:
                    # Empty authority from group
                    self.user.app_permissions.clear()
                    
                # Update groups
                chosen_groups = request.POST.getlist('groups_to')
                if chosen_groups:
                    # Remove selected authority from group
                    for group in self.selected_groups:
                        if str(group.pk) in chosen_groups:
                            continue
                        self.user.groups.remove(group)

                    # Add new chosen authority
                    for group_id in chosen_groups:
                        group = Group.objects.get(pk=group_id, company=request.user.company)
                        if group in self.selected_groups:
                            continue
                        self.user.groups.add(group)
                else:
                    self.user.groups.clear()
                    
                # Update role
                roles = request.POST.getlist('roles')
                self.user.roles.clear()
                for role_id in roles:
                    role = Role.objects.get(pk=role_id)
                    self.user.roles.add(role)
                    
                # Commit user
                self.user.save()
                
                # print success message
                messages.success(request, _("The %(name)s \"%(obj)s\" was changed successfully.") % {'name': _('User'), 'obj': self.user.get_full_name()})
                return HttpResponseRedirect(next)
        except:
            transaction.rollback()
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return self.render(request, form)
            
    def get_data_from_db(self, request):
        """Get data from DB
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.1

        Author
        ------
        Dong Nguyen
        """
        
        # Get current department
        try:
            self.current_deparments = Department.objects.filter(company=request.user.company, users=self.user)
        except:
            self.current_deparments = None
            
        # Get selected permissions
        self.selected_perms = self.user.app_permissions.order_by('name')

        # Get available permissions
        self.available_perms = Authority.objects.filter(company=request.user.company).exclude(id__in=self.selected_perms).order_by('name')

        # Get selected groups
        self.selected_groups = self.user.groups.order_by('name')

        # Get available groups
        self.available_groups = Group.objects.filter(company=request.user.company, is_admin=False).exclude(id__in=self.selected_groups).order_by('name')
    
    def render(self, request, form):
        """Reder add user form
    
        Parameters
        ----------
        request: HttpRequest
        form: wysebone.forms.account.CreateUserForm

        Version
        -------
        1.0.1

        Author
        ------
        Khoi Pham
        Dong Nguyen
        """
        
        next = get_next_url(request, '/user')

        return render(request, 'wysebone/user/change.html',
        {
            'form': form,
            'header': _('Change %s') % _('User'),
            'user': self.user,
            'roles': auths.get_required_roles(request.user),
            'user_roles': self.user.roles.all(),
            'departments': Department.objects.filter(company=request.user.company),
            'user_deparment': self.current_deparments,
            'available_permissions': _('Available %s') % _('Permissions'),
            'chosen_permissions': _('Chosen %s') % _('Permissions'),
            'available_perms': self.available_perms,
            'selected_perms' : self.selected_perms,
            'cancel_uri': next,
            'is_development': request.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE),
            'available_groups_title': _('Available %s') % _('groups'),
            'chosen_groups_title': _('Chosen %s') % _('groups'),
            'selected_groups': self.selected_groups,
            'available_groups': self.available_groups,
            'user_active': 'active',
        })