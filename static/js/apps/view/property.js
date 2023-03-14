function Property(parent, option) {
    var self = this;
    this.parent = parent;
    this.option = option;

    this._input = new InOutProperty(1, parent, option);
    this._output = new InOutProperty(2, parent, option);
    this._event = new EventProperty(self, option);

    // field_code
    this.field_code = self.parent.property.field_code;

    // field_name
    this.name = $('#app_name').val();
    this.field_name_label = $('<span class="label-name"></span>');
    this.field_name_field = $('<input type="text" class="form-control" maxlength="150" id="field_name_field" value="' + this.name + '" required>');

    this.attributeModal = $('#attributeModal');


    this.init = function() {
        self.settings();
    }


    /**
     * Settings action
     * @version 1.0.0
     */
    this.settings = function() {
        self.attributeModal.find('.modal-title').html('<img src="' + base_url + '/static/images/icon/list_object.png"> <span>' + interpolate(gettext('%s Settings'), [gettext('List Table')]) + '</span>');

        self.attributeModal.find('.no-nav').addClass('d-none');
        self.attributeModal.find('.is-nav').removeClass('d-none');

        self.attributeModal.find('#nav-basic-tab').removeClass('d-none');
        self.attributeModal.find('#nav-input-tab').removeClass('d-none');
        self.attributeModal.find('#nav-output-tab').removeClass('d-none');
        self.attributeModal.find('#nav-event-tab').removeClass('d-none');
        self.attributeModal.find('#nav-table-link-tab').addClass('d-none');

        // Basic tab
        var basic_tab = self.attributeModal.find('#nav-basic');
        basic_tab.empty();

        // Create field name
        basic_tab.append(self.get_name_field());

        basic_tab.append(self.display_field_code());
        self.attributeModal.find('#field_code_field').val(self.field_code);

        // Input tab
        self.attributeModal.find('#nav-input').empty().append(self._input.init());
        self.attributeModal.find('#nav-output').empty().append(self._output.init());
        self.attributeModal.find('#nav-event').empty().append(self._event.init());

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
     * Display field code
     * @version 1.0.0
     */
    this.display_field_code = function() {
        let html = ' <div class="row form-group"> ' +
            '     <div class="col-md-6"> ' +
            '         <label for="field_code_field"><b>' + gettext("Field Code") + '</b> <b class="text-danger">*</b></label> ' +
            '         <input type="text" class="form-control" id="field_code_field" value="" required readonly> ' +
            '         <div class="invalid-feedback"></div>' +
            '     </div> ' +
            '     <div class="col-md-12"> ' +
            '         <small class="form-text text-muted">' + gettext("Each field in a Wysebone app has a Field Code, that is unique within the App. These field codes are necessary when creating, retrieving, and updating data via API.") + '</small> ' +
            '     </div> ' +
            ' </div>';
        return html;
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
        $('#app_name').val(self.name);

        // save field code
        self.field_code = $.trim(self.attributeModal.find('#field_code_field').val());
        self.attributeModal.find('#field_code_field').val(self.field_code);

        // Saved input and output
        self.inputs = self._input.get();
        self.events = self._event.get();

        self.parent.property = self.get_property_data();

        // Hide modal
        self.attributeModal.modal('hide');
    }

    /**
     * Validated form
     * @version 1.0.2
     */
    this.validate = function() {
        var is_valid = true;

        // Validate field name required
        if ($.trim(self.field_name_field.val()) == '') {
            self.field_name_field.addClass('is-invalid');
            self.attributeModal.find('#nav-basic-tab').click();
            is_valid = false;
        } else {
            self.field_name_field.removeClass('is-invalid');
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
     * Get property data
     * @version 1.0.2
     */
    this.get_property_data = function() {
        return {
            name: self.name,
            field_code: self.field_code,
            inputs: self._input.get(),
            outputs: self._output.get(),
            events: self._event.get()
        }
    }

    this.init();

}