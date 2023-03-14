var is_edited = false;
var next_uri = '';

jQuery(document).ready(function($) {
    $('#nav-tab a.nav-link').on('click', function(e) {
        e.preventDefault();
        var self = $(this);

        if (self.hasClass('active')) {
            return false;
        }

        if (!is_edited) {
            window.location.href = self.attr('href');
            return false;
        }

        if (confirm(interpolate(gettext('%s will be saved by moving to another tab?'), [$('#nav-tab a.active').html()]))) {
            next_uri = self.attr('href');
            let url = window.location.href + '?next=' + next_uri;
            $('#app_settings').attr('action', url);
            $('#app_settings').submit();
        } else {
            window.location.href = self.attr('href');
        }
    });
});