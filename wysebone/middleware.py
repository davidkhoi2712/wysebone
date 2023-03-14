from threading import current_thread
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
import pytz
from django.http import HttpResponseRedirect
from django.utils.translation import (
    LANGUAGE_SESSION_KEY, activate, get_language
)
from django.conf import settings

_requests = {}
_cookies = {}

def get_current_user():
    t = current_thread()
    try:
        return _requests[t].user
    except:
        return None


def getCookie(name, default_value):
    t = current_thread()
    try:
        return _requests[t].COOKIES.get(name, str(default_value))
    except:
        return default_value


class RequestMiddleware(MiddlewareMixin):
    def process_request(self, request):
        _requests[current_thread()] = request


class TimezoneMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tzname = request.session.get('django_timezone')
        if tzname:
            timezone.activate(pytz.timezone(tzname))
        elif hasattr(request.user, 'time_zone'):
            timezone.activate(request.user.time_zone)
        else:
            timezone.deactivate()    

        return self.get_response(request)

class LanguageMiddleware:
    """ Process language request

    Descripton: 
    Process language request

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            user = get_current_user()
            if user:
                # Activate language
                activate(user.language)

                # Update language in session
                request.session[LANGUAGE_SESSION_KEY] = user.language
                response = self.get_response(request)
                response.set_cookie(
                    settings.LANGUAGE_COOKIE_NAME, user.language,
                    max_age=settings.LANGUAGE_COOKIE_AGE,
                    path=settings.LANGUAGE_COOKIE_PATH,
                    domain=settings.LANGUAGE_COOKIE_DOMAIN,
                )
                return response
        return self.get_response(request)

class NotAllowSuperUserOnly(MiddlewareMixin):
    """ Process_request

    Descripton: 
    User is staff will redirect admin

    Version
    -------
    1.0.0

    Author
    ------
    Khoi Pham
    """
    def process_request(self, request):
        if request.user.is_authenticated:
            if not request.path.startswith('/admin/'):
                if request.user.is_staff:
                    return HttpResponseRedirect('/admin')