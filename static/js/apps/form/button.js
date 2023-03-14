function ButtonField(option)
{
    const SCREEN_TRANSITION = 'screen-transition';

    var self    = this;
    this.parent = option.parent;
    this.id = 'button-' + Date.now();
    this.outputs = option.output;
    
    this._input = new InOutput(1, option);
    this._output = new InOutput(2, option);
    this._event = new Event(self, option);

    // code
    this.code   = '';
    if (typeof(option.code) != 'undefined') {
        this.code = option.code;
    }

    // field_code
    this.field_code = option.field_code;

    // itemtype
    this.itemtype = null;
    if (typeof(option.itemtype) != 'undefined') {
        this.itemtype = option.itemtype;
    }

    // width
    this.width = 100;
    if (typeof(option.width) != 'undefined') {
        this.width = option.width;
    }

    this.bg_color = '#0069d9';
    if (typeof(option.bg_color) != 'undefined') {
        this.bg_color = option.bg_color;
    }
    this.bg_color_field = $('<input type="text" class="form-control d-inline-block" id="bg-color" value="' + self.bg_color + '" style="width: 180px">');

    this.text_color = '#FFFFFF';
    if (typeof(option.text_color) != 'undefined') {
        this.text_color = option.text_color;
    }
    this.text_color_field = $('<input type="text" class="form-control d-inline-block" id="text-color" value="' + self.text_color + '" style="width: 180px">');

    // Name
    this.name = gettext('Button');
    if (typeof(option.name) != 'undefined') {
        this.name = option.name;
    }
    this.name_label = $('<button type="button" class="btn btn-block"></button>');
    this.name_field = $('<input type="text" class="form-control" maxlength="150" id="name_field" value="' + this.name + '" required>');

    this.button_setting = $('<button type="button" class="btn btn-lg">' + this.name + '</button>');

    this.attributeModal = $('#attributeModal');

    this._item = $('<div class="wb-drop-item" id="' + self.id + '" style="width: ' + self.width + 'px; height: auto;"></div>');
    this._content = $('<div class="item-content"></div>');

    /**
     * Render Button html
     * @version 1.0.0
     */
    this.init = function()
    {
        self.name_label.text(self.name);
        self.name_label.css('background-color', '#' + self.bg_color).css('color', '#' + self.text_color);

        self._content.append(self.name_label);

        // Dropdown
        self._content.append(self.get_dropdown());

        self._input.init();
        self._output.init();
        self._event.init();
    }

    /**
     * Settings action
     * @version 1.0.0
     */
    this.settings = function()
    {
        self.attributeModal.find('.modal-title').html('<i class="fa fa-bold"></i> <span>' + interpolate(gettext('%s Settings'), [gettext('Button')]) + '</span>');
        
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

        self.name_field.blur(function() {
            self.button_setting.text(self.name_field.val());
        });

        // Create field code
        basic_tab.append(self.parent.display_field_code());
        self.attributeModal.find('#field_code_field').val(self.field_code);

        self.button_setting.css('background-color', self.bg_color).css('color', self.text_color);

        // Background color
        basic_tab.append(self.get_bg_color_field());
        self.create_color(self.bg_color_field, function(hexColor) {
            self.bg_color_field.val(hexColor);
            self.button_setting.css('background-color', hexColor);
        });

        // Text color
        basic_tab.append(self.get_text_color_field());
        self.create_color(self.text_color_field, function(hexColor) {
            self.text_color_field.val(hexColor);
            self.button_setting.css('color', hexColor);
        });


        var div = $('<div class="form-group"></div>');
        div.append("<label class='d-block'><b>" + gettext('Preview') + "</b></label>")
        div.append(self.button_setting);
        basic_tab.append(div);

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
            click: function(){
                return self.save();
            }
        });

        self.attributeModal.find('.modal-footer').find('#save-btn').remove();
        self.attributeModal.find('.modal-footer').append(savebtn);

        self.attributeModal.modal('show');
        self.attributeModal.find('#nav-basic-tab').click();
    }

    this.create_color = function(obj, callback) {
        obj.spectrum({
            allowEmpty:true,
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
            move: function (color) {
                var hexColor = "transparent";
                if (color.getAlpha()==1) {
                    hexColor = color.toHexString();
                }
                else {
                    hexColor = color.toRgbString();
                }
                callback(hexColor);
            },
            hide: function (color) {
                var hexColor = "transparent";
                if (color.getAlpha()==1) {
                    hexColor = color.toHexString();
                }
                else {
                    hexColor = color.toRgbString();
                }
                callback(hexColor);
            },

            palette: [
                ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(204, 204, 204)", "rgb(217, 217, 217)", "rgb(255, 255, 255)"],
                ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
                "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
                ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
                "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
                "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
                "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
                "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
                "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
                "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
                "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
                "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
                "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
            ]
        });
    }

    /**
     * Save action
     */
    this.save = function()
    {
        if ( ! self.validate()) {
            return false;
        }

        // Form is Updated
        is_edited = true;

        // Saved field name
        self.name = $.trim(self.name_field.val());
        self.name_label.text(self.name);

        self.bg_color = self.bg_color_field.val();
        self.text_color = self.text_color_field.val();

        self.name_label.css('background-color', self.bg_color).css('color', self.text_color);

        // Saved input and output
        self.inputs = self._input.get();
        self.outputs = self._output.get();
        self.events = self._event.get();

        // Hide modal
        self.attributeModal.modal('hide');

        self.parent.resizeCanvas();
    }

    /**
     * Validated form
     * @version 1.0.0
     */
    this.validate = function()
    {
        var is_valid = true;

        if ($.trim(self.name_field.val()) == '') {
            self.name_field.addClass('is-invalid');
            self.attributeModal.find('#nav-basic-tab').click();
            is_valid = false;
        } else {
            self.name_field.removeClass('is-invalid');
        }

        if (self.name_field.val().length > 150 ){
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
     * Get color field
     * @version 1.0.0
     */
    this.get_text_color_field = function()
    {
        self.text_color_field.val(self.text_color);

        var form = $('<div class="form-group color-options"></div>');
        form.append('<div class="clearfix"><label><b>' + gettext('Text color') + '</b></label></div>');
        form.append(self.text_color_field);
        return form;
    }

    /**
     * Get color field
     * @version 1.0.0
     */
    this.get_bg_color_field = function()
    {
        self.bg_color_field.val(self.bg_color);

        var form = $('<div class="form-group color-options"></div>');
        form.append('<div class="clearfix"><label><b>' + gettext('Background color') + '</b></label></div>');
        form.append(self.bg_color_field);
        return form;
    }

    /**
     * Get name field
     * @version 1.0.0
     */
    this.get_name_field = function()
    {
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
    this.delete = function()
    {
        $('#' + self.id).remove();
        self.parent.items_management.splice(self.id);
        self.parent.resizeCanvas();
        is_edited = true;
    }

    /**
     * Get dropdown action
     * @version 1.0.2
     */
    this.get_dropdown = function()
    {
        // Dropdown
        var dropdown = $('<div class="dropdown"/>');
        dropdown.append('<a class="dropdown-toggle text-secondary" href="javascript:void(0)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fa fa-cog"></i></a>');

        // dropdown-menu
        var dropdown_menu = $('<div class="dropdown-menu dropdown-menu-right"/>');

        var settings_link = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'dropdown-item',
            html: '<i class="fa fa-wrench" aria-hidden="true"></i>' + gettext('Settings'),
            click: function(){
                return self.settings();
            }
        });
        dropdown_menu.append(settings_link);

        var delete_link = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'dropdown-item',
            html: '<i class="fa fa-trash-o" aria-hidden="true"></i>' + gettext('Delete'),
            click: function(){
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