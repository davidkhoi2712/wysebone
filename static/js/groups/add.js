jQuery(document).ready(function($) {
    var search = gettext('Search')+'...'
    $("#permissions").multiselect({
        keepRenderingSort: true,
        search: {
            left: '\
                    <i class="fa fa-search icon"  aria-hidden="true"></i> \
                    <input type="text" name="q" class="input-field form-control form-control-sm float-right card-header" \
                    placeholder='+search+' /> \
               ',
            right: '\
                <i class="fa fa-search icon"  aria-hidden="true"></i> \
                <input type="text" name="q" class="input-field form-control form-control-sm float-right card-header" \
                placeholder='+search+' />  \
            ',
        },
        fireSearch: function(value) {
            return value.length > 2;
        }
    });
    $("#users").multiselect({
        keepRenderingSort: true,
        search: {
            left: '\
                    <i class="fa fa-search icon"  aria-hidden="true"></i> \
                    <input type="text" name="q" class="input-field form-control form-control-sm float-right card-header" \
                    placeholder='+search+' /> \
               ',
            right: '\
                <i class="fa fa-search icon"  aria-hidden="true"></i> \
                <input type="text" name="q" class="input-field form-control form-control-sm float-right card-header" \
                placeholder='+search+' />  \
            ',
        },
        fireSearch: function(value) {
            return value.length > 2;
        }
    });
});

