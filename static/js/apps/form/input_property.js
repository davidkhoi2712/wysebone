function InOutProperty(input_type, parent, option) {
    var self = this;
    this.parent = parent;
    this.option = option;
    this.type = (input_type == 1 ? 'input' : 'output');
    this._content = $('<div class="item-content"></div>');

    this.field_code = [];
    this.id = 1;
    this.inputs = [];

    this.create = function(index, obj) {

        let input = '<input type="text" class="form-control input_option" value="' + obj.code + '" />';

        if (self.type == 'input') {
            let options = "";

            $.each(self.option.input, function(index, item) {
                let selected = (item.code == obj.code ? ' selected="selected"' : '');
                options += '<option' + selected + ' value="' + item.code + '">' + item.code + '</option>';
            });

            input = '<select class="form-control input_option">' + options + '</select>';
        }

        var html = $('<div class="form-row" data-index="' + index + '">\
						<div class="col-10">\
							<div class="input-group mb-2 mr-sm-2">\
								<div class="input-group-prepend">\
									<div class="input-group-text">' + obj.name + '</div>\
								</div>\
								' + input + '\
							</div>\
						</div>\
						<div class="col btn_option"></div>\
					</div>');



        return { id: index, content: html };
    }

    this.init = function() {
        self._content.empty();
        self.inputs = [];
        self.id = 1;

        let objects = (self.type == 'input') ? self.parent.property.inputs : self.parent.property.outputs;
        if (objects != undefined && objects.length > 0) {
            $.each(objects, function(index, item) {
                self.inputs.push(self.create(index + 1, item));
            });
        } else {
            self.inputs.push(self.create(self.id, { name: _.upperFirst(self.type) + ' ' + self.id, code: '' }));
        }

        $.each(self.inputs, function(index, item) {
            self._content.append(item.content);
        });

        self.rebuild();

        self._content.on('change.inputs', 'input.input_option', function() {
            return self.validate();
        });

        return self._content;
    }

    /**
     * Add input
     * @version 1.0.1
     */
    this.add = function() {
        self.id++;
        let item = self.create(self.id, { name: self.type + ' ' + self.id, code: '' });
        self.inputs.push(item);
        self._content.append(item.content);
        self.rebuild();
    }

    /**
     * Remove input
     * @version 1.0.1
     */
    this.remove = function(obj) {
        let id = $(obj).attr('id');

        _.remove(self.inputs,  function(item)  {  
            return  item.id == id;
        });
        self._content.find('[data-index="' + id + '"]').remove();

        self.rebuild();
    }

    /**
     * Get input
     * @version 1.0.1
     */
    this.get = function() {
        let _inputs = [];

        self._content.find('.form-row').each(function(index) {
            let _obj = { name: $(this).find('.input-group-text').text(), code: $(this).find('.input_option').val() };

            if ($(this).find('.input_option').val())
                _inputs.push(_obj);
        });

        return _inputs;
    }

    /**
     * Rebuild input
     * @version 1.0.1
     */
    this.rebuild = function() {
        var plus_option = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'd-inline-block plus mr-1',
            css: {
                fontSize: "18px",
                lineHeight: "38px"
            },
            html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
            click: function() {
                return self.add();
            }
        });


        let _length = self.inputs.length;
        self._content.find('.btn_option').empty();
        self._content.find('.form-row').each(function(index) {
            $(this).find('.input-group-text').text(_.upperFirst(self.type) + ' ' + (index + 1));

            var minus_option = $("<a/>", {
                href: 'javascript:void(0)',
                class: 'd-inline-block text-danger',
                id: $(this).attr('data-index'),
                css: {
                    fontSize: "18px",
                    lineHeight: "38px"
                },
                html: '<i class="fa fa-minus-circle" aria-hidden="true"></i>',
                click: function() {
                    return self.remove(this);
                }
            });

            if (_length > 1) {
                $(this).find('.btn_option').append(minus_option);
            }

            if (_length == (index + 1)) {
                $(this).find('.btn_option').prepend(plus_option);
            }

            if (!$(this).find("select.input_option option[selected='selected']").length) {
                $(this).find('select.input_option').val(0);
            }
        });
    }

    /**
     * Validated events
     * @version 1.0.2
     */
    this.validate = function() {
        let is_invalid = false;

        // Each row get data
        self._content.find('input.input_option').each(function() {
            let that = $(this);
            $('input.input_option').removeClass('is-invalid').not(this).each(function() {
                if (that.val() != '' && $(this).val() != '' && that.val() == $(this).val()) {
                    $('#attributeModal').find('#nav-output-tab').click();
                    $(that).addClass('is-invalid');
                    is_invalid = true;
                    return;
                }
            });
        });

        return is_invalid;
    }

}