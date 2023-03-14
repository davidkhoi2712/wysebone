var itemTypes = [];
var inputProperty = [];

var Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 5000,
});

function ListView() {
    var self = this;
    this.is_new_app = $('#is_new_app').val();
    if (typeof(this.is_new_app) == 'undefined') {
        this.is_new_app = '0';
    }

    this.app_code = $('#app_id').val();
    if (this.is_new_app == '1') {
        this.app_code = '0';
    }

    this.app_items = [];
    this.canvas = $('#sortable');
    this.item_type = new ItemType();
    this.items_management = new ObjectManagement();
    this.table_management = new TableManagement(this);
    this.eventList = [];
    this.property = { name: $('#app_name').val(), field_code: 'List_table_01', inputs: [], events: [] };

    /**
     * Display app items
     * @version 1.0.2
     */
    this.display_app_items = function() {
        // Loop each app items
        if (self.app_items.length > 0) {
            $('#draggable-text').hide();
            $("#sortable").css('min-width', ((self.app_items.length + 1) * 190) + 'px');
        } else {
            $('#draggable-text').show();
        }

        $.each(self.app_items, function(index, item) {
            try {
                item.itemtype = self.item_type.filter(item.attribute__id);
                item.tableItem = self.table_management.filter_table_item(item.table_item);
                var obj_droper = self.items_management.create(self, item);
                obj_droper._item.append(obj_droper._content);
                self.canvas.append(obj_droper._item);

                // Disable item table
                $('#table_items_field option[value="' + item.table_item + '"]').prop('disabled', true);
            } catch (err) {
                console.log(err.message);
            }
        });

        self.sort_table();
    }

    /**
     * Set sortable, draggable and droppable event
     * @version 1.0.2
     */
    this.set_event = function() {
        // Sortable
        $('#sortable').sortable({
            cursor: 'move',
            placeholder: "draggable-hover",
            helper: "clone",
            receive: function(event, ui) {
                $("#sortable").css('width', '+=185px');
                $("#sortable").find('.dropdown-menu').removeClass('show');
                $('#draggable-text').hide();
                self.create_item(ui);

                is_edited = true;
            },
            stop: function(event, ui) {
                // sort table
                self.sort_table();
                is_edited = true;
            }
        }).disableSelection();

        $(".wb-drag-item:not(.ui-draggable-handle)").draggable({
            connectToSortable: "#sortable",
            helper: "clone",
            cursor: 'move',
            drag: function(event, ui) {
                self.create_shadown(ui);
            },
        });
    }

    /**
     * Create item
     * @version 1.0.2
     */
    this.create_item = function(ui) {
        let item = ui.helper;
        let itemtype = self.item_type.filter(parseInt($(item[0]).data('itemtype'), 10));
        var tableItem = self.table_management.filter_table_item(parseInt($(item[0]).data('table-item'), 10));

        if ($(item[0]).data('table-item') != undefined) {
            // Disable item table
            $('#table_items_field option[value="' + $(item[0]).data('table-item') + '"]').prop('disabled', true);
        }

        let option = {
            itemtype: itemtype,
            tableItem: tableItem
        }

        let obj_droper = self.items_management.create(self, option);

        // Disable draggable
        if (tableItem != null) {
            let pre_item = ui.item;
            $(pre_item).addClass('disabled');
            $(pre_item).draggable({ disabled: true });
            $(pre_item).attr('id', 'pre-' + obj_droper.id);
        }

        ui.placeholder.height('209px');
        ui.placeholder.width('183px');

        $(item).removeClass('list-group-item');
        $(item).removeClass('wb-drag-item');
        $(item).html(obj_droper._content);
        $(item).attr('id', obj_droper.id);
        $(item).attr('index', 0);
        $(item).removeAttr('data-name');
        $(item).removeAttr('data-img');
        item.css('height', 'auto');
        item.css('width', '185px');
    }

    /**
     * Create shadown
     * @version 1.0.0
     */
    this.create_shadown = function(ui) {
        let item = ui.helper;
        let html = '<img src="' + item.data('img') + '"><span class="ml-2">' + item.data('name') + '</span>';
        $(item).html(html);
        $(item).addClass('list-group-item');
        $(item).addClass('wb-drag-item');
        item.css('height', '48px');
        item.css('width', '228px');
        item.css('list-style', 'none');
    }

    /**
     * Validate
     * @version 1.0.2
     */
    this.validate = function() {

        // Validate table item is required
        var is_required = true;
        var tableItems = self.table_management.get_available_items();
        $.each(tableItems, function(index, item) {
            if (item.item_json.required) {
                if (self.items_management.filter({ 'tableItem_id': item.id.toString() }) == null) {
                    is_required = false;
                    Toast.fire({
                        title: interpolate(gettext('The %s field is required.'), [item.item_name])
                    });
                    return false;
                }
            }
        });

        if (!is_required) {
            return false;
        }

        return true;
    }

    /**
     * Submit form
     * @version 1.0.2
     */
    this.submit_event = function() {
        $("#app_settings").submit(function(e) {

            if (!self.validate()) {
                $("#app_settings").find("[type='submit']").attr("disabled", false);
                return false;
            }

            var items = [];
            // Loop each rows to get items
            $('#sortable li').each(function(index) {
                var item = $(this);
                var item_put = self.items_management.get_item_data(item.attr('id'));

                if (item_put != null) {
                    item_put.index = item.attr('index');
                    items.push(item_put);
                }
            });

            // Information app
            let app_name = $('#app_name').val();
            let app_icon = $('#app_icon').val();
            let app_color = $('#app_color').val();
            // Validate application name
            if ($.trim(app_name) == '') {
                $('#app_name').addClass('is-invalid');
                $('#sub_appname').hide();
                let error = '<div class="invalid-feedback">' + interpolate(gettext('The %s field is required.'), [gettext('List Table name')]) + '</div>';
                $('#app_name').parent().find('div.invalid-feedback').remove();
                $('#app_name').parent().append(error);
                $('#app_name').val($.trim(app_name));
                $('[type="submit"]').prop('disabled', false);
                return false;
            }

            $('.spinner').removeClass('d-none');
            api({
                type: 'PUT',
                url: 'list-table/' + self.app_code,
                dataType: 'json',
                data: JSON.stringify({
                    'items': items,
                    'tables': self.table_management.get_selected_tables_id(),
                    'app_name': $.trim(app_name),
                    'app_icon': app_icon,
                    'app_color': app_color,
                    'property': self.property,
                    'is_new_app': self.is_new_app
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                success: function(data) {
                    if (next_uri == '') {
                        window.location.href = base_url + '/list-table';
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
                        return false;
                    }

                    if (response.status == 404) {
                        window.location.href = base_url + '/list-table';
                        return false;
                    }

                    if (typeof(response.responseJSON.errors) != 'undefined') {
                        var errors = response.responseJSON.errors;

                        if (typeof(errors.name) != 'undefined') {
                            $('#app_name').addClass('is-invalid');
                            $('#sub_appname').hide();
                            $('#app_name').parent().find('div.invalid-feedback').remove();
                            $('#app_name').parent().append('<div class="invalid-feedback">' + errors.name[0] + '</div>');
                            $('#app_name').val($.trim(app_name));
                            return false;
                        } else {
                            $('#app_name').removeClass('is-invalid');
                            $('#sub_appname').show();
                            $('#app_name').parent().find('div.invalid-feedback').remove();
                        }

                        if (typeof(errors.tables) != 'undefined') {
                            Toast.fire({
                                title: errors.tables[0]
                            });
                            return false;
                        }

                        if (typeof(errors.icon) != 'undefined') {
                            Toast.fire({
                                title: errors.icon[0]
                            });
                            return false;
                        }

                        if (typeof(errors.color) != 'undefined') {
                            Toast.fire({
                                title: errors.color[0]
                            });
                        }

                        return false;
                    }

                    Toast.fire({
                        title: response.responseJSON.message
                    });
                }
            });
            return false;
        });
    }

    /**
     * Get data from server
     * @version 1.0.0
     */
    this.get_data_from_server = function() {
        $('.spinner').removeClass('d-none');

        api({
            type: 'GET',
            url: 'list-table/' + self.app_code,
            dataType: 'json',
            data: { is_new_app: self.is_new_app },
            success: function(data) {
                $('.spinner').addClass('d-none');

                itemTypes = data.itemTypes;
                self.eventList = data.eventList;
                self.app_items = data.appItems;
                inputProperty = data.input;

                if (data.property != null) {
                    self.property = data.property;
                }

                // All tables in DB
                self.table_management.tableList = data.tableList;

                // Update selected tables
                self.table_management.updateTableSelected(data.appTables);

                // Update the items added into app
                self.display_app_items();
            },
            error: function(response, status, error) {
                alert(gettext('An error occurred while processing. Please try again later.'));
                window.location.href = base_url + '/list-table';
            }
        });
    }

    this.init = function() {
        self.submit_event();
        self.get_data_from_server();
        $('#view-property').on('click', function() {
            let property = new Property(self, { 'input': inputProperty });
        });
    }

    this.init();

    /**
     * Sort Item
     * @version 1.0.0
     */
    this.sort_table = function() {
        for (let i = 0; i < $('#sortable li').length; i++) {
            $('#sortable li').eq(i).find('.label-preName').text(self.columnName(i));
            $('#sortable li').eq(i).attr('index', i);
        }
    }

    /**
     * Generate header for table
     * @version 1.0.0
     */
    this.columnName = function(i) {
        var letter = '';

        if (i > 701) {
            letter += String.fromCharCode(64 + parseInt(i / 676));
            letter += String.fromCharCode(64 + parseInt((i % 676) / 26));
        } else if (i > 25) {
            letter += String.fromCharCode(64 + parseInt(i / 26));
        }

        letter += String.fromCharCode(65 + (i % 26));

        return letter;
    }

    /**
     * Get list of table items selected
     * @version 1.0.0
     */
    this.get_tableItems = function() {
        var tableItems = [];
        $.each(self.items_management.items, function(index, item) {
            if (item.tableItem_id != '') {
                tableItems.push(parseInt(item.tableItem_id, 10));
            }
        });

        return tableItems;
    }

    /**
     * Check item is draggable
     * @version 1.0.0
     */
    this.verify_draggable = function() {
        // Get list of table items
        var tableItems = self.get_tableItems();

        $('.wb-drag-item').each(function(index) {
            var item = $(this);
            var tableitem_id = item.data('table-item');
            if (typeof(tableitem_id) == 'undefined') {
                return true;
            }

            if (jQuery.inArray(tableitem_id, tableItems) == -1) {
                item.draggable("enable");
                item.removeClass('disabled');
            } else {
                item.draggable("disable");
            }
        });
    }

    this.disabled_selected_options = function(tableItem_id) {
        var tableItems = self.get_tableItems();

        $('#table_items_field').find('option').each(function(index) {
            var option = $(this);
            var value = parseInt(option.val(), 10);

            if (value == tableItem_id || jQuery.inArray(value, tableItems) == -1) {
                option.prop('disabled', false);
            } else {
                option.prop('disabled', true);
            }
        });
    }

    this.display_field_code = function() {
        let html = ' <div class="row form-group"> ' +
            '     <div class="col-md-6"> ' +
            '         <label for="field_code_field"><b>' + gettext("Field Code") + '</b> <b class="text-danger">*</b></label> ' +
            '         <input type="text" class="form-control" id="field_code_field" value="" required readonly> ' +
            '     </div> ' +
            '     <div class="col-md-12"> ' +
            '         <small class="form-text text-muted">' + gettext("Each field in a Wysebone app has a Field Code, that is unique within the App. These field codes are necessary when creating, retrieving, and updating data via API.") + '</small> ' +
            '     </div> ' +
            ' </div>';
        return html;
    }

    /**
     * Remove the items in table
     * @version 1.0.2
     */
    this.removeItemsInApp = function(item_id) {
        var item = self.items_management.filter({ 'tableItem_id': item_id.toString() });
        if (item != null) {
            item.delete();
        }
    }
}

jQuery(document).ready(function($) {
    new ListView();

    $("body").on('change', '#auto_number_field', function() {
        $("#not_autonumber").toggle(!$(this).is(':checked'))
    })

    $('#attributeModal').on('show.bs.modal', function(e) {
        $("#not_autonumber").toggle(!$('#auto_number_field').is(':checked'))
    })

    $(document).on('change', 'select', function() {
        var value = $(this).val();
        $(this).find('option[selected="selected"]').removeAttr("selected");
        $(this).find('option:selected').attr("selected", "selected");
    });

});