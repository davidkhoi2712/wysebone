/**
 * Lookup Field
 * 
 * @author Nguyen Xuan Sanh
 * @version 1.0.2
 * @copyright   Copyright 2020.
 */
function LookupField(option) {
    var self = this;
    this.parent = option.parent;
    this.id = 'lookup-' + Date.now();

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
    this.name = gettext('Lookup');
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

    this.attributeModal = $('#attributeModal');

    this.select = $('<select class="form-control"></select>');

    this._item = $('<div class="wb-drop-item" id="' + self.id + '" style="width: ' + self.width + 'px; height: auto;"></div>');
    this._content = $('<div class="item-content"></div>');

    /**
     * Render Text html
     * @version 1.0.2
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

        self._content.append(self.select);

        // Dropdown
		self._content.append(self.get_dropdown());
		
		// Help text
        if (self.help_text != '') {
            self._content.append('<small class="form-text text-muted">' + self.help_text + '</small>');
        }

        self._input.init();
        self._output.init();
        self._event.init();
    }

    /**
     * Settings action
     * @version 1.0.2
     */
    this.settings = function() {
        self.attributeModal.find('.modal-title').html('<img src="' + base_url + '/static/images/icon/' + self.itemtype.icon + '"> <span>' + interpolate(gettext('%s Settings'), [gettext('Lookup')]) + '</span>');

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

        // Saved Required field
        self.required = self.required_field.is(':checked');

        if (self.required)
            self.name_label.append(' <b class="text-danger">*</b>');

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
     * @version 1.0.2
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
     * Get hide fieldname field
     * @version 1.0.2
     */
    this.get_hide_fieldname_field = function() {
        self.hide_field_name_field.prop('checked', self.hide_field_name);

        var field = $('<div class="form-group"></div>');
        var custom_control = $('<div class="custom-control custom-checkbox"></div>');
        custom_control.append(self.hide_field_name_field);
        custom_control.append('<label class="custom-control-label" for="hide_field_name_field"><b>' + gettext('Hide field name') + '</b></label>');
        field.append(custom_control);
        return field;
    }

    /**
     * Get required field
     * @version 1.0.2
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
     * @version 1.0.2
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

    self.init();
}