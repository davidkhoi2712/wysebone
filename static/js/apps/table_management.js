function TableManagement(app) {
    var self = this;
    this.app = app;
    this.addTableModal = $('#addTableModal');
    this.tableList     = [];
    this.tableSelected = [];

    /**
     * Update the table selected
     * @version 1.0.2
     */
    this.updateTableSelected = function(tables) {
        $.each(tables, function(id, table) {
            if (typeof (self.tableList[table.id]) != 'undefined') {
                self.tableSelected.push(self.tableList[table.id]);
                self.display_selected_table(self.tableList[table.id]);
            }
        });

        self.update_attribute_tablelink();
        self.app.set_event();
    }

    /**
     * Open add table modal
     * @version 1.0.2
     */
    this.openAddTableModal = function() {

        var addTableModal_content = $("#addTableModal_content");
        addTableModal_content.empty();

        $.each(self.tableList, function(id, table) {
            if (id == 'user') {
                return true;
            }

            if (self.filter_table(table.id) != null) {
                return true;
            }

            var st = '<div class="custom-control custom-checkbox table-info-item">\
                <input type="checkbox" class="custom-control-input" name="table-info-listing[]" id="table-' + table.id + '" value="' + table.id + '">\
                <label class="custom-control-label" for="table-' + table.id + '">' + table.name + '</label>\
            </div>';

            addTableModal_content.append(st);
        });

        self.addTableModal.modal('show');
    }

    /**
     * Choose table
     * @version 1.0.2
     */
    this.choose_table = function() {
        $('#addTableModal_content input[type=checkbox]').each(function() {
            if ($(this).is(":checked")) {
                self.tableSelected.push(self.tableList[$(this).val()]);
                self.display_selected_table(self.tableList[$(this).val()]);
            }
        });

        self.addTableModal.modal('hide');
        self.update_attribute_tablelink();
        self.app.set_event();
        is_edited = true;
    }

    /**
     * Display the selected table
     * @version 1.0.2
     */
    this.display_selected_table = function(table) {
        var card = $('<div class="card"></div>');
        
        var card_header = $('<div class="card-header border-bottom mb-0" id="heading_' + table.data_code + '"></div>');
        card_header.append('<a href="javascript:void(0)" class="text-decoration-none d-block" data-toggle="collapse" data-target="#collapse_' + table.data_code + '" aria-expanded="false" aria-controls="collapse_' + table.data_code + '"> ' + table.name + '</a>');

        var delete_link = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'position-absolute delete-table text-danger',
            title: gettext('Delete'),
            html: '<i class="fa fa-trash-o"></i>',
            click: function() {
                return self.removeTable(table, card);
            }
        });
        card_header.append(delete_link);
        card.append(card_header);

        var collapse  = $('<div id="collapse_' + table.data_code + '" class="collapse border-bottom" aria-labelledby="heading_' + table.data_code + '" data-parent="#tables-info"></div>');
        var card_body = $('<div class="card-body p-0"></div>');

        var list_group = $('<ul class="list-group list-group-flush"></ul>');
        $.each(table.items, function(id, item) {
            var required = item.item_json.required ? ' <b class="text-danger">*</b>' : '';
            list_group.append('<li class="list-group-item wb-drag-item" data-table="' + table.id + '" data-item-required="' + item.item_json.required + '" data-table-item="' + item.id + '" data-itemtype="' + item.attribute__id + '" data-name="' + item.item_name + '" data-img="' + base_url + '/static/images/icon/' + item.attribute__icon + '"><img src="' + base_url + '/static/images/icon/' + item.attribute__icon + '"><span class="ml-2">' + item.item_name + '</span>' + required + '</li>');
        });
        card_body.append(list_group);

        collapse.append(card_body);
        card.append(collapse);

        $('#tables-info').prepend(card);
    }

    /**
     * Remove selected table
     * @version 1.0.2
     */
    this.removeTable = function(table, table_html) {
        if (confirm(interpolate(gettext('Are you sure you want to delete the "%s" table from this application?'), [table.name]))) {
            $.each(self.tableSelected, function(table_index, table_obj) {
                if (table_obj.id == table.id) {
                    // Remove all related items in app
                    self.removeItems(table);

                    // Remove table from selected table
                    self.tableSelected.splice(table_index, 1);

                    // Hide table on left sidebar
                    table_html.remove();
                    return false;
                }
            });
            is_edited = true;
        }
    }

    /**
     * Remove all related items in app
     * @version 1.0.2
     */
    this.removeItems = function(table) {
        $.each(table.items, function(item_index, item) {
            self.app.removeItemsInApp(item.id);
        });
    }

    /**
     * Update the table link for attribute modal
     * @version 1.0.2
     */
    this.update_attribute_tablelink = function() {
        var st = '<option value="">' + gettext('Please select') + '</option>';

        $.each(self.tableSelected, function(table_index, table) {
            st += '<optgroup label="' + table.name + '" data-id="' + table.id + '">';
            $.each(table.items, function(item_index, item) {
                st += '<option value="' + item.id + '">' + item.item_name + '</option>';
            });
            st += '</optgroup>';
        });

        $('#table_items_field').html(st);
    }

    /**
     * Filter selected table
     * @version 1.0.2
     */
    this.filter_table = function(table_id) {
        var obj = null;

        $.each(self.tableSelected, function(table_index, table) {
            if (table.id == table_id) {
                obj = table;
                return false;
            }
        });

        return obj;
    }

    /**
     * Filter table item
     * @version 1.0.2
     */
    this.filter_table_item = function(item_id) {
        var obj = null;

        $.each(self.tableSelected, function(table_index, table) {
            $.each(table.items, function(item_index, item) {
                if (item.id == item_id) {
                    obj = item;
                    return false;
                }
            });
        });

        return obj;
    }

    /**
     * Get the items from selected table
     * @version 1.0.2
     */
    this.get_available_items = function() {
        var items = [];
        
        $.each(self.tableSelected, function(table_index, table) {
            $.each(table.items, function(item_index, item) {
                items.push(item);
            });
        });

        return items;
    }

    /**
     * Get list of selected table ID
     * @version 1.0.2
     */
    this.get_selected_tables_id = function() {
        var tables_ID = [];

        $.each(self.tableSelected, function(table_index, table) {
            tables_ID.push(table.data_code);
        });

        return tables_ID;
    }

    /**
     * Init Table management
     * @version 1.0.2
     */
    this.init = function() {
        // Add table event
        $('.add-table-btn').click(function() {
            self.openAddTableModal();
        });

        $("#choose_table_info").click(function() {
            self.choose_table();
        });
    }

    this.init();
}