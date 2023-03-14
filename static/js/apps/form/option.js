function Option(option)
{
    var self = this;
    this.parent = option.parent;

    this.checked = false;
    if ( typeof(option.checked) != 'undefined' ) {
        this.checked = option.checked;
    }

    this.is_display_checkbox = true;
    if ( typeof(option.is_display_checkbox) != 'undefined' ) {
        this.is_display_checkbox = option.is_display_checkbox;
    }

    this.checkbox = $('<input type="checkbox" class="form-check-input position-static">');
    
    this.label = '';
    if ( typeof(option.label) != 'undefined' ) {
        this.label = option.label;
    }

    this.label_field = $('<input type="text" value="' + self.label + '" class="form-control form-control-sm" name="option_">');
    
    this.order = option.order;
    this.id    = option.auto_id;

    /**
     * Get view
     * @param int layout
     * @version 1.0.0
     */
    this.get_view = function()
    {
        var html = '';

        if (self.parent.is_Horizontal_Layout()) {
            html = '<div class="custom-control custom-checkbox custom-control-inline">';
        } else {
            html = '<div class="custom-control custom-checkbox">';
        }

        html += '<input type="checkbox" class="custom-control-input" ' + (self.checked ? 'checked' : '') + '>';
        html += '<label class="custom-control-label">' + self.label + '</label>';

        html += '</div>';

        return html;
    }

    /**
     * Get setting
     * @version 1.0.0
     */
    this.get_setting = function()
    {
        var option = $('<div class="clearfix pt-1 pb-1" data-index="' + self.id + '"></div>');
        option.append('<span class="ui-icon ui-icon-arrowthick-2-n-s sort-option-handle d-inline-block mr-1"></span>');

        if (self.is_display_checkbox) {
            self.checkbox.prop('checked', self.checked);

            var custom_control = $('<div class="form-check d-inline-block"></div>');
            custom_control.append(self.checkbox);
            option.append(custom_control);
        }

        self.label_field.val(self.label);

        // Set event blur for label field
        if (self.is_display_checkbox == false) {
            self.label_field.blur(function() {
                self.parent.gender_default_field();
            });          
        }

        var custom_label = $('<div class="d-inline-block w-230px mr-1"></div>');
        custom_label.append(self.label_field);
        option.append(custom_label);

        var minus_option = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'd-inline-block text-danger',
            html: '<i class="fa fa-minus-circle" aria-hidden="true"></i>',
            click: function(){
                return self.parent.remove_option(self.id);
            }
        });
        option.append(minus_option);

        return option;
    }
}