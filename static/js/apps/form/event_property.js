function EventProperty(objects, option) {
    var self = this;
    this.objects = objects;
    this.option = option;
    this.id = 1;
    this.event = [];
    this.inputs = [];
    this.outputs = [];
    this.option_table = '';
    this._content = $('<div class="item-content"></div>');
    this.list_object = objects.parent.table_management.tableList;

    /**
     * Create event tab
     * @version 1.0.1
     */
    this.create = function(index, obj) {
        let target_object = '';
        $.each(obj.target, function(index, item) {
            target_object += self.create_target_object(index + 1, obj.type, item);
        });

        let html = '<div class="form-row block-event mb-3" data-index="' + index + '">\
						<div class="col-11">\
							<fieldset class="fieldset">\
								<select class="form-control select-event">\
									<option value="1">' + gettext('Initial Event') + '</option>\
									<option value="2">' + gettext('Update Event') + '</option>\
								</select>\
								<div class="p-3 block-object">' + target_object + '</div>\
							</fieldset>\
						</div>\
						<div class="col btn-option"></div>\
					</div>';

        let content = $(html);

        content.find('.select-event option[value="' + obj.type + '"]').attr('selected', 'selected');

        return { id: index, content: content }
    }

    /**
     * Create target object
     * @version 1.0.1
     */
    this.create_target_object = function(index, event_type, obj) {
        let _action = '';

        // Each create action
        $.each(obj.action, function(index, item) {
            _action += self.create_action(index + 1, event_type, item);
        });

        let option_table = '<option value=""></option>';

        // Each create item
        $.each(self.list_object, function(i, item) {
            option_table += '<option value="' + item.id + '"' + (obj.object == item.id ? ' selected="selected"' : '') + '>' + item.name + '</option>';
        });

        let html = '<div class="form-group target-object" data-index="' + index + '">\
						<div class="form-row mb-3">\
							<label class="col-sm-4 col-form-label text-right">' + gettext('Target object') + '</label>\
							<div class="col-sm-7">\
								<select class="form-control select-table" data-target="' + index + '">' + option_table + '<select>\
							</div>\
							<div class="col btn-target"></div>\
						</div>' + _action + '</div>';

        return html;
    }

    /**
     * Create action for event
     * @version 1.0.1
     */
    this.create_action = function(index, type, obj) {
        let _condition = '';
        let event_type = (parseInt(type) == 2 ? 'updateEvent' : 'initialEvent');
        let option_condition = '<option value=""></option>';

        // Create item event
        $.each(self.objects.parent.eventList[event_type], function(i, item) {
            if (i != MULTIPLICATION && i != ACTION_ON_OTHER_OBJECTS) {
                option_condition += '<option value="' + i + '"' + (obj.event == i ? ' selected="selected"' : '') + '>' + item + '</option>';
            }
        });

        // Create condition for event
        $.each(obj.condition, function(index, item) {
            item.event_type = type;
            _condition += self.create_condition(index, item, obj.event);
        });

        let _action = '<div class="form-group block-action" data-index="' + index + '">\
						<div class="form-row mb-3">\
							<label class="col-sm-4 col-form-label text-right">' + gettext('Action event') + '</label>\
							<div class="col-7">\
								<select class="form-control select-action" data-action="' + index + '">' + option_condition + '<select>\
							</div>\
							<div class="col btn-action"></div>\
						</div>' + _condition + '</div>';

        return _action;
    }

    /**
     * Create condition
     * @version 1.0.1
     */
    this.create_condition = function(index, obj, action) {

        let options = "";

        switch (action) {
            case RECORD_SEARCH:
                self.inout = self.inputs;
                break;

            case SET_OUTPUT:
                self.inout = self.outputs;
                break;

            case RECORD_REGISTER:
                self.inout = self.inputs;
                break;

            case SUM:
                self.inout = self.inputs;
                break;
        }

        _.forEach(self.inout, function(item) {
            options += '<option value="' + item.code + '" ' + (obj.condition_1 == item.name ? ' selected="selected"' : '') + '>' + item.name + '</option>';
        });

        let order = (obj.event_type == 2) ? [' order-first', ' order-last'] : ['', ''];
        let operator = action == SUM ? '+' : '=';


        let _condition = '<div class="form-row block-condition mb-3" data-index="' + index + '">\
							<label class="col-sm-4 col-form-label text-right">' + gettext('Condition') + '</label>\
							<div class="col-6">\
								<div class="form-row">\
									<div class="col' + order[1] + '">\
										<select class="form-control select-condition-input">' + options + '<select>\
									</div>\
									<div class="col-1">\
										<p class="m-0 py-2">' + operator + '</p>\
									</div>\
									<div class="col' + order[0] + '">\
										<select class="form-control select-condition-table" data-selected="' + obj.condition_2 + '">' + self.option_table + '<select>\
									</div>\
								</div>\
							</div>\
							<div class="col btn-condition"></div>\
						</div>';

        return _condition;
    }

    /**
     * Render Text html
     * @version 1.0.1
     */
    this.init = function(_object = '') {
        self._content.off('.event');
        self._content.empty();
        self.event = [];
        self.option_table = '';
        self.id = 1;
        this.inputs = objects._input.get();
        this.outputs = objects._output.get();

        _object = _object == '' ? self.objects.parent.property.events : _object;

        if (_object != undefined && _object.length > 0) {
            $.each(_object, function(index, item) {
                self.event.push(self.create(index + 1, item));
            });
        } else {
            self.event.push(self.create(self.id, { type: 1, target: [{ object: 0, action: [{ event: '', condition: [] }] }] }));
        }

        $.each(self.event, function(index, item) {
            self._content.append(item.content);
        });

        self.rebuild_event();

        // Event change event
        self._content.on('change.event', '.select-event', function() {
            let id_event = $(this).parents('.block-event').data('index');

            $('.block-event[data-index="' + id_event + '"]').find('.block-object').empty();
            self.add_target(id_event);
        });

        // Event select table
        self._content.on('change.event', '.select-table', function(event) {
            let _option = '';
            $('#table_items_field [data-id="' + $(this).val() + '"] option').each(function() {
                _option += $(this).clone().removeAttr('disabled')[0].outerHTML;
            });

            if (_option) {
                self.option_table = _option;
                let id_event = $(this).parents('.block-event').data('index');
                let id_target = $(this).attr('data-target');

                $('.block-event[data-index="' + id_event + '"] .target-object[data-index="' + id_target + '"]').find('.select-condition-table').html(_option);
            }
        });

        // Event select action
        self._content.on('change.event', '.select-action', function() {
            let id_event = $(this).parents('.block-event').data('index');
            let id_action = $(this).data('action');

            let obj_event = _.find(self.event, function(o) { return o.id == id_event });
            obj_event.content.find('.block-action[data-index="' + id_action + '"]').find('.block-condition').remove();


            switch (Number($(this).val())) {
                case RECORD_SEARCH:
                    self.inout = self.inputs;
                    self.add_condition(id_event, id_action);
                    break;

                case SET_OUTPUT:
                    self.inout = self.outputs;
                    self.add_condition(id_event, id_action);
                    break;

                case RECORD_REGISTER:
                    self.inout = self.inputs;
                    self.add_condition(id_event, id_action);
                    break;

                case SUM:
                    self.inout = self.inputs;
                    self.add_condition(id_event, id_action);
                    break;
            }

        });

        $('#attributeModal').off('shown.bs.tab').on('shown.bs.tab', function(e) {
            if (e.target.getAttribute('aria-controls') == 'nav-event') {
                let _object = self.get(true);
                self.init(_object);
                self.validate();
            }
        });

        return self._content;
    }

    /**
     * Get event
     * @version 1.0.1
     */
    this.get = function(flat = false) {
        let _event = [];

        // Each row get data
        self._content.find('.block-event').each(function(index) {
            let _obj = { type: parseInt($(this).find('.select-event').val()), target: [] };
            var target = {};

            $(this).find('.target-object').each(function() {
                target = { 'object': $(this).find('.select-table').val(), action: [] };
                var action = {};

                $(this).find(".block-action").each(function() {
                    action = { event: parseInt($(this).find(".select-action").val()), condition: [] };

                    $(this).find(".block-condition").each(function() {
                        action.condition.push({ condition_1: $(this).find('select:first').val(), condition_2: $(this).find('select:last').val() })
                    });

                    target.action.push(action);
                });

                _obj.target.push(target);
            });

            _event.push(_obj);
        });

        if (flat == false) {
            self.objects.parent.property.events = _event;
        }

        return _event;
    }

    /**
     * Add event
     * @version 1.0.1
     */
    this.add_event = function() {
        self.id++;
        let item = self.create(self.id, { type: 1, target: [{ object: 0, action: [{ event: '', condition: [] }] }] });
        self.event.push(item);
        self._content.append(item.content);
        self.rebuild_event();
    }

    /**
     * Remove event
     * @version 1.0.1
     */
    this.remove_event = function(obj) {
        let id = $(obj).attr('data-index');

        _.remove(self.event,  function(item)  {  
            return  item.id == id;
        });

        obj.remove();

        self.rebuild_event();
    }

    /**
     * Add action
     * @version 1.0.1
     */
    this.add_target = function(id_event) {
        let obj_event = _.find(self.event, function(o) { return o.id == id_event });

        let index = self.get_index(obj_event.content.find('.target-object:last'));

        let item = self.create_target_object(index, obj_event.content.find('.select-event option:selected').val(), {});
        obj_event.content.find('.block-object').append(item);
        self.add_action(id_event, index);
        self.rebuild_target(id_event);
    }

    /**
     * Remove action
     * @version 1.0.1
     */
    this.remove_target = function(id_event, obj) {
        $(obj).remove();
        self.rebuild_target(id_event);
    }


    /**
     * Add action
     * @version 1.0.1
     */
    this.add_action = function(id_event, id_target) {
        let obj_event = _.find(self.event, function(o) { return o.id == id_event });
        let index = self.get_index(obj_event.content.find('.block-action:last'));

        let item = self.create_action(index, obj_event.content.find('.select-event option:selected').val(), {});
        obj_event.content.find('.target-object[data-index="' + id_target + '"]').append(item);
        self.rebuild_action(id_event, id_target);
    }

    /**
     * Remove action
     * @version 1.0.1
     */
    this.remove_action = function(id_event, id_target, obj) {
        $(obj).remove();
        self.rebuild_action(id_event, id_target);
    }

    /**
     * Add condition
     * @version 1.0.1
     */
    this.add_condition = function(id_event, id_action) {
        let obj_event = _.find(self.event, function(o) { return o.id == id_event });

        let obj_action = obj_event.content.find('.block-action[data-index="' + id_action + '"]');
        let action = obj_action.find('.select-action option:selected').val();
        let item = self.create_condition(id_action, { event_type: obj_event.content.find('.select-event option:selected').val() }, action);

        obj_action.append(item);
        self.rebuild_condition(id_event, id_action);
    }

    /**
     * Remove condition
     * @version 1.0.1
     */
    this.remove_condition = function(id_event, id_action, obj) {
        $(obj).remove();
        self.rebuild_condition(id_event, id_action);
    }


    /**
     * Rebuild event
     * @version 1.0.1
     */
    this.rebuild_event = function() {
        var plus_option = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'd-inline-block plus mr-1',
            css: {
                fontSize: "18px",
                lineHeight: "38px"
            },
            html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
            click: function() {
                return self.add_event();
            }
        });

        let _length = self.event.length;
        self._content.find('.btn-option').empty();
        self._content.find('.block-event').each(function(index) {
            let that = this;
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
                    return self.remove_event(that);
                }
            });

            if (_length > 1) {
                $(this).find('.btn-option').append(minus_option);
            }

            if (_length == (index + 1)) {
                $(this).find('.btn-option').prepend(plus_option);
            }

            if (!$(this).find("select:not(.select-event) option[selected='selected']").length) {
                $(this).find('select:not(.select-event)').val(0);
            }

            self.rebuild_target($(this).attr('data-index'));
        })
    }

    /**
     * Rebuild target object
     * @version 1.0.1
     */
    this.rebuild_target = function(id_event) {
        var plus_option = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'd-inline-block plus mr-1',
            css: {
                fontSize: "18px",
                lineHeight: "38px"
            },
            html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
            click: function() {
                return self.add_target(id_event);
            }
        });

        let obj_event = _.find(self.event, function(o) { return o.id == id_event });
        let _length = obj_event.content.find('.target-object').length;

        obj_event.content.find('.btn-target').empty();
        obj_event.content.find('.target-object').each(function(index) {
            let that = this;
            var minus_option = $("<a/>", {
                href: 'javascript:void(0)',
                class: 'd-inline-block text-danger',
                css: {
                    fontSize: "18px",
                    lineHeight: "38px"
                },
                html: '<i class="fa fa-minus-circle" aria-hidden="true"></i>',
                click: function() {
                    return self.remove_target(id_event, that);
                }
            });

            if (_length > 1) {
                $(this).find('.btn-target').append(minus_option);
            }

            if (_length == (index + 1)) {
                $(this).find('.btn-target').prepend(plus_option);
            }

            if (!$(this).find("select option[selected='selected']").length) {
                $(this).find('select').val(0);
            }

            let _option = '';
            $('#table_items_field [data-id="' + $(this).find('.select-table').val() + '"] option').each(function() {
                _option += $(this).clone().removeAttr('disabled')[0].outerHTML;
            });

            if (_option) {
                self.option_table = _option;
            }

            self.rebuild_action(id_event, $(this).attr('data-index'));
        });
    }

    /**
     * Rebuild action
     * @version 1.0.1
     */
    this.rebuild_action = function(id_event, id_target) {
        var plus_option = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'd-inline-block plus mr-1',
            css: {
                fontSize: "18px",
                lineHeight: "38px"
            },
            html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
            click: function() {
                return self.add_action(id_event, id_target);
            }
        });

        let obj_event = _.find(self.event, function(o) { return o.id == id_event });
        let _length = obj_event.content.find('.target-object[data-index="' + id_target + '"]').find('.block-action').length;


        obj_event.content.find('.target-object[data-index="' + id_target + '"]').find('.btn-action').empty();
        obj_event.content.find('.target-object[data-index="' + id_target + '"]').find('.block-action').each(function(index) {
            var that = this;
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
                    return self.remove_action(id_event, id_target, that);
                }
            });

            if (_length > 1) {
                $(this).find('.btn-action').append(minus_option);
            }

            if (_length == (index + 1)) {
                $(this).find('.btn-action').prepend(plus_option);
            }

            if (!$(this).find("select option[selected='selected']").length) {
                $(this).find('select').val(0);
            }

            self.rebuild_condition(id_event, $(this).attr('data-index'));
        });
    }

    /**
     * Rebuild condition
     * @version 1.0.1
     */
    this.rebuild_condition = function(id_event, id_action) {
        var plus_option = $("<a/>", {
            href: 'javascript:void(0)',
            class: 'd-inline-block plus mr-1',
            css: {
                fontSize: "18px",
                lineHeight: "38px"
            },
            html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
            click: function() {
                return self.add_condition(id_event, id_action);
            }
        });

        let obj_event = _.find(self.event, function(o) { return o.id == id_event });
        let obj_action = obj_event.content.find('.block-action[data-index="' + id_action + '"]');
        let _length = obj_action.find('.block-condition').length;

        obj_action.find('.btn-condition').empty();
        obj_action.find('.block-condition').each(function(index) {
            var that = this;
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
                    return self.remove_condition(id_event, id_action, that);
                }
            });

            if (_length > 1 || obj_event.content.find('.select-event option:selected').val() == 2) {
                $(this).find('.btn-condition').append(minus_option);
            }

            if (_length == (index + 1)) {
                $(this).find('.btn-condition').prepend(plus_option);
            }

            let _select_condition = $(this).find('.select-condition-table');
            let option_condition = self.option_table;

            if (obj_action.find('.select-action option:selected').val() == SET_OUTPUT) {
                _.forEach(self.inputs, function(item) {
                    option_condition += '<option>' + item.name + '</option>';
                });
            }

            _select_condition.html(option_condition).find('option[value="' + _select_condition.attr('data-selected') + '"]').attr('selected', 'selected');
        });
    }

    /**
     * Get index
     * @version 1.0.1
     */
    this.get_index = function(obj) {
        let index = parseInt(obj.attr('data-index'), 10);
        return _.isNaN(index) ? 1 : (index + 1);
    }

    /**
     * Validated events
     * @version 1.0.2
     */
    this.validate = function() {
        let is_invalid = false;

        // Each row get data
        self._content.find('.block-event').each(function(index) {
            $(this).find('.target-object').each(function() {
                let select_table = $(this).find('.select-table');

                $(this).find(".block-action").each(function() {
                    if ($(this).find(".select-action").val() && select_table.val() == '') {
                        select_table.addClass('is-invalid');
                        is_invalid = true;
                        return;
                    }
                });
            });
        });

        return is_invalid;
    }
}