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
    this.bg_color = '#0069d9';
    if (typeof(self.parent.property.bg_color) != 'undefined') {
        this.bg_color = self.parent.property.bg_color;
    }
    this.bg_color_field = $('<input type="text" class="form-control d-inline-block" id="bg-color" value="' + self.bg_color + '" style="width: 180px">');

    this.attributeModal = $('#attributeModal');


    this.init = function() {
        self.settings();
    }

    this.create_color = function(obj, callback) {
        obj.spectrum({
            allowEmpty: true,
            color: obj.val(),
            showInput: true,
            containerClassName: "full-spectrum",
            showInitial: true,
            showPalette: true,
            showSelectionPalette: true,
            showAlpha: true,
            maxPaletteSize: 10,
            preferredFormat: "hex",
            localStorageKey: "spectrum.demo",
            move: function(color) {
                var hexColor = "transparent";
                if (color.getAlpha() == 1) {
                    hexColor = color.toHexString();
                } else {
                    hexColor = color.toRgbString();
                }
                callback(hexColor);
            },
            hide: function(color) {
                var hexColor = "transparent";
                if (color.getAlpha() == 1) {
                    hexColor = color.toHexString();
                } else {
                    hexColor = color.toRgbString();
                }
                callback(hexColor);
            },

            palette: [
                ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(204, 204, 204)", "rgb(217, 217, 217)", "rgb(255, 255, 255)"],
                ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
                    "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"
                ],
                ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
                    "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
                    "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
                    "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
                    "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
                    "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
                    "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
                    "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
                    "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
                    "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"
                ]
            ]
        });
    }


    /**
     * Settings action
     * @version 1.0.0
     */
    this.settings = function() {
        self.attributeModal.find('.modal-title').html('<i class="fa fa-desktop" aria-hidden="true"></i> <span>' + interpolate(gettext('%s Settings'), [gettext('Application')]) + '</span>');

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

        // Background color
        basic_tab.append(self.get_bg_color_field());
        self.create_color(self.bg_color_field, function(hexColor) {
            self.bg_color = hexColor;
        });

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
     * Get color field
     * @version 1.0.0
     */
    this.get_bg_color_field = function() {
        self.bg_color_field.val(self.bg_color);

        var form = $('<div class="form-group color-options"></div>');
        form.append('<div class="clearfix"><label><b>' + gettext('Background color') + '</b></label></div>');
        form.append(self.bg_color_field);
        return form;
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

        // Form is Updated
        is_edited = true;

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
     * Get property data
     * @version 1.0.2
     */
    this.get_property_data = function() {
        return {
            bg_color: self.bg_color,
            field_code: self.field_code,
            inputs: self._input.get(),
            outputs: self._output.get(),
            events: self._event.get()
        }
    }

    this.init();

}