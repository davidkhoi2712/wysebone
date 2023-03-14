function LabelField(option)
{
    var self    = this;
    this.parent = option.parent;
    this.id     = 'label-' + Date.now();

    this.outputs = option.output;
    
    this._input = new InOutput(1, option);
    this._output = new InOutput(2, option);
    this._event = new Event(self, option);

    // code
    this.code   = '';
    if (typeof(option.code) != 'undefined') {
        this.code = option.code;
    }

    // itemtype
    this.itemtype = null;
    if (typeof(option.itemtype) != 'undefined') {
        this.itemtype = option.itemtype;
    }

    // width
    this.width = 120;
    if (typeof(option.width) != 'undefined') {
        this.width = option.width;
    }

    // field_code
    this.field_code = option.field_code;

    // Label
    this.name = gettext('Label');
    if (typeof(option.name) != 'undefined') {
        this.name = option.name;
    }

    this.display = gettext('Label');
    if (typeof(option.display) != 'undefined') {
        this.display = option.display;
    }

    this.label_view  = $("<div>");
    this.label_field = $('<textarea id="label_field"></textarea>');

    this.attributeModal = $('#attributeModal');

    this._item = $('<div class="wb-drop-item" id="' + self.id + '" style="width: ' + self.width + 'px; height: auto;"></div>');
    this._content = $('<div class="item-content"></div>');

    /**
     * Render Label html
     * @version 1.0.0
     */
    this.init = function()
    {
        self.label_view.html(self.display);
        self._content.append(self.label_view);

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
        self.attributeModal.find('.modal-title').html('<img src="' + base_url + '/static/images/icon/' + self.itemtype.icon + '"> <span>' + interpolate(gettext('%s Settings'), [gettext('Label')]) + '</span>');
        
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

        basic_tab.append(self.label_field);

        self.label_field.summernote({
            tooltip: false,
            height: 100,
            dialogsInBody: true,
            lang: lang_code,
            toolbar: [
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['fontsize', ['fontsize']],
                ['color', ['forecolor']],
                ['font', ['strikethrough', 'superscript', 'subscript']],
                ['para', ['ul', 'ol', 'paragraph']]
            ]
        });
        self.label_field.summernote('code', self.display);

        basic_tab.append(self.parent.display_field_code());
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
            click: function(){
                return self.save();
            }
        });

        self.attributeModal.find('.modal-footer').find('#save-btn').remove();
        self.attributeModal.find('.modal-footer').append(savebtn);

        self.attributeModal.modal('show');
    }

    /**
     * Save action
     */
    this.save = function()
    {
        if (!self.validate()) {
            return false;
        }

        // Form is Updated
        is_edited = true;
        
        self.display = self.label_field.summernote('code')
        self.label_view.html(self.display).find('p').css('margin-bottom', 5);

        self._item.css('width', 'auto');
        self.width = self._item.outerWidth() + 2;

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
     * @version 1.0.2
     */
    this.validate = function() {
        var is_valid = true;
        
        if ($.trim(self.label_field.summernote('code').replace(/(<[^>]*>|\x26nbsp;)/ig,"")) == '') {
            self.label_field.next().addClass('is-invalid');
            self.attributeModal.find('#nav-basic-tab').click();
            is_valid = false;
        } else {
            self.label_field.next().removeClass('is-invalid');
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
        var dropdown_menu = $('<div class="dropdown-menu dropdown-menu-right dropdown-menu-lg-right"/>');

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