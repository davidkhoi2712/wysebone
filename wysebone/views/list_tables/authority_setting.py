from django.shortcuts import render
from django.shortcuts import render
from django.utils.translation import gettext_lazy as _
from django.contrib import messages
from wysebone.views.list_tables.change import ChangeAppView
from wysebone.models.authority import Authority
from wysebone.models.apps import App
from wysebone import constants
from wysebone.utils import get_next_url
from django.http import HttpResponseRedirect


class AppAuthoritySettingView(ChangeAppView):
    """Authority tab settings class

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    Khoi Pham
    """

    def get(self, request, app_code):
        """Authority tab settings
    
        Parameters
        ----------
        request: HttpRequest
        app_code: str

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        Khoi Pham
        """

        next = get_next_url(request, '/list-table')

        # Get app from code
        try:
            self.app = App.objects.get(code=app_code, type=constants.LIST_VIEW, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('List Table'), 'key': app_code})
            return HttpResponseRedirect(next)

        # Render data from super class
        render_data = self.get_render()
        
        # add authority
        render_data['add_authority'] = _('Add %s') % _('Authority')

        # Get list permission
        render_data['permissions'] = Authority.objects.filter(company=request.user.company).order_by('id')

        # Render http
        return render(request, 'wysebone/list_table/authority_setting.html', render_data)