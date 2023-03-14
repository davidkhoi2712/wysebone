function TextField(option) {
    var self = this;
    this.parent = option.parent;
    this.id = 'text-' + Date.now();

    this.input_type = $("<div/>");
    this.help_text = '';
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

    // width
    this.width = 300;
    if (typeof(option.width) != 'undefined') {
        this.width = option.width;
    }

    // field_code
    this.field_code = option.field_code;

    // field_name
    this.name = gettext('Text');
    if (typeof(option.name) != 'undefined') {
        this.name = option.name;
    }
    this.field_name_label = $("<label/>");
    this.field_name_field = $('<input type="text" class="form-control" maxlength="150" id="field_name_field" value="' + this.name + '" required>');

    // hide_field_name
    this.hide_field_name = false;
    if (typeof(option.hide_field_name) != 'undefined') {
        this.hide_field_name = option.hide_field_name;
    }
    this.hide_field_name_field = $('<input type="checkbox" class="custom-control-input" id="hide_field_name_field" ' + (self.hide_field_name ? 'checked' : '') + '>');

    this.is_force_required = false;
    if (typeof(option.is_force_required) != 'undefined') {
        this.is_force_required = option.is_force_required;
    }

    // required
    this.required = this.is_force_required;
    if (this.is_force_required == false && typeof(option.required) != 'undefined') {
        this.required = option.required;
    }
    this.required_field = $('<input type="checkbox" class="custom-control-input" id="required_field" ' + (self.required ? 'checked' : '') + ' ' + (self.is_force_required ? 'disabled' : '') + ' >');

    // min_length
    this.min_length = '';
    if (typeof(option.min_length) != 'undefined') {
        this.min_length = option.min_length;
    }
    this.min_length_field = $('<input type="text" class="form-control rounded-right" id="min_length_field" value="' + self.min_length + '">');

    // max_length
    this.max_length = '';
    if (typeof(option.max_length) != 'undefined') {
        this.max_length = option.max_length;
    }
    this.max_length_field = $('<input type="text" class="form-control rounded-right" id="max_length_field" value="' + self.max_length + '">');

    // default_value
    this.default_value = '';
    if (typeof(option.default_value) != 'undefined') {
        this.default_value = option.default_value;
    }
    this.default_value_field = $('<input type="text" class="form-control" id="default_value_field" value="' + self.default_value + '">');

    // number_lines
    this.number_lines = 1;
    if (typeof(option.number_lines) != 'undefined') {
        this.number_lines = option.number_lines;
    }
    this.number_lines_field = $('<input type="text" class="form-control" id="number_lines_field" value="' + self.number_lines + '" required>');

    // tableItem_id
    this.tableItem_id = '';
    if (typeof(option.tableItem_id) != 'undefined') {
        this.tableItem_id = option.tableItem_id;
    }

    this.attributeModal = $('#attributeModal');

    this._item = $('<div class="wb-drop-item" id="' + self.id + '" style="width: ' + self.width + 'px;"></div>');
    this._content = $('<div class="item-content"></div>');

    /**
     * Render Text html
     * @version 1.0.0
     */
    this.init = function() {
        // Label
        self.field_name_label.html(self.name);
        self._content.append(self.field_name_label);

        if (self.required)
            self.field_name_label.append(' <b class="text-danger">*</b>');

        if (self.hide_field_name) {
            self.field_name_label.addClass('d-none');
        } else {
            self.field_name_label.removeClass('d-none');
        }

        // Dropdown
        self._content.append(self.get_dropdown());

        // Text input
        if (self.number_lines > 1) {
            var rows = self.number_lines > 5 ? 5 : self.number_lines;
            self.input_type.html('<textarea class="form-control" rows="' + rows + '" style="resize: none;">'+self.default_value+'</textarea>');
        } else {
            self.input_type.html('<input type="text" class="form-control" value="'+self.default_value+'">');
        }

        self._content.append(self.input_type);

        self._input.init();
        self._output.init();
        self._event.init();
    }

    /**
     * Settings action
     * @version 1.0.0
     */
    this.settings = function() {
        self.attributeModal.find('.modal-title').html('<img src="' + base_url + '/static/images/icon/' + self.itemtype.icon + '"> <span>' + interpolate(gettext('%s Settings'), [gettext('Text')]) + '</span>');

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

        // Hide fieldname field
        basic_tab.append(self.get_hide_fieldname_field());

        // Required field
        basic_tab.append(self.get_required_field());

        // Number of Characters
        basic_tab.append('<label><b>' + gettext('Number of Characters (Note: Use integer)') + '</b></label>');
        var number_characters = $('<div class="form-row"></div>');
        number_characters.append(self.get_min_length_field());
        number_characters.append(self.get_max_length_field());
        basic_tab.append(number_characters);

        // Default value field
        basic_tab.append(self.get_default_value_field());

        // Number lines field
        basic_tab.append(self.get_number_lines_field());

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
        self.name = $.trim(self.field_name_field.val());
        self.field_name_label.text(self.name);

        // Saved hide file name
        self.hide_field_name = self.hide_field_name_field.is(':checked');
        if (self.hide_field_name) {
            self.field_name_label.addClass('d-none');
        } else {
            self.field_name_label.removeClass('d-none');
        }

        // Saved Required field
        if (!self.is_force_required) {
            self.required = self.required_field.is(':checked');
        }

        if (self.required)
            self.field_name_label.append(' <b class="text-danger">*</b>');

        // Saved min length field
        self.min_length = $.trim(self.min_length_field.val());

        // Saved max length field
        self.max_length = $.trim(self.max_length_field.val());

        // Saved default value
        self.default_value = $.trim(self.default_value_field.val());

        // Saved number of lines field
        self.number_lines = self.number_lines_field.val();

        // Saved input and output
        self.inputs = self._input.get();
        self.outputs = self._output.get();
        self.events = self._event.get();

        if (self.number_lines > 1) {
            self.input_type.html('<textarea class="form-control" rows="' + self.number_lines + '">'+self.default_value+'</textarea>');
        } else {
            self.input_type.html('<input type="text" class="form-control" value="'+self.default_value+'">');
        }

        let tableItem = self.attributeModal.find('#table_items_field');
        self.tableItem_id = tableItem.val();

        // Hide modal
        self.attributeModal.modal('hide');

        self.parent.resizeCanvas();

        // Verify draggable feature
        self.parent.verify_draggable();
    }

    /**
     * Validated form
     * @version 1.0.0
     */
    this.validate = function() {
        var is_valid = true;

        if ($.trim(self.field_name_field.val()) == '') {
            self.field_name_field.addClass('is-invalid');
            self.attributeModal.find('#nav-basic-tab').click();
            is_valid = false;
        } else {
            self.field_name_field.removeClass('is-invalid');
        }

        if (self.field_name_field.val().length > 150) {
            alert(interpolate(gettext("Ensure this value has at most %(limit_value)s characters (it has %(show_value)s)."), { limit_value: 150, show_value: self.field_name_field.val().length }, true));
            is_valid = false;
        }

        var is_length_number = true;
        var min_length = $.trim(self.min_length_field.val());
        if (min_length != '' && isPositiveIntNumber(min_length) == false) {
            self.min_length_field.addClass('is-invalid');
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
            is_length_number = false;
        } else {
            self.min_length_field.removeClass('is-invalid');
        }

        var max_length = $.trim(self.max_length_field.val());
        if (max_length != '' && isPositiveIntNumber(max_length) == false) {
            self.max_length_field.addClass('is-invalid');
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
            is_length_number = false;
        } else {
            self.max_length_field.removeClass('is-invalid');
        }

        if (is_length_number && min_length != '' && max_length != '' && parseInt(max_length, 10) <= parseInt(min_length, 10)) {
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
            alert(gettext("Number of characters is not valid."));
        }

        var number_lines = $.trim(self.number_lines_field.val());
        if (isPositiveIntNumber(number_lines) == false) {
            self.number_lines_field.addClass('is-invalid');
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
        } else {
            self.number_lines_field.removeClass('is-invalid');
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
     * Get number lines field
     * @version 1.0.0
     */
    this.get_number_lines_field = function() {
        self.number_lines_field.val(self.number_lines);
        self.number_lines_field.removeClass('is-invalid');

        var field = $('<div class="row form-group"></div>');
        var row6 = $('<div class="col-md-6"></div>');
        row6.append('<label for="number_lines_field"><b>' + gettext('Number of lines') + '</b> <b class="text-danger">*</b></label>');
        row6.append(self.number_lines_field);
        row6.append('<div class="invalid-feedback">' + gettext('This field must be an positive integer.') + '</div>');
        field.append(row6);

        var row12 = $('<div class="col-md-12"></div>');
        row12.append('<small class="form-text text-muted"><b>' + gettext('Value is 1') + ':</b> ' + gettext('A single line text field accepts a single line of text for each cell. You can put any text value you want into each cell.') + '</small>');
        row12.append('<small class="form-text text-muted"><b>' + gettext('Value is greater than 1') + ':</b> ' + gettext('A long text field is great when you need to keep notes or multiple lines of text in each record.') + '</small>');
        field.append(row12);

        return field;
    }

    /**
     * Get name field
     * @version 1.0.0
     */
    this.get_name_field = function() {
        self.field_name_field.val(self.name);
        self.field_name_field.removeClass('is-invalid');

        var field_name = $('<div class="form-group"></div>');
        field_name.append('<label for="name_field"><b>' + gettext('Name') + '</b> <b class="text-danger">*</b></label>');
        field_name.append(self.field_name_field);
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
        default_value_field.append('<label for="default_value_field"><b>' + gettext('Default value') + '</b></label>');
        default_value_field.append(self.default_value_field);
        return default_value_field;
    }

    /**
     * Get hide fieldname field
     * @version 1.0.0
     */
    this.get_hide_fieldname_field = function() {
        self.hide_field_name_field.prop('checked', self.hide_field_name);

        var hide_field_name_field = $('<div class="form-group"></div>');
        var custom_control = $('<div class="custom-control custom-checkbox"></div>');
        custom_control.append(self.hide_field_name_field);
        custom_control.append('<label class="custom-control-label" for="hide_field_name_field"><b>' + gettext('Hide field name') + '</b></label>');
        hide_field_name_field.append(custom_control);
        return hide_field_name_field;
    }

    /**
     * Get required field
     * @version 1.0.0
     */
    this.get_required_field = function() {
        self.required_field.prop('checked', self.required);

        var required_field = $('<div class="form-group"></div>');
        var custom_control = $('<div class="custom-control custom-checkbox"></div>');
        custom_control.append(self.required_field);
        custom_control.append('<label class="custom-control-label" for="required_field"><b>' + gettext('Required field') + '</b></label>');
        required_field.append(custom_control);
        return required_field;
    }

    /**
     * Get min length field
     * @version 1.0.0
     */
    this.get_min_length_field = function() {
        self.min_length_field.val(self.min_length);
        self.min_length_field.removeClass('is-invalid');

        var min_length_field = $('<div class="form-group col-sm-6"></div>');
        var input_group = $('<div class="input-group"></div>');
        input_group.append('<div class="input-group-prepend"><span class="input-group-text"><small>' + gettext('Minimum') + '</small></span></div>');
        input_group.append(self.min_length_field);
        input_group.append('<div class="invalid-feedback">' + gettext('This field must be an positive integer.') + '</div>');
        min_length_field.append(input_group);
        return min_length_field;
    }

    /**
     * Get min length field
     * @version 1.0.0
     */
    this.get_max_length_field = function() {
        self.max_length_field.val(self.max_length);
        self.max_length_field.removeClass('is-invalid');

        var max_length_field = $('<div class="form-group col-sm-6"></div>');
        var input_group = $('<div class="input-group"></div>');
        input_group.append('<div class="input-group-prepend"><span class="input-group-text"><small>' + gettext('Maximum') + '</small></span></div>');
        input_group.append(self.max_length_field);
        input_group.append('<div class="invalid-feedback">' + gettext('This field must be an positive integer.') + '</div>');
        max_length_field.append(input_group);
        return max_length_field;
    }

    /**
     * Delete action
     * @version 1.0.0
     */
    this.delete = function() {
        $('#' + self.id).remove();
        self.parent.enableDraggable(self.id);
        self.parent.items_management.splice(self.id);
        self.parent.resizeCanvas();

        // Enable option
        $('#table_items_field option[value="' + self.tableItem_id + '"]').prop('disabled', false);
        is_edited = true;
    }

    /**
     * Get dropdown action
     * @version 1.0.0
     */
    this.get_dropdown = function() {
        // Dropdown
        var dropdown = $('<div class="dropdown"/>');
        dropdown.append('<a class="dropdown-toggle text-secondary" href="javascript:void(0)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fa fa-cog"></i></a>');

        // dropdown-menu
        var dropdown_menu = $('<div class="dropdown-menu dropdown-menu-right dropdown-menu-lg-right"/>');

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
        dropdown.hover(function () {
            dropdown.dropdown("toggle");
        }, function () {
            dropdown.dropdown("hide");
        })

        return dropdown;
    }

    self.init();
}