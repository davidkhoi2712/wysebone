import base64
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponseRedirect, HttpResponse
from django.contrib import messages
from wysebone.forms.account import LoginForm
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils.translation import (
    LANGUAGE_SESSION_KEY, check_for_language, activate
)
from django.utils.http import is_safe_url
from django.urls.base import translate_url
from wysebone.forms.users import ProfileUserForm
from django.core.files.base import ContentFile
from django.contrib.auth.decorators import login_required
from django.utils import timezone, formats
from wysebone import dates

def user_login(request):
    # Get redirect URI
    next = request.POST.get('next', request.GET.get('next'))
    if not is_safe_url(url=next, allowed_hosts=request.get_host()):
        next = '/'

    # If user is authenticated and is staff, redirect to admin area
    if request.user.is_authenticated:
        if request.user.is_staff:
            next = '/admin'
        return HttpResponseRedirect(next)

    # Create Login form
    form = LoginForm()

    if request.method == "POST":
        form = LoginForm(request.POST)
        email = request.POST.get('email')
        password = request.POST.get('password')
        language =request.LANGUAGE_CODE
        user = authenticate(request, username=email, password=password)
        if form.is_valid():
            if user is not None and user.is_active:
                # Remove remember session if user don't check
                if not request.POST.get('remember', False):
                    request.session.set_expiry(0)

                # Force login
                login(request,user)

                # If user is admin, update redirect uri
                if user.is_staff:
                    next = '/admin'

                # Get redirect uri from language
                if language and check_for_language(language):
                    next_trans = translate_url(next, language)

                try:
                    user.language = language
                    user.save()
                except:
                    pass

                return HttpResponseRedirect(next_trans)
            else:
                form.add_error(None, _('The email address or password incorrect. Please try again.'))
    
    return render(request, 'wysebone/external/login.html', {'form': form, 'next': next})


def user_logout(request):
    logout(request)
    return HttpResponseRedirect(reverse(settings.LOGOUT_REDIRECT_URL))


@login_required(login_url='/login')
def user_profile(request):
    """
    View and save profile user

    @since 1.0.0
    @version 1.0.0
    @author Sanh Nguyen
    """
    user = request.user

    if request.method == 'POST':
        form = ProfileUserForm(request.POST, instance=user)
        avatar = request.POST.get('avatar')
        language = request.POST.get('language')
        birthday = request.POST.get('birthday')
        
        # Validate data form
        if form.is_valid():
            user_form = form.save()

            if avatar:
                if user.avatar:
                    user.avatar.delete(save=True)
                try:
                    format, imgstr = avatar.split(';base64,')
                    ext = format.split('/')[-1]
                    data = ContentFile(base64.b64decode(imgstr), name='avatar.' + ext)
                    user_form.avatar = data
                except:
                    pass
            
            request.session['django_timezone'] = request.POST.get('time_zone')

            user_form.birthday = dates.locale_to_db(str(birthday))
            user_form.save()

            # Activate language
            activate(language)

            # Update language in session
            request.session[LANGUAGE_SESSION_KEY] = language

            # print success message
            messages.success(request, _('Your profile has been updated successfully.'))

            response = HttpResponseRedirect(reverse('profile'))
            response.set_cookie(
                settings.LANGUAGE_COOKIE_NAME, language,
                max_age=settings.LANGUAGE_COOKIE_AGE,
                path=settings.LANGUAGE_COOKIE_PATH,
                domain=settings.LANGUAGE_COOKIE_DOMAIN,
            )
            return response
        else:
            # print error message
            messages.error(request, _('Profile update failed.'))
    else:
        form = ProfileUserForm(initial={'phone': user.phone, 'email': user.email, 'last_name': user.last_name, 'first_name': user.first_name, 'birthday': user.birthday, 'time_zone': user.time_zone })

    return render(request, 'wysebone/user/profile.html', {'form': form, 'user': user})