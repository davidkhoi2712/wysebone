from wysebone.models.department import Department
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import status
from django.utils.translation import gettext_lazy as _
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.http import JsonResponse


class DepartmentUserView(APIView):
    
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        API get users from department
        GET department/:id/users
        
        Parameters pk
        ----------
        request: HttpRequest
            The Http request

        return: JsonResponse

        Version
        -------
        1.0.0

        Author
        ------
        Khoi Pham
        """

        User = get_user_model()

        if pk == 0:
            # Get users from department
            users = User.objects.filter(company=request.user.company).order_by('-created_at')

            # Return list users
            return JsonResponse({"users": self.get_user_json(users)})
        else:
            # Validate department
            try:
                department = Department.objects.get(pk=pk, company=request.user.company)
            except Department.DoesNotExist:
                return Response(
                    data={
                        "message": _('Department with id: %d does not exist.') % pk
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get users from department
            users = User.objects.filter(department=department).order_by('-created_at')

            # Return list users
            return JsonResponse({"users": self.get_user_json(users)})
        
    def get_user_json(self, users):
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
            lists.append({
                'user_id': user.user_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'role_name': user.role_name,
                'is_active': user.is_active,
            })
            
        return lists
        
