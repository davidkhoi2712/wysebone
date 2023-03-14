from django import template

register = template.Library()

VERSION_NUMBER = '1.0.2'

@register.simple_tag
def version_number():
    return VERSION_NUMBER