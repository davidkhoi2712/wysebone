from django.shortcuts import render
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required, permission_required
from wysebone.models.apps import App
from wysebone import constants
from django.http import HttpResponseRedirect
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.views.pagination import Pagination

class ListTableView(PermissionRequiredMixin, View, Pagination):
    permission_required = 'wysebone.view_list_table'
    
    def get(self, request):
        """Reder New App form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.1

        Author
        ------
        Sanh Nguyen
        Khoi Pham
        Thanh Pham
        """
        
        list_table_name = request.GET.get('name','')
        
        if list_table_name:
            apps = App.objects.filter(company=request.user.company, name__icontains=list_table_name, type=constants.LIST_VIEW, delete_flag=constants.DELETE_FLAG_ENABLE).order_by('-updated_at', 'pk')
            list_table_path = "/list-table/?name="+list_table_name+'&'
        else:
            apps = App.objects.filter(company=request.user.company, type=constants.LIST_VIEW, delete_flag=constants.DELETE_FLAG_ENABLE).order_by('-updated_at', 'pk')
            list_table_path = "/list-table/?"
        
        # Get per page from url
        self.get_per_page(request)
    
        # Get paginator from apps and per_page
        paginator = Paginator(apps, self.per_page)
        
        # Get page number
        self.get_page_number(request, paginator)
        
        # If need redirect to new uri
        if self.is_redirect:
            return HttpResponseRedirect(self.get_redirect_url(list_table_path))
        
        return render(request, 'wysebone/list_table/list.html', {
            'list_active': True,
            'objects': paginator.get_page(self.page_number),
            'list_table_name': list_table_name,
            'object_path': list_table_path,
            'object_target': 'list-table',
            'object_per_page': self.per_page
        })