function NumericField(option) {
    const PREFIX_POSITION = 1;
    const SUFFIX_POSITION = 2;

    var self = this;
    this.parent = option.parent;
    this.id = 'numeric-' + Date.now();
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

    // Name
    this.name = gettext('Numeric');
    if (typeof(option.name) != 'undefined') {
        this.name = option.name;
    }
    this.name_label = $("<label/>");
    this.name_field = $('<input type="text" class="form-control" maxlength="150" id="name_field" value="' + this.name + '" required>');

    // hide_field_name
    this.hide_field_name = false;
    if (typeof(option.hide_field_name) != 'undefined') {
        this.hide_field_name = option.hide_field_name;
    }
    this.hide_field_name_field = $('<input type="checkbox" class="custom-control-input" id="hide_field_name_field" ' + (self.hide_field_name ? 'checked' : '') + '>');

    // auto number
    this.is_force_auto_number = false;
    if (typeof(option.is_force_auto_number) != 'undefined') {
        this.is_force_auto_number = option.is_force_auto_number;
    }

    this.auto_number = this.is_force_auto_number;
    if (this.is_force_auto_number == false && typeof(option.auto_number) != 'undefined') {
        this.auto_number = option.auto_number;
    }
    this.auto_number_field = $('<input type="checkbox" class="custom-control-input" id="auto_number_field" ' + (self.auto_number ? 'checked' : '') + ' ' + (self.is_force_auto_number ? 'disabled' : '') + ' >');


    // Use thousands separators
    this.thousands_separators = false;
    if (typeof(option.thousands_separators) != 'undefined') {
        this.thousands_separators = option.thousands_separators;
    }
    this.thousands_separators_field = $('<input type="checkbox" class="custom-control-input" id="thousands_separators_field" ' + (self.thousands_separators ? 'checked' : '') + '>');

    // required
    this.is_force_required = false;
    if (typeof(option.is_force_required) != 'undefined') {
        this.is_force_required = option.is_force_required;
    }

    this.required = this.is_force_required;
    if (this.is_force_required == false && typeof(option.required) != 'undefined') {
        this.required = option.required;
    }
    this.required_field = $('<input type="checkbox" class="custom-control-input" id="required_field" ' + (self.required ? 'checked' : '') + ' ' + (self.is_force_required ? 'disabled' : '') + ' >');

    // min_length
    this.min_value = '';
    if (typeof(option.min_value) != 'undefined') {
        this.min_value = option.min_value;
    }
    this.min_value_field = $('<input type="text" class="form-control rounded-right" id="min_value_field" value="' + self.min_value + '">');

    // max_length
    this.max_value = '';
    if (typeof(option.max_value) != 'undefined') {
        this.max_value = option.max_value;
    }
    this.max_value_field = $('<input type="text" class="form-control rounded-right" id="max_value_field" value="' + self.max_value + '">');

    // default_value
    this.default_value = '';
    if (typeof(option.default_value) != 'undefined') {
        this.default_value = option.default_value;
    }
    this.default_value_field = $('<input type="text" class="form-control" id="default_value_field" value="' + self.default_value + '">');

    // decimal_places
    this.decimal_places = '';
    if (typeof(option.decimal_places) != 'undefined') {
        this.decimal_places = option.decimal_places;
    }
    this.decimal_places_field = $('<input type="text" class="form-control" id="decimal_places_field" value="' + self.decimal_places + '">');

    // Unit of measure
    this.unit_measure = '';
    if (typeof(option.unit_measure) != 'undefined') {
        this.unit_measure = option.unit_measure;
    }
    this.unit_measure_field = $('<input type="text" class="form-control" id="unit_measure_field" value="' + self.unit_measure + '">');

    // unit_measure_prefix
    this.unit_measure_position = PREFIX_POSITION;
    if (typeof(option.unit_measure_position) != 'undefined') {
        this.unit_measure_position = option.unit_measure_position;
    }

    // tableItem_id
    this.tableItem_id = '';
    if (typeof(option.tableItem_id) != 'undefined') {
        this.tableItem_id = option.tableItem_id;
    }

    this.attributeModal = $('#attributeModal');
    this.input_view = $("<div/>");

    this._item = $('<div class="wb-drop-item" id="' + self.id + '" style="width: ' + self.width + 'px; height: auto;"></div>');
    this._content = $('<div class="item-content"></div>');

    /**
     * Render Numeric html
     * @version 1.0.0
     */
    this.init = function() {
        // Label
        self.name_label.html(self.name);
        self._content.append(self.name_label);

        if (self.required)
            self.name_label.append(' <b class="text-danger">*</b>');

        if (self.hide_field_name) {
            self.name_label.addClass('d-none');
        } else {
            self.name_label.removeClass('d-none');
        }

        // Dropdown
        self._content.append(self.get_dropdown());

        // Text input
        self.input_view.html(self.get_input_view());
        self._content.append(self.input_view);

        // Help text
        if (self.help_text != '') {
            self._content.append('<small class="form-text text-muted">' + self.help_text + '</small>');
        }

        self._input.init();
        self._output.init();
        self._event.init();

    }

    this.get_input_view = function () {
        let view = '<input type="text" class="form-control" value="' + self.default_value + '">';
        
        if (self.unit_measure != '') {
            if (self.unit_measure_position == PREFIX_POSITION) {
                view = '<div class="input-group">';
                view += '<div class="input-group-prepend"><span class="input-group-text">' + self.unit_measure + '</span></div>';
                view += '<input type="text" class="form-control" value="' + self.default_value + '">';
                view += '</div>';
            } else {
                view = '<div class="input-group">';
                view += '<input type="text" class="form-control" value="' + self.default_value + '">';
                view += '<div class="input-group-append"><span class="input-group-text">' + self.unit_measure + '</span></div>';
                view += '</div>';
            }
        }

        return view;
    }

    /**
     * Settings action
     * @version 1.0.0
     */
    this.settings = function() {
        self.attributeModal.find('.modal-title').html('<img src="' + base_url + '/static/images/icon/' + self.itemtype.icon + '"> <span>' + interpolate(gettext('%s Settings'), [gettext('Numeric')]) + '</span>');

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

        // Auto number field
        basic_tab.append(self.get_auto_number_field());

        // thousands_separators field
        basic_tab.append(self.get_thousands_separators_field());

        let not_auto = $("<div id='not_autonumber' />");

        // Required field
        not_auto.append(self.get_required_field());

        // Number of Characters
        not_auto.append('<label><b>' + gettext('Limits of Value (Note: Use integer)') + '</b></label>');
        var limits_value = $('<div class="form-row"></div>');
        limits_value.append(self.get_min_value_field());
        limits_value.append(self.get_max_value_field());
        not_auto.append(limits_value);

        // Default value field
        not_auto.append('<label for="default_value_field"><b>' + gettext('Default value') + '</b></label>');
        not_auto.append(self.get_default_value_field());

        // Number of Decimal Places to display
        not_auto.append('<label for="decimal_places_field"><b>' + gettext('Number of Decimal Places to display') + '</b></label>');
        not_auto.append(self.get_decimal_places_field());

        // Unit of measure
        not_auto.append('<label for="unit_measure_field"><b>' + gettext('Unit of measure') + '</b></label>');
        not_auto.append(self.get_unit_measure_field());

        basic_tab.append(not_auto);

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

        // Saved hide file name
        self.hide_field_name = self.hide_field_name_field.is(':checked');
        if (self.hide_field_name) {
            self.name_label.addClass('d-none');
        } else {
            self.name_label.removeClass('d-none');
        }

        // Saved auto_number field
        self.auto_number = self.auto_number_field.is(':checked');

        // Saved thousands_separators field
        self.thousands_separators = self.thousands_separators_field.is(':checked');

        // Saved Required field
        if (!self.is_force_required) {
            self.required = self.required_field.is(':checked');
        }

        if (self.required)
            self.name_label.append(' <b class="text-danger">*</b>');

        // Saved min value field
        self.min_value = $.trim(self.min_value_field.val());

        // Saved max value field
        self.max_value = $.trim(self.max_value_field.val());

        // Saved default value
        self.default_value = $.trim(self.default_value_field.val());

        // Saved decimal_places
        self.decimal_places = $.trim(self.decimal_places_field.val());

        // Unit measure
        self.unit_measure = $.trim(self.unit_measure_field.val());
        self.unit_measure_position = parseInt($('input:radio[name=unitPosition]:checked').val(), 10);

        self.input_view.html(self.get_input_view());

        let tableItem = self.attributeModal.find('#table_items_field');
        self.tableItem_id = tableItem.val();

        // Saved input and output
        self.inputs = self._input.get();
        self.outputs = self._output.get();
        self.events = self._event.get();

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

        var is_length_number = true;
        var min_val = $.trim(self.min_value_field.val());
        var max_val = $.trim(self.max_value_field.val());

        if (min_val != '' && $.isNumeric(min_val) == false) {
            self.min_value_field.addClass('is-invalid');
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
            is_length_number = false;
        } else {
            self.min_value_field.removeClass('is-invalid');
        }

        if (max_val != '' && $.isNumeric(max_val) == false) {
            self.max_value_field.addClass('is-invalid');
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
            is_length_number = false;
        } else {
            self.max_value_field.removeClass('is-invalid');
        }

        if (is_length_number && min_val != '' && max_val != '' && parseFloat(max_val) <= parseFloat(min_val)) {
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
            alert(gettext("Number of characters is not valid."));
        }

        var default_val = $.trim(self.default_value_field.val());
        if (default_val != '' && $.isNumeric(default_val) == false) {
            self.default_value_field.addClass('is-invalid');
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
        } else {
            self.default_value_field.removeClass('is-invalid');
        }

        var decimal_places_val = $.trim(self.decimal_places_field.val());
        if (decimal_places_val != '' && isPositiveIntNumber(decimal_places_val) == false) {
            self.decimal_places_field.addClass('is-invalid');
            if (is_valid) {
                self.attributeModal.find('#nav-basic-tab').click();
                is_valid = false;
            }
        } else {
            self.decimal_places_field.removeClass('is-invalid');
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
     * Unit of measure
     * @version 1.0.0
     */
    this.get_unit_measure_field = function() {
        self.unit_measure_field.val(self.unit_measure);
        self.unit_measure_field.removeClass('is-invalid');

        var form_row = $('<div class="form-row align-items-center"></div>');
        form_row.append($('<div class="col-3 mb-2"></div>').append(self.unit_measure_field));

        var col = $('<div class="col-auto mb-2"></div>');
        var custom_control = $('<div class="custom-control custom-radio"></div>');
        custom_control.append('<input type="radio" value="' + PREFIX_POSITION + '" id="unit_measure_prefix_field" name="unitPosition" class="custom-control-input" ' + (self.unit_measure_position == PREFIX_POSITION ? 'checked' : '') + '>');
        custom_control.append('<label class="custom-control-label" for="unit_measure_prefix_field"><small>' + gettext('Prefix (e.g. $100)') + '</small></label>');
        col.append(custom_control);
        form_row.append(col);

        var col = $('<div class="col-auto mb-2"></div>');
        var custom_control = $('<div class="custom-control custom-radio"></div>');
        custom_control.append('<input type="radio" value="' + SUFFIX_POSITION + '" id="unit_measure_suffix_field" name="unitPosition" class="custom-control-input" ' + (self.unit_measure_position == SUFFIX_POSITION ? 'checked' : '') + '>');
        custom_control.append('<label class="custom-control-label" for="unit_measure_suffix_field"><small>' + gettext('Suffix (e.g. 0.5 inches)') + '</small></label>');
        col.append(custom_control);
        form_row.append(col);

        return form_row;
    }

    /**
     * Number of Decimal Places to display
     * @version 1.0.0
     */
    this.get_decimal_places_field = function() {
        self.decimal_places_field.val(self.decimal_places);
        self.decimal_places_field.removeClass('is-invalid');

        var field = $('<div class="form-group col-sm-3"></div>');
        field.append(self.decimal_places_field);
        field.append('<div class="invalid-feedback">' + gettext('This field must be a number.') + '</div>');

        var row = $('<div class="form-row"></div>');
        row.append(field);
        return row;
    }

    /**
     * Get default value field
     * @version 1.0.0
     */
    this.get_default_value_field = function() {
        self.default_value_field.val(self.default_value);
        self.default_value_field.removeClass('is-invalid');

        var field = $('<div class="form-group col-sm-6"></div>');
        field.append(self.default_value_field);
        field.append('<div class="invalid-feedback">' + gettext('This field must be a number.') + '</div>');

        var row = $('<div class="form-row"></div>');
        row.append(field);
        return row;
    }

    /**
     * Get max value field
     * @version 1.0.0
     */
    this.get_max_value_field = function() {
        self.max_value_field.val(self.max_value);
        self.max_value_field.removeClass('is-invalid');

        var field = $('<div class="form-group col-sm-6"></div>');
        var input_group = $('<div class="input-group"></div>');
        input_group.append('<div class="input-group-prepend"><span class="input-group-text"><small>' + gettext('Maximum') + '</small></span></div>');
        input_group.append(self.max_value_field);
        input_group.append('<div class="invalid-feedback">' + gettext('This field must be a number.') + '</div>');
        field.append(input_group);
        return field;
    }

    /**
     * Get min value field
     * @version 1.0.0
     */
    this.get_min_value_field = function() {
        self.min_value_field.val(self.min_value);
        self.min_value_field.removeClass('is-invalid');

        var field = $('<div class="form-group col-sm-6"></div>');
        var input_group = $('<div class="input-group"></div>');
        input_group.append('<div class="input-group-prepend"><span class="input-group-text"><small>' + gettext('Minimum') + '</small></span></div>');
        input_group.append(self.min_value_field);
        input_group.append('<div class="invalid-feedback">' + gettext('This field must be a number.') + '</div>');
        field.append(input_group);
        return field;
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
     * thousands_separators field
     * @version 1.0.0
     */
    this.get_thousands_separators_field = function() {
        self.thousands_separators_field.prop('checked', self.thousands_separators);

        var field = $('<div class="form-group"></div>');
        var custom_control = $('<div class="custom-control custom-checkbox"></div>');
        custom_control.append(self.thousands_separators_field);
        custom_control.append('<label class="custom-control-label" for="thousands_separators_field"><b>' + gettext('Use thousands separators') + '</b></label>');
        field.append(custom_control);
        return field;
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
     * Get hide fieldname field
     * @version 1.0.0
     */
    this.get_auto_number_field = function() {
        self.auto_number_field.prop('checked', self.auto_number);

        var auto_number_field = $('<div class="form-group"></div>');
        var custom_control = $('<div class="custom-control custom-checkbox"></div>');
        custom_control.append(self.auto_number_field);
        custom_control.append('<label class="custom-control-label" for="auto_number_field"><b>' + gettext('Auto number') + '</b></label>');
        auto_number_field.append(custom_control);
        return auto_number_field;
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
        self.parent.enableDraggable(self.id);
        self.parent.items_management.splice(self.id);
        self.parent.resizeCanvas();

        // Enable option
        $('#table_items_field option[value="' + self.tableItem_id + '"]').prop('disabled', false);
        is_edited = true;
    }

    /**
     * Get dropdown action
     * @version 1.0.2
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

    this.init();
}