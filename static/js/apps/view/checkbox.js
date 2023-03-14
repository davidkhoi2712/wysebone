function CheckboxField(option) {
    var self = this;
    this.parent = option.parent;
    this.id = 'checkbox-' + Date.now();
    this.outputs = option.output;

    this._input = new InOutput(1, option);
    this._output = new InOutput(2, option);
    this._event = new Event(self, option);

    // code
    this.code = '';
    if (typeof(option.code) != 'undefined') {
        this.code = option.code;
    }

    // itemtype
    this.itemtype = null;
    if (typeof(option.itemtype) != 'undefined') {
        this.itemtype = option.itemtype;
    }

    // field_code
    this.field_code = option.field_code;

    // Name
    this.name = gettext('Checkbox');
    if (typeof(option.name) != 'undefined') {
        this.name = option.name;
    }
    this.name_label = $('<span class="label-name"></span>');
    this.name_field = $('<input type="text" class="form-control" maxlength="150" id="name_field" value="' + this.name + '" required>');

    // default_value
    this.default_value = false;
    if (typeof(option.default_value) != 'undefined') {
        this.default_value = option.default_value;
    }
    this.default_value_field = $('<input type="checkbox" class="custom-control-input" id="default_value_field" ' + (this.default_value ? 'checked' : '') + '>');

    // tableItem_id
    this.tableItem_id = '';
    if (typeof(option.tableItem_id) != 'undefined') {
        this.tableItem_id = option.tableItem_id;
    }

    this.attributeModal = $('#attributeModal');

    this.plus_option = $("<a/>", {
        href: 'javascript:void(0)',
        class: 'ml-1',
        html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
    });

    this._item = $('<li class="ui-draggable ui-draggable-handle" id="' + self.id + '" index="0" style="height: auto; width: 185px; list-style: none;"></li>');
    // Create content html
    this._content = $('<table class="table views-canvas-items"></table>');

    /**
     * Render Checkbox html
     * @version 1.0.0
     */
    this.init = function() {
        let th = $('<th scope="col" class="label-header pt-2 pb-2"></th>');
        // Label
        let label = '<div class="label-preName pb-1"></div>';
        self.name_label.html(self.name);
        th.append(label).append(self.name_label).append(self.get_dropdown());
        let thead = $('<thead class="thead-items"></thead>');
        thead.append($('<tr></tr>').append(th));

        let tbody = '<tbody>' +
            '<tr><td><span class="pl-4 pt-1 text-dark" style="background: transparent url(' + base_url + '/static/images/icon/' + self.itemtype.icon + ') no-repeat 0px 5px;">' +
            self.itemtype.name + '</span></td></tr>' +
            '<tr><td><span class="pl-4 pt-1 text-dark" style="background: transparent url(' + base_url + '/static/images/icon/' + self.itemtype.icon + ') no-repeat 0px 5px;">' +
            self.itemtype.name + '</span></td></tr>' +
            '<tr><td><span class="pl-4 pt-1 text-dark" style="background: transparent url(' + base_url + '/static/images/icon/' + self.itemtype.icon + ') no-repeat 0px 5px;">' +
            self.itemtype.name + '</span></td></tr>' +
            '</tbody>';

        self._content.append(thead).append(tbody);

        self._input.init();
        self._output.init();
        self._event.init();

        // Provide the id for left menu
        if (self.tableItem_id != '') {
            var pre = $('#tables-info').find('li[data-table-item="' + self.tableItem_id + '"]');
            pre.addClass('disabled');
            pre.draggable({ disabled: true });
            pre.attr('id', 'pre-' + self.id);
        }
    }

    /**
     * Settings action
     * @version 1.0.0
     */
    this.settings = function() {
        self.attributeModal.find('.modal-title').html('<img src="' + base_url + '/static/images/icon/' + self.itemtype.icon + '"> <span>' + interpolate(gettext('%s Settings'), [gettext('Yes/No')]) + '</span>');

        self.attributeModal.find('.no-nav').addClass('d-none');
        self.attributeModal.find('.is-nav').removeClass('d-none');

        self.attributeModal.find('#nav-basic-tab').removeClass('d-none');
        self.attributeModal.find('#nav-input-tab').removeClass('d-none');
        self.attributeModal.find('#nav-output-tab').removeClass('d-none');
        self.attributeModal.find('#nav-event-tab').removeClass('d-none');
        self.attributeModal.find('#nav-table-link-tab').removeClass('d-none');

        // Basic tab
        var basic_tab = self.attributeModal.find('#nav-basic');
        basic_tab.empty();

        // Create field name
        basic_tab.append(self.get_name_field());

        // Default value field
        basic_tab.append(self.get_default_value_field());

        basic_tab.append(self.parent.display_field_code());
        self.attributeModal.find('#field_code_field').val(self.field_code);

        // Input tab
        self.attributeModal.find('#nav-input').empty().append(self._input.init());
        self.attributeModal.find('#nav-output').empty().append(self._output.init());
        self.attributeModal.find('#nav-event').empty().append(self._event.init());

        // Table link tab
        self.attributeModal.find('#table_items_field').val(self.tableItem_id).data('val', self.tableItem_id);
        self.attributeModal.find('#table_items_field').removeClass('is-invalid');
        self.parent.disabled_selected_options(self.tableItem_id);

        // Generate Save button
        var savebtn = $("<button/>", {
            id: 'save-btn',
            type: 'button',
            class: 'btn btn-primary',
            html: gettext('Save'),
            click: function() {
                return self.save();
            }
        });

        self.attributeModal.find('.modal-footer').find('#save-btn').remove();
        self.attributeModal.find('.modal-footer').append(savebtn);

        self.attributeModal.modal('show');
        self.attributeModal.find('#nav-basic-tab').click();
    }

    /**
     * Save action
     */
    this.save = function() {
        if (!self.validate()) {
            return false;
        }

        // Form is Updated
        is_edited = true;

        // Saved field name
        self.name = $.trim(self.name_field.val());
        self.name_label.text(self.name);

        self.default_value = self.default_value_field.is(':checked');

        let tableItem = self.attributeModal.find('#table_items_field');
        self.tableItem_id = tableItem.val();

        // Saved input and output
        self.inputs = self._input.get();
        self.outputs = self._output.get();
        self.events = self._event.get();

        // Hide modal
        self.attributeModal.modal('hide');

        // Verify draggable feature
        self.parent.verify_draggable();
    }

    /**
     * Validated form
     * @version 1.0.0
     */
    this.validate = function() {
        var is_valid = true;

        if ($.trim(self.name_field.val()) == '') {
            self.name_field.addClass('is-invalid');
            self.attributeModal.find('#nav-basic-tab').click();
            is_valid = false;
        } else {
            self.name_field.removeClass('is-invalid');
        }

        if (self.name_field.val().length > 150) {
            alert(interpolate(gettext("Ensure this value has at most %(limit_value)s characters (it has %(show_value)s)."), { limit_value: 150, show_value: self.name_field.val().length }, true));
            is_valid = false;
        }

        if (self._output.validate()) {
            self.attributeModal.find('#nav-output-tab').click();
            is_valid = false;
        }
        else if (self._event.validate()) {
            self.attributeModal.find('#nav-event-tab').click();
            is_valid = false;
        }

        return is_valid;
    }

    /**
     * Get name field
     * @version 1.0.0
     */
    this.get_name_field = function() {
        self.name_field.val(self.name);
        self.name_field.removeClass('is-invalid');

        var field_name = $('<div class="form-group"></div>');
        field_name.append('<label for="name_field"><b>' + gettext('Name') + '</b> <b class="text-danger">*</b></label>');
        field_name.append(self.name_field);
        field_name.append('<div class="invalid-feedback">' + gettext('This field is required.') + '</div>');
        return field_name;
    }

    /**
     * Get default value field
     * @version 1.0.0
     */
    this.get_default_value_field = function() {
        self.default_value_field.val(self.default_value);

        var default_value_field = $('<div class="form-group"></div>');
        var custom_control = $('<div class="custom-control custom-checkbox"></div>');
        custom_control.append(self.default_value_field);
        custom_control.append('<label class="custom-control-label" for="default_value_field"><b>' + gettext('Default value') + '</b></label>');
        default_value_field.append(custom_control);
        return default_value_field;
    }

    /**
     * Delete action
     * @version 1.0.2
     */
    this.delete = function() {
        $('#' + self.id).remove();
        self.parent.items_management.splice(self.id);

        // Verify draggable feature
        self.parent.verify_draggable();

        // Display text if empty list
        if (self.parent.items_management.length() == 0) {
            $('#draggable-text').show();
        }

        // sort Table
        self.parent.sort_table();

        // Enable edit
        is_edited = true;
    }

    /**
     * Get dropdown action
     * @version 1.0.2
     */
    this.get_dropdown = function() {
        // Dropdown
        var dropdown = $('<div class="dropdown"><div/>');
        dropdown.append('<a class="dropdown-toggle text-secondary" href="javascript:void(0)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fa fa-cog"></i></a>');

        // dropdown-menu
        var dropdown_menu = $('<div class="dropdown-menu dropdown-menu-right dropdown-menu-lg-right"><div/>');

        var settings_link = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'dropdown-item',
            html: '<i class="fa fa-wrench" aria-hidden="true"></i>' + gettext('Settings'),
            click: function() {
                return self.settings();
            }
        });
        dropdown_menu.append(settings_link);

        var delete_link = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'dropdown-item',
            html: '<i class="fa fa-trash-o" aria-hidden="true"></i>' + gettext('Delete'),
            click: function() {
                if (confirm(gettext('Are you sure you want to delete this field?'))) {
                    return self.delete();
                }
            }
        });
        dropdown_menu.append(delete_link);

        dropdown.append(dropdown_menu);
        return dropdown;
    }

    this.init();
}