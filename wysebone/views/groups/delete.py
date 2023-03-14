from django.shortcuts import render
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from django.db import transaction
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.contrib.auth.models import Group


class DeleteGroupView(PermissionRequiredMixin, View):
    permission_required = 'auth.delete_group'

    # Group object
    group = None

    def get(self, request, uuid):
        """Change group form
    
        Parameters
        ----------
        request: HttpRequest
        uuid: str
            The uuid of group

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        # Get group from uuid
        self.get_group(request, uuid)

        return render(request, 'wysebone/delete_confirmation.html', {
            'name': _('group'),
            'obj': self.group.name,
            'group_active': 'active',
        })

    def post(self, request, uuid):
        """Post change group form
    
        Parameters
        ----------
        request: HttpRequest
        uuid: str
            The uuid of group

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        # Get group from uuid
        self.get_group(request, uuid)

        try:
            with transaction.atomic():
                # Cache group name before delete
                group_name = self.group.name

                # Delete group
                self.group.delete()

                # Display success message
                messages.success(request, _("The %(name)s \"%(obj)s\" was deleted successfully.") % {'name': _('group'), 'obj': group_name})
                return HttpResponseRedirect('/group')
        except:
            transaction.rollback()
            messages.error(request, _('An error occurred while processing. Please try again later.'))
            return render(request, 'wysebone/delete_confirmation.html', {
                'name': _('group'),
                'obj': self.group.name,
                'group_active': 'active',
            })

    def get_group(self, request, uuid):
        """Get group from uuid
        
        Parameters
        ----------
        uuid: str
            The uuid of group

        Version
        -------
        1.0.0

        Author
        ------
        Dong Nguyen
        """

        # Get group from uuid
        try:
            self.group = Group.objects.get(uuid=uuid, company=request.user.company)
        except:
            messages.error(request, _("%(name)s with ID \"%(key)s\" doesn't exist. Perhaps it was deleted?") % {'name': _('group').title(), 'key': uuid})
            return HttpResponseRedirect('/group')