from django.urls import path, re_path, include
from api.department import DepartmentUserView
from api.group import GroupUserView
from api.authority import AuthorityView
from api.app import AppView, AppListUpdate
from api.list_table import ListTableView
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'apps', AppListUpdate, basename="apps")

urlpatterns = [
    path('', include(router.urls)),
    path('department/<int:pk>/users', DepartmentUserView.as_view(), name="get-user-from-department"),
    path('group/<str:uuid>/users', GroupUserView.as_view(), name="get-user-from-group"),
    path('app/<str:app_code>/authority', AuthorityView.as_view(), name="put-authority"),
    path('app/<str:app_code>', AppView.as_view(), name="put-app"),
    path('list-table/<str:app_code>', ListTableView.as_view(), name="put-list-table"),
]
