from django.shortcuts import render
from django.core.paginator import Paginator
from django.contrib.auth.decorators import permission_required, login_required
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from wysebone import constants
from wysebone.models.role import Role
from django.db.models import Q
from django.db.models import Value
from django.db.models.functions import Concat
from django.http import HttpResponseRedirect
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.views.pagination import Pagination


class ListUsersView(PermissionRequiredMixin, View, Pagination):
    permission_required = 'wysebone.view_user'

    def get(self, request):
        """Display list of users
        
        Parameters
        ----------
        request: HttpRequest
            The Http request

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        Thanh Pham
            """
        user_name_or_email = request.GET.get('name','')
        if user_name_or_email:
            user_path = "/user/?name="+user_name_or_email+'&'
        else:
            user_path = "/user/?"

        users = get_users_from_roles(request, user_name_or_email)

        # Get per page from url
        self.get_per_page(request)

        # Get paginator from apps and per_page
        paginator = Paginator(users, self.per_page)
        
        # Get page number
        self.get_page_number(request, paginator)
        
        # If need redirect to new uri
        if self.is_redirect:
            return HttpResponseRedirect(self.get_redirect_url(user_path))

        return render(request, 'wysebone/user/index.html', {
            'objects': paginator.get_page(self.page_number),
            'user_name_or_email': user_name_or_email,
            'next': request.get_full_path(),
            'object_path': user_path,
            'object_target': 'user',
            'object_per_page': self.per_page,
            'roles': Role.objects.all(),
            'the_title': _('Users'),
            'add_user_title': _('Add %s') % _('user'),
            'user_active': 'active',
        })
        

def get_users_from_roles(request, user_name_or_email):
    """Display list of users
    
    Parameters
    ----------
    request: HttpRequest
    
    Returns
    -------
    User: models/users/User

    Version
    -------
    1.0.2

    Author
    ------
    Dong Nguyen
    Thanh Pham
    """
    
    User = get_user_model()
    
    if user_name_or_email:
        if request.user.is_dynastyle_admin:
            return User.objects.annotate(full_name=Concat('first_name', Value(' '), 'last_name')).\
                        filter(Q(company=request.user.company), Q(email__icontains=user_name_or_email) | Q(full_name__icontains=user_name_or_email)).order_by('-date_joined')
        if request.user.has_role(constants.CUSTOMER_ADMIN_ROLE):
            return  User.objects.annotate(full_name=Concat('first_name', Value(' '), 'last_name')).\
                        filter(Q(company=request.user.company), Q(email__icontains=user_name_or_email) | Q(full_name__icontains=user_name_or_email)).exclude(is_dynastyle_admin=True).order_by('-date_joined')
        if request.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE):
            return User.objects.annotate(full_name=Concat('first_name', Value(' '), 'last_name')).\
                        filter(Q(company=request.user.company), Q(email__icontains=user_name_or_email) | Q(full_name__icontains=user_name_or_email)).exclude(roles__in=(constants.CUSTOMER_ADMIN_ROLE,)).order_by('-date_joined')
        if request.user.has_role(constants.CUSTOMER_OPERATION_ROLE):
            return User.objects.annotate(full_name=Concat('first_name', Value(' '), 'last_name')).\
                        filter(Q(company=request.user.company), Q(email__icontains=user_name_or_email) | Q(full_name__icontains=user_name_or_email), Q(pk=request.user.pk) | Q(roles__in=(constants.CUSTOMER_OPERATION_ROLE, constants.CUSTOMER_GENERAL_ROLE,))
                                ).distinct().order_by('-date_joined')
        return None
    else:
        if request.user.is_dynastyle_admin:
            return User.objects.filter(company=request.user.company).order_by('-date_joined')
        
        if request.user.has_role(constants.CUSTOMER_ADMIN_ROLE):
            return  User.objects.filter(company=request.user.company).exclude(is_dynastyle_admin=True).order_by('-date_joined')

        if request.user.has_role(constants.CUSTOMER_DEVELOPER_ROLE):
            return User.objects.filter(company=request.user.company).exclude(roles__in=(constants.CUSTOMER_ADMIN_ROLE,)).order_by('-date_joined')
        
        if request.user.has_role(constants.CUSTOMER_OPERATION_ROLE):
            return User.objects.filter(
                Q(company=request.user.company), Q(pk=request.user.pk) | Q(roles__in=(constants.CUSTOMER_OPERATION_ROLE, constants.CUSTOMER_GENERAL_ROLE,))
            ).distinct().order_by('-date_joined')
        
        return None
