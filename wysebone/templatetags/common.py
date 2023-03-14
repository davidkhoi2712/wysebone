from django import template
from django.urls import reverse
from django.utils import formats
from django.utils.html import format_html
from inspect import getfullargspec
from wysebone import constants

register = template.Library()

DOT = '.'

class SetVariable(template.Node):
    def __init__(self, name, value):
        self.name = name
        self.value = value

    def render(self, context):
        context[self.name] = self.value.resolve(context, True)
        return ''


@register.tag(name='set')
def do_assign(parser, token):
    """
    set an expression to a variable in the current context.
    
    Syntax::
        {% set [name] [value] %}
    Example::
        {% set list entry.get_related %}
        
    """
    from re import split
    bits = split(r'\s+', token.contents, 2)

    if len(bits) != 3:
        raise template.TemplateSyntaxError(
            "'%s' tag takes two arguments" % bits[0])
    value = parser.compile_filter(bits[2])
    return SetVariable(bits[1], value)


@register.filter(name='get_modified_time')
def get_modified_time(file):
    """Returns a time of the last modified time of the file"""
    import os
    return os.stat(file)[-2]



@register.simple_tag
def pagination_number(cl, i):
    """
    Generate an individual page index link in a paginated list.
    """
    if i == DOT:
        return format_html('<li class="page-item"><span class="page-link">…</span></li>')
    elif i+1 == cl.number:
        return format_html('<li class="page-item {}"><span class="page-link">{}</span></li>', 'active', i + 1)
    else:
        return format_html(
            '<li class="page-item"><a class="page-link" href="{}?name={}&page={}&per_page={}">{}</a></li>',
            reverse(cl.path, args=([i+1] if i > 0 else '') ),
            cl.per_page,
            i + 1,
        )


class InclusionNode(template.library.InclusionNode):
    """
    Template tag that allows its template to be overridden per model, per app,
    or globally.
    """

    def __init__(self, parser, token, func, template_name, takes_context=True):
        self.template_name = template_name
        parse_bits = template.library.parse_bits
        params, varargs, varkw, defaults, kwonly, kwonly_defaults, _ = getfullargspec(func)
        bits = token.split_contents()
        args, kwargs = parse_bits(
            parser, bits[1:], params, varargs, varkw, defaults, kwonly,
            kwonly_defaults, takes_context, bits[0],
        )
        super().__init__(func, takes_context, args, kwargs, filename=None)

    def render(self, context):
        context.render_context[self] = context.template.engine.select_template([
            'wysebone/%s' % (self.template_name,),
        ])
        return super().render(context)



def pagination(cl, path, per_page=20):
    """
    Generate the series of links to the pages in a paginated list.
    """

    if not cl:
        return

    paginator, page_num = cl.paginator, cl.number

    ON_EACH_SIDE = 3
    ON_ENDS = 2

    # If there are 10 or fewer pages, display links to every page.
    # Otherwise, do some fancy

    if page_num >= paginator.num_pages:
        page_num = paginator.num_pages - 1


    if paginator.num_pages == 1:
        page_range = []
    elif paginator.num_pages <= 10:
        page_range = range(paginator.num_pages)
    else:
        # Insert "smart" pagination links, so that there are always ON_ENDS
        # links at either end of the list of pages, and there are always
        # ON_EACH_SIDE links at either end of the "current page" link.
        page_range = []
        if page_num > (ON_EACH_SIDE + ON_ENDS):
            page_range += [
                *range(0, ON_ENDS), DOT,
                *range(page_num - ON_EACH_SIDE, page_num + 1),
            ]
        else:
            page_range.extend(range(0, page_num + 1))
        if page_num < (paginator.num_pages - ON_EACH_SIDE - ON_ENDS - 1):
            page_range += [
                *range(page_num + 1, page_num + ON_EACH_SIDE + 1), DOT,
                *range(paginator.num_pages - ON_ENDS, paginator.num_pages)
            ]
        else:
            page_range.extend(range(page_num + 1, paginator.num_pages))
    
    cl.path = path
    cl.per_page = per_page

    return {
        'cl': cl,
        'page_range': page_range,
    }


@register.tag(name='pagination')
def pagination_tag(parser, token):
    return InclusionNode(
        parser, token,
        func=pagination,
        template_name='pagination.html',
        takes_context=False,
    )

@register.filter(name='property')
def property(obj, arg):
    return obj[arg]


@register.filter(name='constants')
def constant(name):
    return getattr(constants, name, "")   

@register.simple_tag
def call_method(obj, method_name, *args):
    method = getattr(obj, method_name)
    return method(*args)
    
@register.filter
def check_event_type(obj, arg):
    method = getattr(obj, 'check_event_type')
    return method(arg)  


@register.simple_tag
def getSidebarStatus():
    from wysebone.middleware import getCookie
    return getCookie('closed-sidebar', '')