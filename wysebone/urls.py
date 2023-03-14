from django.urls import path, re_path, include, reverse_lazy
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from .views import home, account, department, groups, company, table, authority, apps, users, plan, list_tables
from wysebone.forms import users as users_from
from django.views.i18n import set_language
from django.conf.urls import url
from django.views.static import serve

# Group management
group_patterns = [
    path('', groups.list.ListGroupView, name='index.group'),
    path('add', groups.add.AddGroupView.as_view(), name='add.group'),
    path('<str:uuid>/change', groups.change.ChangeGroupView.as_view(), name='change.group'),
    path('<str:uuid>/delete', groups.delete.DeleteGroupView.as_view(), name='delete.group'),
]


# Department management
department_patterns = [
    re_path(r'^(?:page-(?P<page_number>\d+)/)?$', department.index, name='index.department'),
    path('add/', department.add, name='add.department'),
    path('<str:uuid>/change', department.change, name='change.department'),
    path('<str:uuid>/delete', department.delete, name='delete.department'),
    path('<str:uuid>/change-members', department.change_member, name='change_member.department'),
]

# App management
app_patterns = [
    path('', apps.list.ListAppView.as_view(), name='index.app'),
    path('add', apps.add.AddAppView.as_view(), name='add.app'),
    path('<str:app_code>/change', apps.form_setting.AppFormSettingView.as_view(), name='change.form.app'),
    path('<str:app_code>/change/authority', apps.authority_setting.AppAuthoritySettingView.as_view(), name='change.authority.app'),
    path('<str:app_code>/delete', apps.delete.DeleteAppView, name='delete.app'),
    path('<str:app_code>/view', apps.view.ViewAppView.as_view(), name='view.app'),
]

# List Table Management
list_patterns = [
    path('', list_tables.list.ListTableView.as_view(), name='index.list_table'),
    path('add', list_tables.add.AddAppView.as_view(), name='add.list_table'),
    path('<str:app_code>/view', list_tables.view.ViewAppView, name='view.list_table'),
    path('<str:app_code>/change', list_tables.views_setting.AppViewsSettingView.as_view(), name='change.views.list_table'),
    path('<str:app_code>/change/authority', list_tables.authority_setting.AppAuthoritySettingView.as_view(), name='change.authority.list_table'),
    path('<str:app_code>/delete', list_tables.delete.DeleteAppView, name='delete.list_table'),
]

# User management
user_patterns = [
    #path('', users.index.ListUsersView, name='index.user'),
    path('', users.index.ListUsersView.as_view(), name='index.user'),
    path('<str:uuid>/view', users.viewUser, name='view.user'),
    path('add', users.AddUser.as_view(), name='add.user'),
    path('<str:uuid>/change', users.ChangeUser.as_view(), name='change.user'),
    path('<str:uuid>/delete', users.deleteUser, name='delete.user'),
]

# Authority management
authority_patterns = [
    path('', authority.ListAuthorityView.as_view(), name='index.authority'),
    path('add', authority.add, name='add.authority'),
    path('<str:code>/change', authority.edit, name='edit.authority'),
    path('<str:code>/delete', authority.delete, name='delete.authority'),
]

# Contract plan management
contract_plan_patterns = [
    path('', plan.index, name='index.contract_plan'),
    path('add', plan.add, name='add.contract_plan'),
    path('<str:uuid>/change', plan.edit, name='edit.contract_plan'),
    path('<str:uuid>/delete', plan.delete, name='delete.contract_plan'),
]

# table management
table_patterns = [
    path('', table.ListTableView.as_view(), name='index.table'),
    path('add', table.add, name='add.table'),
    path('<str:data_code>/change', table.change, name='change.table'),
    path('<str:data_code>/delete', table.DeleteTableView.as_view(), name='delete.table'),
]

urlpatterns = [
    path('', home.IndexView, name='index'),
    path('set-language/', set_language, name="set.language"),
    path('login/', account.user_login, name='login'),
    path('admin/login/', account.user_login, name='login'),
    path('logout/', account.user_logout, name='logout'),
    path(
        'change-password/', 
         auth_views.PasswordChangeView.as_view(template_name='wysebone/change-password.html', success_url=reverse_lazy('password-change-done')),name='change-password'
        ),
    path(
        'password-change-done/', 
        auth_views.PasswordChangeDoneView.as_view(template_name='wysebone/password-change-done.html'),
        name='password-change-done'
        ),
    # Group management
    path('group/', include(group_patterns)),
    # App management
    path('app/', include(app_patterns)),
    path('applications/', apps.ApplicationsView.as_view(), name='applications'),
    path('list-table/', include(list_patterns)),
    path('profile/', account.user_profile, name='profile'),
    path('department/', include(department_patterns)),
    path('company-info/', company.CompanyInfo.as_view(), name='company.info'),
    path('user/', include(user_patterns)),
    path('permission/', include(authority_patterns)),
    path('plan/', include(contract_plan_patterns)),

    # Password reset link
    path('password_reset/done/', auth_views.PasswordResetCompleteView.as_view(template_name='registration/password_reset_done.html'),
    name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(template_name='registration/password_reset_confirm.html'), name='password_reset_confirm'),
    path('forgot-password/', auth_views.PasswordResetView.as_view(template_name='registration/password_reset_form.html', form_class=users_from.UserForgotPasswordForm), name='password_reset'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(template_name='registration/password_reset_complete.html'),
    name='password_reset_complete'),
    # Table management
    path('table/', include(table_patterns)),
    
    url(r'^uploads/(?P<path>.*)$', serve,{'document_root': settings.MEDIA_ROOT}), 
    url(r'^static/(?P<path>.*)$', serve,{'document_root': settings.STATIC_ROOT}),    
]
