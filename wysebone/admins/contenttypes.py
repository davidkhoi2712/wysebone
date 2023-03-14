from django.utils.translation import gettext_lazy as _
from django.contrib import admin

class ContentTypeAdmin(admin.ModelAdmin):
    list_display  = ('name', 'codename', 'icon', 'description',)
    search_fields = ['name', 'codename']
    ordering = ('name',)