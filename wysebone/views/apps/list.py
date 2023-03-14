from django.shortcuts import render, reverse
from django.core.paginator import Paginator
from wysebone.models.apps import App
from wysebone import constants
from django.http import HttpResponseRedirect
import datetime
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.views.pagination import Pagination

class ListAppView(PermissionRequiredMixin, View, Pagination):
    permission_required = 'wysebone.view_app'
    
    def get(self, request):
        """Reder New App form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.2

        Author
        ------
        Thanh Pham
        Khoi Pham
        """

        app_name = request.GET.get('name','')
        
        if app_name:
            apps = App.objects.filter(company=request.user.company, name__icontains=app_name, type__in=[constants.ENTRY_FORM, constants.MENU], delete_flag=constants.DELETE_FLAG_ENABLE).order_by('-updated_at', 'pk')
            app_path = "/app/?name="+app_name+'&'
        else:
            apps = App.objects.filter(company=request.user.company, type__in=[constants.ENTRY_FORM, constants.MENU], delete_flag=constants.DELETE_FLAG_ENABLE).order_by('-updated_at', 'pk')
            app_path = "/app/?"
        
        # Get per page from url
        self.get_per_page(request)
    
        # Get paginator from apps and per_page
        paginator = Paginator(apps, self.per_page)
        
        # Get page number
        self.get_page_number(request, paginator)
        
        # If need redirect to new uri
        if self.is_redirect:
            return HttpResponseRedirect(self.get_redirect_url(app_path))
        
        return render(request, 'wysebone/app/list.html', {
            'app_active': True,
            'objects': paginator.get_page(self.page_number),
            'app_name': app_name,
            'object_path': app_path,
            'object_target': 'app',
            'object_per_page': self.per_page
        })