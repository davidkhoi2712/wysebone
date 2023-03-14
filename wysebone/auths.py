from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.utils import timezone, translation
from wysebone.middleware import get_current_user
import datetime
from django.contrib.auth.models import Permission

def get_groups():
    """Get groups from logged in company

    Returns
    ------
    groups_input: array
        List of groups for customer area.

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    from django.contrib.auth.models import Group

    # Get groups
    groups = Group.objects.filter(company=get_company(), is_admin=False).order_by('name')

    groups_input = []

    for group in groups:
        groups_input.append((group.pk, group.name))

    return groups_input


def get_permissions():
    """Get current logged in user

    Returns
    ------
    permissions: array
        List of permissions for customer area.

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    from wysebone.models.authority import Authority

    # Get permissions
    auths = Authority.objects.filter(company=get_company()).order_by('name')

    permissions = []

    for auth in auths:
        permissions.append((auth.id, auth.name))

    return permissions


def get_roles():
    """Get list avaiable role

    Returns
    ------
    roles: array

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """
    
    from wysebone.models.role import Role
    
    roles_obj = Role.objects.all()
    
    roles = []
    for role in roles_obj:
        roles.append((role.pk, _(role.name)))
    
    return roles


def get_required_roles(user):
    """Get list of roles for the user creation function.
    
    Parameters
    ----------
    user: django.contrib.auth.get_user_model

    Returns
    ------
    roles: array

    Version
    -------
    1.0.1

    Author
    ------
    Dong Nguyen
    """
    
    from wysebone import constants
    from wysebone.models.role import Role

    # Is Administrator logged in role
    if user.has_role(constants.CUSTOMER_ADMIN_ROLE):
        return Role.objects.all()
    
    # Is Developer logged in role
    if user.has_role(constants.CUSTOMER_DEVELOPER_ROLE):
        return Role.objects.all().exclude(pk=constants.CUSTOMER_ADMIN_ROLE)
    
    # Is Operation logged in role
    if user.has_role(constants.CUSTOMER_OPERATION_ROLE):
        return Role.objects.all().exclude(pk__in=(constants.CUSTOMER_ADMIN_ROLE, constants.CUSTOMER_DEVELOPER_ROLE, constants.CUSTOMER_TESTER_ROLE))
    
    return None


def get_admin_permissions():
    """Get list of permissions for admin
    
    Returns
    -------
    permissions_input: Array

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    perms = {
        'add_group': _('Can %s') % (_('Add %s') % _('group')),
        'change_group': _('Can %s') % (_('Change %s') % _('group')),
        'view_group': _('Can %s') % (_('View %s') % _('group')),
        'delete_group': _('Can %s') % (_('Delete %s') % _('group')),

        'add_user': _('Can %s') % (_('Add %s') % _('user')),
        'change_user': _('Can %s') % (_('Change %s') % _('user')),
        'view_user': _('Can %s') % (_('View %s') % _('user')),
        'delete_user': _('Can %s') % (_('Delete %s') % _('user')),

        'add_company': _('Can %s') % (_('Add %s') % _('Company')),
        'change_company': _('Can %s') % (_('Change %s') % _('Company')),
        'view_company': _('Can %s') % (_('View %s') % _('Company')),
        'delete_company': _('Can %s') % (_('Delete %s') % _('Company')),

        'add_plan': _('Can %s') % (_('Add %s') % _('Contract plan')),
        'change_plan': _('Can %s') % (_('Change %s') % _('Contract plan')),
        'view_plan': _('Can %s') % (_('View %s') % _('Contract plan')),
        'delete_plan': _('Can %s') % (_('Delete %s') % _('Contract plan')),
    }

    # Get permission from DB
    permissions = Permission.objects.all().filter(codename__in=perms.keys()).order_by('id')

    permissions_input = []
    for permission in permissions:
        permissions_input.append((permission.pk, perms[permission.codename]))

    return permissions_input


def get_logged_in_user():
    """Get current logged in user

    Returns
    -------
    user: django.contrib.auth.get_user_model
        The current logged in user or None

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """
    user = get_current_user()

    if user is None:
        return None

    if user.is_authenticated:
        return user

    return None


def get_company():
    """Get company from current logged in user

    Returns
    -------
    company: wysebone.models.companies.Company
        The company from current logged in user or None

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    user = get_logged_in_user()

    if user is None:
        return None

    return user.company


def get_users():
    """Get list of users from company of logged in user

    Returns
    -------
    users: array 
        List of wysebone.models.users.User

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    # Get company from logged in user
    company = get_company()

    # User model
    User = get_user_model()

    return User.objects.filter(company=company)

def format_users_MultipleChoice():
    """Format users for multiple choice

    Returns
    -------
    users: array 
        List of wysebone.models.users.User

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    # Get list of users from company logged in
    users = get_users()

    # List of format users
    format_users = []
    for user in users:
        format_users.append((user.pk, user.get_full_name))

    return format_users