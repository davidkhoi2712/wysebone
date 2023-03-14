from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import status
from django.utils.translation import gettext_lazy as _
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.http import JsonResponse
from django.contrib.auth.models import Group
from django.utils.html import escape

class GroupUserView(APIView):
    
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        """
        API get users from group
        GET group/<str:uuid>/users
        
        Parameters
        ----------
        request: HttpRequest
            The Http request
        uuid: str
            The group UUID

        return: JsonResponse

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        try:
            group = Group.objects.get(uuid=uuid, company=request.user.company)
        except:
            return Response(
                data={
                    "message": _('Group with id: %d does not exist.') % uuid
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # User model
        User = get_user_model()

        # Get users from group
        users = User.objects.filter(groups=group, company=request.user.company).order_by('-created_at')

        # Return list users
        return JsonResponse({"users": self.get_user_json(request, users)})
        
    def get_user_json(self, request, users):
        """ Get users JSOn ""
        
        Parameters
        ----------
        users: query_set

        Returns
        -------
        JSON

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """
        
        lists = []

        for user in users:
            # Get list role
            list_role = list()
            for role in user.roles.all():
                list_role.append(_(role.name))

            # Check user loggin is dynastyle admin
            if request.user == user and request.user.is_dynastyle_admin:
                user.is_dynastyle_admin = False

            # Append item
            lists.append({
                'user_id': user.user_id,
                'first_name': escape(user.first_name),
                'last_name': escape(user.last_name),
                'email': user.email,
                'role_name': list_role,
                'is_active': user.is_active,
                'is_admin': user.is_dynastyle_admin,
            })
            
        return lists
