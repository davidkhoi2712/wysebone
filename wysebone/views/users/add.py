from django.shortcuts import render
from django.db import transaction
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.forms.account import CreateUserForm
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


class AddUser(PermissionRequiredMixin, View):
    permission_required = 'wysebone.add_user'
    
    def get(self, request):
        """Add user form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.1

        Author
        ------
        Khoi Pham
        Dong Nguyen
        """
        
        # Create form
        form = CreateUserForm()

        # Render http
        return self.render(request, form)
    
    def post(self, request):
        """Post add user
    
        Parameters
        ----------
        request: HttpRequest

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
        
        # Create form
        form = CreateUserForm(request.POST)
        
        # Form validate
        if form.is_valid() is False:
            # print error message
            messages.error(request, _('Please correct the errors below.'))
            return self.render(request, form)
        
        if request.user.company.contract_plan is not None:
            account_limit = request.user.company.contract_plan.account_limit
            if (account_limit != None):
                total_users = User.objects.filter(company=request.user.company).count()
                if (total_users >= account_limit):
                    messages.error(request, _('The number of accounts over the limit allow.'))
                    return HttpResponseRedirect(next)
        
        hire_date   = None if request.POST.get('hire_date') == '' else dates.locale_to_db(request.POST.get('hire_date'))
        birthday    = None if request.POST.get('birthday') == '' else dates.locale_to_db(request.POST.get('birthday'))
        
        language    = request.POST.get('language')
        # Set language default if data empty
        if language == '':
            language = request.LANGUAGE_CODE
        
        try:
            with transaction.atomic():
                # Create new User
                user = User.objects.create(email=request.POST.get('email'),
                    password=make_password(request.POST.get('password1')),
                    is_superuser=False,
                    is_staff=False,
                    is_active=True,
                    first_name=request.POST.get('first_name'),
                    last_name=request.POST.get('last_name'),
                    phone=request.POST.get('phone'),
                    company=request.user.company,
                    birthday=birthday,
                    hire_date=hire_date,
                    language = language,
                    time_zone = request.POST.get('time_zone')
                )
                
                # Check avatar upload file and update for user
                avatar = request.POST.get('upload_avatar')
                if avatar:
                    try:
                        import uuid as _uuid
                        format, imgstr = avatar.split(';base64,')
                        ext = format.split('/')[-1]
                        data = ContentFile(base64.b64decode(imgstr), name=_uuid.uuid4().hex + '.' + ext)
                        user.avatar = data
                    except:
                        pass
                    
                # Add authority for user
                permissions = request.POST.getlist('permissions_to')
                for auth_id in permissions:
                    authority = Authority.objects.get(pk=auth_id, company=request.user.company)
                    user.app_permissions.add(authority)
                    
                # Add department for user
                departments = request.POST.getlist('department')
                for item in departments:
                    department = Department.objects.get(uuid=item, company=request.user.company)
                    department.users.add(user)
                    
                # Add roles for user
                roles = request.POST.getlist('roles')
                for role_id in roles:
                    role = Role.objects.get(pk=role_id)
                    user.roles.add(role)
                    
                # Add groups for user
                groups = request.POST.getlist('groups_to')
                for group_id in groups:
                    group = Group.objects.get(pk=group_id, company=request.user.company)
                    user.groups.add(group)
                    
                # Commit user
                user.save()
                
                # print success message
                messages.success(request, _('Created user successfully.'))
                return HttpResponseRedirect(next)
        except:
            transaction.rollback()
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return self.render(request, form)
    
    def render(self, request, form):
        """Reder add user form
    
        Parameters
        ----------
        request: HttpRequest
        form: wysebone.forms.account.CreateUserForm

        Version
        -------
        1.0.0

        Author
        ------
        Khoi Pham
        Dong Nguyen
        """

        return render(request, 'wysebone/user/add.html', {
            'form': form,
            'roles': auths.get_required_roles(request.user),
            'available_permissions': _('Available %s') % _('Permissions'),
            'chosen_permissions': _('Chosen %s') % _('Permissions'),
            'departments': Department.objects.filter(company=request.user.company),
            'permissions': auths.get_permissions(),
            'next_uri': get_next_url(request, '/user'),
            'is_development': request.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE),
            'available_groups': _('Available %s') % _('groups'),
            'chosen_groups': _('Chosen %s') % _('groups'),
            'groups': Group.objects.filter(company=request.user.company).order_by('name'),
            'user_active': 'active',
        })