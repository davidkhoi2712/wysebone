var Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 5000,
});

const ENTRY_FORM = 1;
const LIST_VIEW = 2;

function Authority() {
    var self = this;
    this.app_code = $('#app_code').val();
    this.app_type = $('#app_type').val();
    this.objects = {};
    this.table_row = new TableManagement();

    /**
     * Get data from server
     * @version 1.0.1
     */
    this.get_data_from_server = function() {
        // Get data from API
        let url = 'app/' + self.app_code + '/authority';
        if (self.app_type == LIST_VIEW) {
            url = 'app/' + self.app_code + '/authority?type=list_table';
        }
        api({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function(data, text) {
                $('.spinner').addClass('d-none');
                self.objects = data;
                // Call event
                self.set_event();
                self.display_app_items();
            },
            error: function(request, status, error) {
                alert(request.responseJSON.message);
            }
        });
    }

    /**
     * Display app items
     * @version 1.0.1
     */
    this.display_app_items = function() {
        if (self.objects.selected.length > 0) {
            // For each data set active selected
            $.each(self.objects.selected, function(key, value) {
                let option = { 'id': value.authority_id, 'name': value.authority_name, 'objects': self.objects };
                let data = { 'id': value.authority_id, 'name': value.authority_name, 'groups': value.group_selected, 'users': value.user_selected };
                self.table_row.create(option, data, value.items);
                self.event_multiselect();
                if ($('#' + value.authority_id)) {
                    $('#' + value.authority_id).prop("checked", true);
                }
            });
        }
    }

    /**
     * Set objects
     * @version 1.0.1
     */
    this.set_event = function() {
        // Event choose authority
        $('#list-authority input[type="checkbox"]').on('change', function() {
            let option = { 'id': $(this).attr('id'), 'name': escapeHtml($(this).data('text')), 'objects': self.objects };

            if ($(this).is(':checked')) {
                // Create node
                self.table_row.create(option, self.get_groups_user($(this).attr('id')), []);
                self.event_multiselect();
            } else {
                // Delete node
                self.table_row.delete(option);
            }

            // Enable edit
            is_edited = true;
        });

        // Event change item mode
        $(document).on('change', '#item-settings tbody tr td select.form-control', function() {
            self.table_row.change_mode_item($(this).attr('code'), $(this).data('code'), Number($(this).val()));

            // Enable edit
            is_edited = true;
        });
    }

    /**
     * Validate
     * @version 1.0.1
     */
    this.validate = function() {
        let name = gettext('Application');
        if (self.app_type == LIST_VIEW) {
            name = gettext('List Table');
        }

        // Validate if empty
        if ($('#authority-settings tbody tr').length == 1) {
            if ($('#authority-settings tbody tr').eq(0).attr('id') == undefined) {
                alert(interpolate(gettext('Please set up at least a authority for the %s.'), [name]));
                return false;
            }
        }

        if ($('#item-settings tbody tr').length == 1) {
            if ($('#item-settings tbody tr').eq(0).attr('id') == undefined) {
                if (confirm(interpolate(gettext('Please set up items for %s to set up authority.'), [name]))) {
                    if (self.app_type == LIST_VIEW) {
                        window.location.href = base_url + '/list-table/' + self.app_code + '/change';
                        return false;
                    } else {
                        window.location.href = base_url + '/app/' + self.app_code + '/change';
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        // Validate check groups item
        let check = true;
        $('#authority-settings tbody tr').find('select[name="groups"]').each(function(index) {
            if ($(this).val() != null) {
                check = false;
            }
        });
        // Validate check users item
        $('#authority-settings tbody tr').find('select[name="users"]').each(function(index) {
            if ($(this).val() != null) {
                check = false;
            }
        });

        // Show message error
        if (check) {
            alert(interpolate(gettext('Please set up at least a %s or a %s for authority.'), [gettext('Group'), gettext('User')]));
            return false;
        }

        return true;
    }

    /**
     * Submit form
     * @version 1.0.1
     */
    this.submit_event = function() {
        // Event submit form
        $("#app_settings").submit(function(e) {

            // check validate
            if (!self.validate()) {
                $("#app_settings").find("[type='submit']").attr("disabled", false);
                return false;
            }

            var data = [];
            // Loop each rows to get items
            $('#authority-settings tbody').find('tr').each(function(index) {
                var item = $(this);
                let permission = item.find('input[name="permissions"]').val();
                let groups = item.find('select[name="groups"]').val();
                let users = item.find('select[name="users"]').val();
                data.push({ 'authority': permission, 'groups': groups, 'users': users, 'items': self.table_row.get_item_mode(permission) });
            });

            // Information app
            let app_name = $('#app_name').val();
            let app_icon = $('#app_icon').val();
            let app_color = $('#app_color').val();

            // Validate application name
            if ($.trim(app_name) == '') {
                $('#app_name').addClass('is-invalid');
                $('#sub_appname').hide();
                let error = '<div class="invalid-feedback">' + interpolate(gettext('The %s field is required.'), [gettext('Application name')]) + '</div>';
                $('#app_name').parent().find('div.invalid-feedback').remove();
                $('#app_name').parent().append(error);
                $('#app_name').val($.trim(app_name));
                $('[type="submit"]').prop('disabled', false);
                return false;
            }

            $('.spinner').removeClass('d-none');

            let url = 'app/' + self.app_code + '/authority';
            if (self.app_type == LIST_VIEW) {
                url = 'app/' + self.app_code + '/authority?type=list_table';
            }

            // Put data to server
            api({
                type: 'PUT',
                url: url,
                dataType: 'json',
                data: JSON.stringify({
                    'items': data,
                    'app_name': $.trim(app_name),
                    'app_icon': app_icon,
                    'app_color': app_color
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                success: function(data) {
                    if (next_uri == '') {
                        if (self.app_type == LIST_VIEW) {
                            window.location.href = base_url + '/list-table';
                        } else {
                            window.location.href = base_url + '/app';
                        }
                    } else {
                        window.location.href = base_url + next_uri;
                    }
                },
                error: function(response, status, error) {
                    $('.spinner').addClass('d-none');
                    $("#app_settings").find("[type='submit']").attr("disabled", false);

                    if (typeof(response.responseJSON) == 'undefined') {
                        Toast.fire({
                            title: gettext('An error occurred while processing. Please try again later.')
                        });
                    } else {
                        if (response.status == 404) {
                            if (self.app_type == LIST_VIEW) {
                                window.location.href = base_url + '/list-table';
                            } else {
                                window.location.href = base_url + '/app';
                            }
                        } else {
                            if (response.responseJSON.name != undefined) {
                                $('#app_name').addClass('is-invalid');
                                $('#sub_appname').hide();
                                let error = '<div class="invalid-feedback">' + response.responseJSON.name + '</div>';
                                $('#app_name').parent().find('div.invalid-feedback').remove();
                                $('#app_name').parent().append(error);
                                $('#app_name').val($.trim(app_name));
                            } else {
                                Toast.fire({
                                    title: response.responseJSON.message
                                });
                            }
                        }
                    }
                }
            });

            return false;
        });
    }

    /**
     * Get groups and users for authority
     * @version 1.0.1
     */
    this.get_groups_user = function(id) {
        let result = null;
        $.each(self.objects.authority, function(key, value) {
            if (value.code == id) {
                result = { 'groups': value.groups, 'users': value.users };
            }
        });
        return result;
    }

    /**
     * Event multiselect
     * @version 1.0.1
     */
    this.event_multiselect = function() {
        // Multiselect
        $('.multiple').each(function() {
            $(this).select2({
                theme: 'bootstrap4',
                width: 'style',
                placeholder: $(this).attr('placeholder'),
                allowClear: Boolean($(this).data('allow-clear'))
            });
        });
    }

    this.init = function() {
        // loading
        $('.spinner').removeClass('d-none');
        self.submit_event();
        self.get_data_from_server();
    }

    this.init();
}

$(function() {
    new Authority();
});

// Function EScape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}