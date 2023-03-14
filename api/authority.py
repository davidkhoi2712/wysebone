from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import status
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.http import JsonResponse
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Group
from wysebone.models.apps import App, AppItems, AppAuthorityGroup, AppAuthorityUser, ItemAuthority
from django.db.models.expressions import RawSQL
from wysebone import constants
from rest_framework.response import Response
from django.contrib import messages
from wysebone.models.item_type import ItemType
from wysebone.models.authority import Authority
from wysebone import alert
from django.utils.html import escape
from django.db import transaction
import json


class AuthorityView(APIView):

    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, app_code):
        """
        API get users from group
        GET app/<str:app_id>/authority
        
        Parameters
        ----------
        request: HttpRequest
            The Http request
        app_code: str
            The app APP_CODE

        return: Response

        Version
        -------
        1.0.2

        Author
        ------
        Khoi Pham
        Dong Nguyen
        """

        # User model
        User = get_user_model()

        # Get all authority
        all_authority = Authority.objects.filter(company=request.user.company)
        list_authority = list()
        for authority in all_authority:
            row = dict()
            row['code'] = authority.code
            row['name'] = authority.name

            # Create list groups
            try:
                auth_group = Group.objects.filter(company=request.user.company, app_permissions=authority)
                list_group = []
                for group in auth_group:
                    row1 = dict()
                    row1['name'] = escape(group.name)
                    row1['uuid'] = group.uuid
                    list_group.append(row1)
                row['groups'] = list_group
            except:
                row['groups'] = None

            # Create list users
            try:
                auth_user = User.objects.filter(company=request.user.company, app_permissions=authority)
                list_user = []
                for user in auth_user:
                    row1 = dict()
                    row1['first_name'] = escape(user.first_name)
                    row1['last_name'] = escape(user.last_name)
                    row1['user_id'] = user.user_id
                    list_user.append(row1)
                row['users'] = list_user
            except:
                row['users'] = None

            list_authority.append(row)

        # Check mode app
        mode_type = request.GET.get('type', None)
        app_mode = [constants.ENTRY_FORM, constants.MENU]
        if mode_type != None:
            app_mode = [constants.LIST_VIEW,]
        # Validate app
        try:
            # Get property app
            app = App.objects.get(code=app_code, company=request.user.company, type__in=app_mode, delete_flag=constants.DELETE_FLAG_ENABLE)
            
            # Get Authority settings
            authority_selected = []
            # For groups get authority
            for app_auth_group in app.app_authority_group.all().order_by('authority_id'):
                if app_auth_group.authority.code not in authority_selected:
                    authority_selected.append(app_auth_group.authority.code)

            # For users get authority
            for app_auth_user in app.app_authority_user.all().order_by('authority_id'):
                if app_auth_user.authority.code not in authority_selected:
                    authority_selected.append(app_auth_user.authority.code)


            selected = list()
            if len(authority_selected) > 0:
                # For authority
                for authority_code in authority_selected:
                    authority = Authority.objects.get(code=authority_code, company=request.user.company)

                    row = dict()
                    row['authority_id'] = authority_code
                    row['authority_name'] = escape(authority.name)

                    try:
                        # Get list group
                        auth_groups = AppAuthorityGroup.objects.filter(app=app, authority=authority)
                        list_groups = []
                        for item in auth_groups:
                            row1 = dict()
                            row1['name'] = escape(item.group.name)
                            row1['uuid'] = item.group.uuid
                            list_groups.append(row1)
                        row['group_selected'] = list_groups
                    except:
                        row['group_selected'] = None

                    try:
                        # Get list user
                        auth_users = AppAuthorityUser.objects.filter(app=app, authority=authority)
                        list_users = []
                        for item in auth_users:
                            row1 = dict()
                            row1['first_name'] = escape(item.user.first_name)
                            row1['last_name'] = escape(item.user.last_name)
                            row1['user_id'] = item.user.user_id
                            list_users.append(row1)
                        row['user_selected'] = list_users
                    except:
                        row['user_selected'] = None

                    # Get list app items and item setting
                        app_item = AppItems.objects.filter(app=app, company=request.user.company).order_by('item_json__top', 'item_json__left')
                    if mode_type != None:
                        app_item = AppItems.objects.filter(app=app, company=request.user.company).order_by('index')
                    
                    items = []
                    for app_item in app.items.all():
                        row1 = dict()
                        row1['code'] = app_item.code
                        mode = None
                        for item in app_item.app_items_authority.all():
                            if item.authority.code == authority_code:
                                mode = item.item_mode
                        row1['mode'] = mode
                        items.append(row1)
                    row['items'] = items

                    # append row to selected
                    selected.append(row)

        except:
            return Response(
                data={
                    "message":_("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('Authority'), 'key': app_code}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        appItems = app.items.all().values('id', 'table_item', 'code', 'name', 'attribute', 'index').order_by('item_json__top', 'item_json__left')
        if mode_type != None:
            appItems = app.items.all().values('id', 'table_item', 'code', 'name', 'attribute', 'index').order_by('index')
        itemTypes = ItemType.objects.values('id', 'name')
        # Return list users
        return Response({"authority": list_authority, 'appItems': appItems, 'itemTypes': itemTypes, 'selected': selected})

    def put(self, request, app_code):
        """
        API put authority
        PUT app/<str:app_id>/authority
        
        Parameters
        ----------
        request: HttpRequest
        app_code: str

        return: Response

        Version
        -------
        1.0.2

        Author
        ------
        Khoi Pham
        Dong Nguyen
        """
        
        mode_type = request.GET.get('type', None)
        name_mode = _('Application')
        app_mode = [constants.ENTRY_FORM, constants.MENU]
        link_edit = 'change.authority.app'
        if mode_type != None:
            name_mode = _('List Table')
            app_mode = [constants.LIST_VIEW,]
            link_edit = 'change.authority.list_table'

        try:
            app = App.objects.get(code=app_code, company=request.user.company, type__in=app_mode, delete_flag=constants.DELETE_FLAG_ENABLE)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': name_mode, 'key': app_code})
            
            return Response(
                data={
                    "message": _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': name_mode, 'key': app_code}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Validation app
        if App.objects.filter(name=request.data['app_name'], type__in=app_mode, company=request.user.company, delete_flag=constants.DELETE_FLAG_ENABLE).exclude(pk=app.pk).exists():
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.'),
                    "name": _('The %s name has been created in the system. Please choose another name.') % name_mode
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update property for app
        app.name = request.data['app_name']
        app.icon = request.data['app_icon']
        app.color = request.data['app_color']
            
        # New items from request
        items = request.data['items']

        User = get_user_model()

        try:
            with transaction.atomic():
                app.save()
                if items:

                    app_auth = AppAuthorityGroup.objects.filter(app=app)
                    old_authority = []
                    for value in app_auth:
                        if value.authority.code not in old_authority:
                            old_authority.append(value.authority.code)

                    new_authority = []
                    for item in items:
                        # Add authority to compare
                        if item['authority'] not in new_authority:
                            new_authority.append(item['authority'])

                        # Get authority
                        authority = Authority.objects.get(code=item['authority'], company=request.user.company)
                        app_auth_group = AppAuthorityGroup.objects.filter(app=app, authority=authority)
                        if item['groups'] != None:
                            list_group = []
                            for value in app_auth_group:
                                if value.group != None:
                                    list_group.append(value.group.uuid)

                            # Create new node group
                            for item_new in list(set(item['groups']) - set(list_group)):
                                group = Group.objects.get(uuid=item_new, company=request.user.company)
                                AppAuthorityGroup.objects.create(
                                    app=app,
                                    authority=authority,
                                    group=group,
                                    created_by=request.user
                                )
                            
                            # Remove node group
                            for item_old in list(set(list_group) - set(item['groups'])):
                                for value in app_auth_group:
                                    if value.group.uuid == item_old:
                                        value.delete()
                        else:
                            for value in app_auth_group:
                                value.delete()

                        app_auth_user = AppAuthorityUser.objects.filter(app=app, authority=authority)
                        if item['users'] != None:
                            list_user = []
                            for value in app_auth_user:
                                if value.user != None:
                                    list_user.append(value.user.user_id)
                            
                            # Create new node user
                            for item_user_new in list(set(item['users']) - set(list_user)):
                                user = User.objects.get(user_id=item_user_new, company=request.user.company)
                                AppAuthorityUser.objects.create(
                                    app=app,
                                    authority=authority,
                                    user=user,
                                    created_by=request.user
                                )

                            # Remove node user
                            for item_user_old in list(set(list_user) - set(item['users'])):
                                for value in app_auth_user:
                                    if value.user.user_id == item_user_old:
                                        value.delete()
                        else:
                            for value in app_auth_user:
                                value.delete()

                        # For item
                        for value in item['items']:
                            app_item = AppItems.objects.get(code=value['id'], company=request.user.company, app=app)
                            try:
                                item_authority = ItemAuthority.objects.get(item=app_item, authority=authority)
                                item_authority.item_mode = value['mode']
                            except:
                                item_authority = ItemAuthority.objects.create(
                                    item=app_item,
                                    authority=authority,
                                    item_mode=value['mode'],
                                    created_by=request.user
                                )

                            # Commit item Authority
                            item_authority.save()

                    # Remove authority when not use
                    for item_remove in list(set(old_authority) - set(new_authority)):
                        # Get authority
                        authority = Authority.objects.get(code=item_remove, company=request.user.company)
                        
                        # Delete app authority group
                        app_auth_group = AppAuthorityGroup.objects.filter(app=app, authority=authority)
                        for value in app_auth_group:
                            value.delete()

                        # Delete app authority user
                        app_auth_user = AppAuthorityUser.objects.filter(app=app, authority=authority)
                        for value in app_auth_user:
                            value.delete()

                        # Delete app items authority
                        for app_item in app.items.all():
                            for item1 in app_item.app_items_authority.all():
                                if item1.authority.code == item_remove:
                                    item1.delete()

        except Exception:
            transaction.rollback()
            return Response(
                data={
                    "message": _('An error occurred while processing. Please try again later.')
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        messages.success(request, alert.changed_successfully(
            category=name_mode,
            url_name=link_edit,
            url_args=(app.code,),
            obj_name=app.name
        ))

        return Response({'received': items})