from django.utils.translation import gettext_lazy as _
from django.db import models
from django.contrib.auth.models import AbstractUser, AbstractBaseUser, BaseUserManager
from wysebone.models.companies import Company
from wysebone.utils import unique_string
from wysebone.validates import validate_phone
from wysebone import constants, permission_constants
from wysebone.models.authority import Authority
from wysebone.auths import get_logged_in_user
from wysebone.models.role import Role
from django.conf import settings


class UserManager(BaseUserManager):
    def create_user(self, email, password=None):
        """Creates and saves a User with the given email and password.
    
        Parameters
        ----------
        email: str
            The email address of super account
        password: str
            The password of super account

        Returns
        -------
        user: wysebone.models.users.User

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        if not email:
            raise ValueError(_('Users must have an email address.'))

        user = self.model(
            email=self.normalize_email(email),
        )

        user.is_superuser = False
        user.is_staff     = True

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        """Creates and saves a superuser with the given email, password.
    
        Parameters
        ----------
        email: str
            The email address of super account
        password: str
            The password of super account

        Returns
        -------
        user: wysebone.models.users.User

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        user = self.create_user(
            email,
            password=password,
        )
        user.is_superuser = True
        user.is_staff     = True
        user.save(using=self._db)
        return user


def user_directory_path(instance, filename):
    """File will be uploaded to MEDIA_ROOT/uploads/avatar/user_<id>/<filename>
    
    Parameters
    ----------
    instance: instance Model
    filename: str
        The name of upload file

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    return 'avatar/user_{0}/{1}'.format(instance.id, filename)


class User(AbstractUser):
    """User model
    
    Parameters
    ----------
    Model: AbstractUser

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    user_id = models.CharField(
        verbose_name=_('Employee ID'),
        editable=False,
        unique=True,
        null=True,
        max_length=10,
    )
    username = models.CharField(
        max_length=150,
        unique=False,
        verbose_name='username',
    )
    email = models.EmailField(
        verbose_name=_('Email address'),
        max_length=254,
        unique=True,
    )
    phone = models.CharField(
        verbose_name=_('Phone number'),
        max_length=20,
        null=True,
        blank=True,
        validators=[validate_phone]
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, editable=False, related_name='users')
    birthday = models.DateTimeField(
        verbose_name=_('Birthday'),
        null=True,
        blank=True
    )
    hire_date = models.DateField(
        verbose_name=_('Hire date'),
        null=True,
        blank=True
    )
    time_zone = models.CharField(
        verbose_name=_('Time zone'),
        max_length=64,
        null=True,
        blank=False,
        default='Asia/Tokyo',
    )
    language = models.CharField(
        verbose_name=_('Language'),
        max_length=2,
        null=True,
        blank=True,
        default='en'
    )
    avatar = models.FileField(
        upload_to=user_directory_path,
        null=True,
        blank=True,
        max_length=128,
    )
    app_permissions = models.ManyToManyField(
        Authority,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
    )
    roles = models.ManyToManyField(
        Role,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
    )
    is_dynastyle_admin = models.BooleanField(
        blank=True,
        default=False
    )
    created_at = models.DateTimeField(_("Creation date"), auto_now_add=True, null=True,)
    created_by = models.ForeignKey('self', related_name='+', on_delete=models.SET_NULL, null=True, editable=False)
    updated_at = models.DateTimeField(_("Last modified"), auto_now=True)
    updated_by = models.ForeignKey('self', related_name='+', on_delete=models.SET_NULL, null=True, editable=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between.

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

    get_full_name.short_description = _('Full name')

    class Meta:
        db_table = "auth_user"
        
    def get_avatar(self):
        """Get avatar
        
        Returns
        -------
        avatar

        Version
        -------
        1.0.1

        Author
        ------
        Dong Nguyen
        """
        
        import os
        
        try:
            avatar = self.avatar
            
            if os.path.isfile(avatar.path):
                pass
            else:
                avatar = None
        except:
            avatar = None
            
        return avatar
        
    def get_avatar_url(self):
        """Get avatar url.
        if avatar is None, return avatar default
        
        Returns
        -------
        avatar_url

        Version
        -------
        1.0.1

        Author
        ------
        Dong Nguyen
        """
        
        avatar = self.get_avatar()
        
        if avatar:
            return avatar.url
            
        return settings.STATIC_URL + 'images/avatar.png'
    
    def get_apps(self):
        """Get list of app by user's authority
        
        Returns
        -------
        role_name: str

        Version
        -------
        1.0.2

        Author
        ------
        Dong Nguyen
        """
        
        from wysebone.models.apps import AppAuthorityGroup
        
        user_apps_filtering = self.app_authority.distinct('app').values_list('app', flat=True)
        group_apps_filtering = AppAuthorityGroup.objects.filter(group__in=self.groups.all()).distinct('app').values_list('app', flat=True)
        return [*user_apps_filtering, *group_apps_filtering]
        
    @property
    def role_name(self):
        """Get role name
        
        Returns
        -------
        role_name: str

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        if self.has_role(constants.CUSTOMER_ADMIN_ROLE):
            return _('Administrator')
        
        if self.has_role(constants.CUSTOMER_DEVELOPER_ROLE):
            return _('Developer')
        
        if self.has_role(constants.CUSTOMER_TESTER_ROLE):
            return _('Tester')
        
        if self.has_role(constants.CUSTOMER_OPERATION_ROLE):
            return _('Operation Manager')
        
        if self.has_role(constants.CUSTOMER_GENERAL_ROLE):
            return _('General User')
    
    @property
    def is_general_role(self):
        """Is general role"""
        
        return self.has_role(constants.CUSTOMER_GENERAL_ROLE)
    
    @property
    def is_administrator_role(self):
        """Is administrator role"""
        
        return self.has_role(constants.CUSTOMER_ADMIN_ROLE)
    
    @property
    def is_developer_role(self):
        """Is developer role"""
        
        return self.has_role(constants.CUSTOMER_DEVELOPER_ROLE)
    
    def has_role(self, role_id):
        for role in self.roles.all():
            if role.pk == role_id:
                return True
        return False

    def save(self, *args, **kwargs):
        """Extend model save function,
        Add user_id when insert new user

        Parameters
        ----------
        args: *args
        kwargs: kwargs

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        current_user = get_logged_in_user()

        if not self.pk:
            self.user_id = unique_string(self, field_name='user_id')
            self.created_by = current_user
        elif current_user is not None:
            self.updated_by = current_user

        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        
        if super().has_perm(perm, obj) == True:
            return True
        
        for role in self.roles.all():
            if perm in permission_constants.permissions_roles.get(role.pk):
                return True
        
        return False

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        return super().has_module_perms(app_label)

    def time_zone_name(self):
        import datetime, pytz
        gtm_offset = datetime.datetime.now(pytz.timezone(self.time_zone)).strftime('%z')
        return "%s (GMT%s)" % (self.time_zone, gtm_offset[:3]+":"+gtm_offset[3:])