from django import template
import os, re       
from django.conf import settings

register = template.Library()
                          
version_cache = {}
rx = re.compile(r"^(.*)\.(.*?)$")


@register.simple_tag
def version(path_string):                                                              
    try:
        if path_string in version_cache:
            mtime = version_cache[path_string]
            print('get_mtime_from_cache')
        else:
            print('get_mtime')
            mtime = os.path.getmtime('%s/%s' % (settings.BASE_DIR + settings.STATIC_URL, path_string,))
            version_cache[path_string] = mtime
            
        return '%s/%s' % (settings.BASE_DIR + settings.STATIC_URL, rx.sub(r"\1.%d.\2" % mtime, path_string))
    except:
        return '%s/%s' % (settings.BASE_DIR + settings.STATIC_URL, path_string)


@register.simple_tag
def define(val=None):
    return val


@register.simple_tag
def getAppMenus():
    """Get list of app by user's authority
        
    Returns
    -------
    menus: list of app menu by logged in user's authority

    Version
    -------
    1.0.2

    Author
    ------
    Dong Nguyen
    """
    
    from wysebone import constants
    from wysebone.auths import get_logged_in_user
    from wysebone.models.apps import App, AppAuthorityGroup, AppAuthorityUser
    
    # Get logged in user
    user = get_logged_in_user()
        
    return App.objects.filter(pk__in=user.get_apps(), company=user.company, type=constants.MENU, delete_flag=constants.DELETE_FLAG_ENABLE).order_by('name', 'pk')