function SelectionField(option) {
    var self = this;
    this.parent = option.parent;
    this.id = 'selection-' + Date.now();
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
    this.name = gettext('Selection');
    if (typeof(option.name) != 'undefined') {
        this.name = option.name;
    }
    this.name_label = $('<span class="label-name"></span>');
    this.name_field = $('<input type="text" class="form-control" maxlength="150" id="name_field" value="' + this.name + '" required>');

    // required
    this.required = false;
    if (typeof(option.required) != 'undefined') {
        this.required = option.required;
    }
    this.required_field = $('<input type="checkbox" class="custom-control-input" id="required_field" ' + (self.required ? 'checked' : '') + '>');

    // tableItem_id
    this.tableItem_id = '';
    if (typeof(option.tableItem_id) != 'undefined') {
        this.tableItem_id = option.tableItem_id;
    }

    this.create_option = function(item) {
        var op = {
            parent: self,
            order: self.options.length,
            auto_id: self.option_id_auto,
            is_display_checkbox: false
        };

        try {
            op.label = item.label;
        } catch (err) {
            console.log(err.message);
        }

        var option = new Option(op);

        self.option_id_auto += 1;

        return option;
    }

    // Options
    this.options = [];
    this.options_tmp = [];
    this.option_id_auto = 0;
    if (typeof(option.options) != 'undefined') {
        $.each(option.options, function(index, item) {
            self.options.push(self.create_option({ label: item }));
        });
    } else {
        self.options.push(self.create_option({ label: 'Sample1' }));
        self.options.push(self.create_option({ label: 'Sample2' }));
    }

    // default_value
    this.default_value = '';
    if (typeof(option.default_value) != 'undefined') {
        this.default_value = option.default_value;
    }
    this.default_value_field = $('<select class="form-control" id="default_value_field"><option value="">----</option></select>');

    $.each(self.options, function(index, item) {
        self.default_value_field.append('<option value="' + item.label + '">' + item.label + '</option>');
    });

    self.default_value_field.val(self.default_value);

    this.plus_option = $("<a/>", {
        href: 'javascript:void(0)',
        class: 'ml-1',
        html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
    });

    this.attributeModal = $('#attributeModal');

    this.select = $('<select class="form-control"></select>');

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
        self.options_tmp = self.options.slice(0);

        self.attributeModal.find('.modal-title').html('<img src="' + base_url + '/static/images/icon/' + self.itemtype.icon + '"> <span>' + interpolate(gettext('%s Settings'), [gettext('Selection')]) + '</span>');

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

        // Required field
        basic_tab.append(self.get_required_field());

        // Options
        basic_tab.append(self.get_options_settings());
        $(".checkbox-options").sortable({
            handle: ".sort-option-handle",
        });
        self.plus_option.click(function() {
            self.add_option();
        });

        if (self.options_tmp.length == 1) {
            basic_tab.find('.checkbox-options').find('a').removeClass('d-inline-block').addClass('d-none');
        }

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

        // Saved Required field
        self.required = self.required_field.is(':checked');

        self.options = self.options_tmp;

        $.each($('.checkbox-options').find('.clearfix'), function(order, option) {
            var id = parseInt($(option).data('index'), 10);
            self.set_option_order(id, order);
        });

        self.options.sort(function(a, b) { return a.order - b.order });

        $.each(self.options, function(index, item) {
            self.options[index].label = item.label_field.val();
        });

        // Saved default value
        self.default_value = self.default_value_field.val();
        self.select.empty();
        if (self.default_value == '') {
            self.select.append('<option value="">----</option>');
        } else {
            self.select.append('<option value="' + self.default_value + '">' + self.default_value + '</option>');
        }

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

        if (self.options_tmp.length == 0) {
            $("#feedback-checkbox-options-field").show();
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
        } else {
            $("#feedback-checkbox-options-field").hide();
        }

        // Validate option is empty
        var isOptionEmpty = false;
        $.each(self.options_tmp, function(index, item) {
            var label_val = $.trim(item.label_field.val());
            if (label_val == '') {
                isOptionEmpty = true;
                return false;
            }
        });

        if (isOptionEmpty) {
            $("#feedback-checkbox-options-field").show();
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
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
     * Set option order
     * @param int id    The id of option
     * @param int order The order of option
     * @version 1.0.0
     */
    this.set_option_order = function(id, order) {
        var i = 0;
        for (i = 0; i < self.options.length; i++) {
            if (self.options[i].id == id) {
                self.options[i].order = order;
                break;
            }
        }
    }

    // Gender default value
    this.gender_default_field = function() {
        self.default_value_field.empty();
        var isSelected = false;
        self.default_value_field.append('<option value="">----</option>');
        $.each(self.options_tmp, function(index, item) {
            var label_val = $.trim(item.label_field.val());
            var selected = '';
            if (self.default_value != '' && self.default_value == label_val && isSelected == false) {
                selected = 'selected';
                isSelected = true;
            }

            let _option = $('<option value="' + label_val + '" ' + selected + '></option>');
            _option.text(label_val);

            self.default_value_field.append(_option);

        });

        if (isSelected == false) {
            self.default_value = '';
        }
    }

    this.get_options = function() {
        var data = [];

        self.options.sort(function(a, b) { return a.order - b.order });

        var i = 0;
        for (i = 0; i < self.options.length; i++) {
            data.push(self.options[i].label);
        }

        return data;
    }

    this.get_options_settings = function() {
        var field = $('<div class="form-group"></div>');

        var label = $('<label/>');
        label.append('<b>' + gettext('Options') + '</b> <b class="text-danger">*</b>');
        label.append(self.plus_option);

        field.append(label);

        var checkbox_options = $('<div class="checkbox-options"></div>');

        $.each(self.options_tmp, function(index, item) {
            checkbox_options.append(item.get_setting());
        });

        field.append(checkbox_options);
        field.append('<div class="invalid-feedback" id="feedback-checkbox-options-field">' + gettext('This field is required.') + '</div>');
        return field;
    }

    /**
     * Add more option
     * @version 1.0.0
     */
    this.add_option = function() {
        var option = self.create_option();
        self.options_tmp.push(option);

        var basic_tab = self.attributeModal.find('#nav-basic');
        basic_tab.find('.checkbox-options').append(option.get_setting()).find('a.d-none').addClass('d-inline-block').removeClass('d-none');
        self.gender_default_field();
    }

    /**
     * Remove option
     * @version 1.0.0
     */
    this.remove_option = function(id) {
        var i = 0;
        var basic_tab = self.attributeModal.find('#nav-basic');

        if (basic_tab.find('.checkbox-options [data-index]').length == 1)
            return;

        for (i = 0; i < self.options_tmp.length; i++) {
            if (self.options_tmp[i].id == id) {
                self.options_tmp.splice(i, 1);
                basic_tab.find('.checkbox-options').find('div[data-index="' + id + '"]').remove();
                self.gender_default_field();
                break;
            }
        }

        if (basic_tab.find('.checkbox-options [data-index]').length == 1) {
            basic_tab.find('.checkbox-options').find('a').removeClass('d-inline-block').addClass('d-none');
        }
    }

    /**
     * Get default value field
     * @version 1.0.0
     */
    this.get_default_value_field = function() {
        self.gender_default_field();

        var default_value_field = $('<div class="form-group"></div>');
        default_value_field.append('<label for="default_value_field"><b>' + gettext('Default value') + '</b></label>');
        default_value_field.append(self.default_value_field);
        return default_value_field;
    }

    /**
     * Get required field
     * @version 1.0.0
     */
    this.get_required_field = function() {
        self.required_field.prop('checked', self.required);

        var field = $('<div class="form-group"></div>');
        var custom_control = $('<div class="custom-control custom-checkbox"></div>');
        custom_control.append(self.required_field);
        custom_control.append('<label class="custom-control-label" for="required_field"><b>' + gettext('Required field') + '</b></label>');
        field.append(custom_control);
        return field;
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
     * @version 1.0.0
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