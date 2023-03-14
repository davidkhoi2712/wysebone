from django.shortcuts import render
from django.contrib.auth.decorators import permission_required, login_required
from django.utils.translation import gettext_lazy as _
from wysebone.models.companies import Company


@login_required(login_url='/login')
@permission_required('wysebone.view_company', raise_exception=True)
def ListCompanyView(request):
    """List company
    
    Parameters
    ----------
    request: HttpRequest
        The Http request

    Version
    -------
    1.0.0

    Author
    ------
    Dong Nguyen
    """

    # Get list of company
    companies = Company.objects.all().order_by('-created_at')

    return render(request, 'wysebone/company/index.html', {
        'companies': companies,
        'company_active': 'active',
    })