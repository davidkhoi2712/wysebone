from django.shortcuts import render
from django.utils.translation import gettext_lazy as _
from django.db import transaction, IntegrityError
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views import View
from wysebone.utils import get_countries
from wysebone.forms.companies import CompanyInfoForm
from wysebone.models.companies import Company
from wysebone.models.plans import Plan
from django.contrib import messages
from wysebone import dates


class CompanyInfo(PermissionRequiredMixin, View):
    permission_required = 'wysebone.view_company_info'

    def get(self, request):
        """Company info form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.0

        Author
        ------
        Pham Ngoc Thanh
        """

        # Get company info
        company = request.user.company

        # Create form
        form = CompanyInfoForm(initial={
            'name': company.name,
            'country': company.country,
            'street': company.street,
            'city': company.city,
            'state': company.state,
            'postal_code': company.postal_code,
            'size': company.size,
            'phone': company.phone,
            'domain_name': company.domain_name,
        }, auto_id=False)

        return render(request, 'wysebone/company/info.html', {
            'form': form,
            'company': company,
            'company_active': 'active',
        })

    def post(self, request):
        """Post company info form
    
        Parameters
        ----------
        request: HttpRequest

        Version
        -------
        1.0.0

        Author
        ------
        Pham Ngoc Thanh
        """

        # Get company info
        company = request.user.company
        
        # Create form
        form = CompanyInfoForm(request.POST, instance=company)

        if form.is_valid():
            try:
                form.save()
                messages.success(request, _('Updated successfully.'))
            except:
                messages.error(request, _('An error occurred while processing. Please try again later.'))
        else:
            # print error message
            messages.error(request, _('Please correct the errors below.'))

        return render(request, 'wysebone/company/info.html', {
            'form': form,
            'company': company,
            'company_active': 'active',
        })