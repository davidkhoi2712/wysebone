/**
 * Event of Objects
 * 
 * @author Nguyen Xuan Sanh
 * @version 1.0.1
 * @copyright   Copyright 2020.
 */
function Event(objects, option) {
	var self = this;
	this.option = option;
	this.id = 1;
	this.event = [];
	this.inputs = [];
	this.outputs = [];
	this.option_table = '';
	this._content = $('<div class="item-content"></div>');


	/**
	* Create event tab
	* @version 1.0.1
	*/
	this.create = function (index, obj) {
		let target_object = '';
		$.each(obj.target, function (index, item) {
			target_object += self.create_target_object(index + 1, obj.type, item);
		})

		let html = '<div class="form-row block-event mb-3" data-index="' + index + '">\
						<div class="col-11">\
							<fieldset class="fieldset">\
								<select class="form-control select-event">\
									<option value="'+INITIALEVENT+'">'+ gettext('Initial Event') + '</option>\
									<option value="'+UPDATEEVENT+'">'+ gettext('Update Event') + '</option>\
									<option value="'+CLICKEVENT+'">'+ gettext('Click Event') + '</option>\
								</select>\
								<div class="p-3 block-object">'+ target_object + '</div>\
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
	this.create_target_object = function (index, event_type, obj) {
		let _action = '';

		// Each create action
		$.each(obj.action, function (index, item) {
			_action += self.create_action(index + 1, event_type, item);
		})

		let option_table = '<option value=""></option>';

		if (event_type == CLICKEVENT) {
			$.each(_.filter(self.option.parent.listApp, { type: 1 }), function (i, item) {
				option_table += '<option value="' + item.code + '"' + (obj.object == item.code ? ' selected="selected"' : '') + '>' + item.name + '</option>';
			})
			
			$.each(objects.parent.items_management.get_list_objects(IFRAME), function (i, item) {
				option_table += '<option value="' + item + '"' + (obj.object == item ? ' selected="selected"' : '') + '>' + item + '</option>';
			})
		}
		else {
			// Each create item
			if (objects instanceof ListObjectField) {
				$.each(_.filter(self.option.parent.listApp, { type: 2 }), function (i, item) {
					option_table += '<option value="' + item.code + '"' + (obj.object == item.code ? ' selected="selected"' : '') + '>' + item.name + ' (' + gettext('List Table') + ')</option>';
				})
			} else if (objects instanceof LookupField) {
				$.each(self.option.parent.table_management.tableList, function (i, item) {
					option_table += '<option value="' + i + '"' + (obj.object == i ? ' selected="selected"' : '') + '>' + item.name + '</option>';
				})
			} else if (objects instanceof IframeField) {
				$.each(_.filter(self.option.parent.listApp, { type: 1 }), function (i, item) {
					option_table += '<option value="' + item.code + '"' + (obj.object == item.code ? ' selected="selected"' : '') + '>' + item.name + '</option>';
				})
			} else {
				// Delete the user from the tableList
				tableList = _.clone(self.option.parent.table_management.tableList);
				tableList = _.omit(self.option.parent.table_management.tableList, ['user']);

				$.each(tableList, function (i, item) {
					option_table += '<option value="' + i + '"' + (obj.object == i ? ' selected="selected"' : '') + '>' + item.name + '</option>';
				})

				$.each(objects.parent.items_management.get_list_objects(LIST_OBJECT), function (i, item) {
					option_table += '<option value="' + item + '"' + (obj.object == item ? ' selected="selected"' : '') + '>' + item + '</option>';
				})
			}
		}

		let html = '<div class="form-group target-object" data-index="' + index + '">\
						<div class="form-row mb-3">\
							<label class="col-sm-4 col-form-label text-right">'+ gettext('Target object') + '</label>\
							<div class="col-sm-7">\
								<select class="form-control select-table" data-target="'+ index + '">' + option_table + '<select>\
							</div>\
							<div class="col btn-target"></div>\
						</div>'+ _action + '</div>';

		return html;
	}

	/**
     * Create action for event
     * @version 1.0.1
     */
	this.create_action = function (index, type, obj) {
		let _condition = '';
		let event_type = 'initialEvent';
		let option_condition = '<option value=""></option>';

		switch (parseInt(type)) {
			case UPDATEEVENT:
				event_type = 'updateEvent';
				break;
			
			case CLICKEVENT:
				event_type = 'clickEvent';
				break;
		}

		// Create item event
		$.each(self.option.parent.eventList[event_type], function (i, item) {
			option_condition += '<option value="' + i + '"' + (obj.event == i ? ' selected="selected"' : '') + '>' + item + '</option>';
		})

		// Get block Value
		if (objects instanceof LookupField && obj.event == DISPLAY_CONTENT) {
			_condition = '<div class="form-row mb-3 block-value"><label class="col-sm-4 col-form-label text-right">' + gettext('Value') + '</label>\
						  <div class="col-6">\
									<select class="form-control select-value-table" data-selected="'+ obj.value + '">' + self.option_table + '<select>\
							</div></div>';
		}

		// Create condition for event
		$.each(obj.condition, function (index, item) {
			item.event_type = type;
			_condition += self.create_condition(index, item, obj.event);
		})

		let _action = '<div class="form-group block-action" data-index="' + index + '">\
						<div class="form-row mb-3">\
							<label class="col-sm-4 col-form-label text-right">'+ gettext('Action event') + '</label>\
							<div class="col-7">\
								<select class="form-control select-action" data-action="'+ index + '">' + option_condition + '<select>\
							</div>\
							<div class="col btn-action"></div>\
						</div>'+ _condition + '</div>';

		return _action;
	}

	/**
     * Create condition
     * @version 1.0.1
     */
	this.create_condition = function (index, obj, action) {

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

			case DISPLAY_CONTENT:
				self.inout = self.inputs;
				break;

			default:
				self.inout = self.inputs;
				break;
		}

		_.forEach(self.inout, function (item) {
			options += '<option value="' + item.code + '" ' + (obj.condition_1 == item.code ? ' selected="selected"' : '') + '>' + item.name + '</option>';
		})

		let order = (obj.event_type == 2) ? [' order-first', ' order-last'] : ['', ''];
		let operator = action == SUM ? '+' : '=';

		let _condition = '<div class="form-row block-condition mb-3" data-index="' + index + '">\
							<label class="col-sm-4 col-form-label text-right">'+ (action == DISPLAY_CONTENT ? gettext('Display') : gettext('Condition')) + '</label>\
							<div class="col-6"><div class="form-row">';


		if (action == DISPLAY_CONTENT) {
			_condition += '<div class="col">\
								<select class="form-control select-condition-table" data-selected="'+ obj.condition_1 + '">' + self.option_table + '<select>\
							</div>';
		}
		else if (action == SCREEN_DISPLAY) {
			_condition += '<div class="col">\
								<select class="form-control select-condition-input">' + options + '<select>\
							</div>';
		}
		else {
			_condition += '<div class="col' + order[1] + '">\
								<select class="form-control select-condition-input">'+ options + '<select>\
							</div>\
							<div class="col-1" >\
								<p class="m-0 py-2">'+ operator + '</p>\
							</div>\
							<div class="col'+ order[0] + '">\
								<select class="form-control select-condition-table" data-selected="'+ obj.condition_2 + '">' + self.option_table + '<select>\
							</div>';
		}

		_condition += '</div></div><div class="col btn-condition"></div></div>';

		return _condition;
	}

	/**
     * Render Text html
     * @version 1.0.1
     */
	this.init = function (_object = '') {
		self._content.off('.event'); // Remove all event
		self._content.empty();
		self.event = [];
		self.option_table = '';
		self.id = 1;
		self.getInout();

		_object = _object == '' ? self.option.events : _object;

		if (typeof (_object) != 'undefined' && _object.length > 0) {
			$.each(_object, function (index, item) {
				self.id++;
				self.event.push(self.create(self.id, item));
			});
		} else {
			self.event.push(self.create(self.id, { type: 1, target: [{ object: 0, action: [{ event: '', condition: [] }] }] }));
		}

		$.each(self.event, function (index, item) {
			self._content.append(item.content);
		})

		self.rebuild_event();

		// Event change event
		self._content.on('change.event', '.select-event', function () {
			let id_event = $(this).parents('.block-event').data('index');

			$('.block-event[data-index="' + id_event + '"]').find('.block-object').empty();
			self.add_target(id_event);
		})

		// Event select table
		self._content.on('change.event', '.select-table', function (event) {
			let _option = '';

			if (self.option.parent.table_management.tableList[$(this).val()]) {
				_.each(self.option.parent.table_management.tableList[$(this).val()].items, function (item, key) {
					_option += "<option value='" + item.id + "'>" + item.item_name + "</option>"
				})
			}

			self.option_table = _option;
			let id_event = $(this).parents('.block-event').data('index');
			let id_target = $(this).attr('data-target');

			$('.block-event[data-index="' + id_event + '"] .target-object[data-index="' + id_target + '"]').find('.select-condition-table').html(_option);
			self.rebuild_action(id_event, id_target);
		})

		// Event select action
		self._content.on('change.event', '.select-action', function () {
			let id_event = $(this).parents('.block-event').data('index');
			let id_target = $(this).parents('.target-object').data('index');
			let id_action = $(this).data('action');

			let obj_event = _.find(self.event, function (o) { return o.id == id_event });
			let block_target = obj_event.content.find('.target-object[data-index="' + id_target + '"]');
			let block_action = block_target.find('.block-action[data-index="' + id_action + '"]');

			block_action.find('.block-condition').remove();
			block_action.find('.block-value').remove();

			let _option = '';
			if (self.option.parent.table_management.tableList[block_target.find('.select-table').val()]) {
				_.each(self.option.parent.table_management.tableList[block_target.find('.select-table').val()].items, function (item, key) {
					_option += "<option value='" + item.id + "'>" + item.item_name + "</option>"
				})
			}

			self.option_table = _option;

			if (objects instanceof LookupField && $(this).val() == DISPLAY_CONTENT) {
				let _condition = '<div class="form-row mb-3 block-value">\
									<label class="col-sm-4 col-form-label text-right" > ' + gettext('Value') + '</label >\
									<div class="col-6">\
										<select class="form-control select-value-table">' + self.option_table + '<select>\
									</div>\
								</div>';

				block_action.append(_condition)
			}

			switch (Number($(this).val())) {
				case RECORD_SEARCH:
					self.inout = self.inputs;
					self.add_condition(id_event, id_target, id_action);
					break;

				case SET_OUTPUT:
					self.inout = self.outputs;
					self.add_condition(id_event, id_target, id_action);
					break;

				case RECORD_REGISTER:
					self.inout = self.inputs;
					self.add_condition(id_event, id_target, id_action);
					break;

				case SUM:
					self.inout = self.inputs;
					self.add_condition(id_event, id_target, id_action);
					break;

				case DISPLAY_CONTENT:
					self.inout = self.inputs;
					self.add_condition(id_event, id_target, id_action);
					break;
				
				case SCREEN_DISPLAY:
					self.inout = self.inputs;
					self.add_condition(id_event, id_target, id_action);
					break;
			}
		})

		// Event select condition
		self._content.on('change.event', '.block-condition select', function (event) {
			$(this).attr('data-selected', $(this).val())
		})

		$('#attributeModal').off('shown.bs.tab').on('shown.bs.tab', function (e) {

			if (e.target.getAttribute('aria-controls') == 'nav-event') {
				let _object = self.get(true);
				self.init(_object);
				self.validate();
			}
		})

		return self._content;
	}

	/**
     * Get event
	 * 
	 * @param flag Integer
     * @version 1.0.1
     */
	this.get = function (flag = false) {
		let _event = [];

		self._content.find('.block-event').each(function (index) {
			let _obj = { type: parseInt($(this).find('.select-event').val()), target: [] };
			var target = {};

			$(this).find('.target-object').each(function () {
				target = { 'object': $(this).find('.select-table').val(), action: [] };
				var action = {};

				$(this).find(".block-action").each(function () {
					action = { event: parseInt($(this).find(".select-action").val()), condition: [] };

					if ($(this).find('.select-value-table').length)
						action.value = $(this).find('.select-value-table').val()

					$(this).find(".block-condition").each(function () {
						action.condition.push({
							condition_1: $(this).find('select').eq(0).val() ? $(this).find('select').eq(0).val() : '',
							condition_2: $(this).find('select').eq(1).val() ? $(this).find('select').eq(1).val() : ''
						})
					})

					target.action.push(action);
				})

				_obj.target.push(target);
			})

			_event.push(_obj);
		})

		if (flag == false)
			self.option.events = _event;

		return _event;
	}

	/**
     * Add event
     * @version 1.0.1
     */
	this.add_event = function () {
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
	this.remove_event = function (obj) {
		let id = $(obj).attr('data-index');

		_.remove(self.event, function (item) {
			return item.id == id;
		});

		obj.remove();

		self.rebuild_event();
	}

	/**
     * Add action
     * @version 1.0.1
     */
	this.add_target = function (id_event) {
		let obj_event = _.find(self.event, function (o) { return o.id == id_event });

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
	this.remove_target = function (id_event, obj) {
		$(obj).remove();
		self.rebuild_target(id_event);
	}


	/**
     * Add action
     * @version 1.0.1
     */
	this.add_action = function (id_event, id_target) {
		let obj_event = _.find(self.event, function (o) { return o.id == id_event });
		let index = self.get_index(obj_event.content.find('.block-action:last'));

		let item = self.create_action(index, obj_event.content.find('.select-event option:selected').val(), {});
		obj_event.content.find('.target-object[data-index="' + id_target + '"]').append(item);
		self.rebuild_action(id_event, id_target);
	}

	/**
     * Remove action
     * @version 1.0.1
     */
	this.remove_action = function (id_event, id_target, obj) {
		$(obj).remove();
		self.rebuild_action(id_event, id_target);
	}

	/**
     * Add condition
     * @version 1.0.1
     */
	this.add_condition = function (id_event, id_target, id_action) {
		let obj_event = _.find(self.event, function (o) { return o.id == id_event });

		let obj_action = obj_event.content.find('.target-object[data-index="' + id_target + '"] .block-action[data-index="' + id_action + '"]');
		let action = obj_action.find('.select-action option:selected').val();
		let item = self.create_condition(id_action, { event_type: obj_event.content.find('.select-event option:selected').val() }, action);

		obj_action.append(item);
		self.rebuild_condition(id_event, id_target, id_action);
	}

	/**
     * Remove condition
     * @version 1.0.1
     */
	this.remove_condition = function (id_event, id_target, id_action, obj) {
		$(obj).remove();

		let obj_event = _.find(self.event, function (o) { return o.id == id_event });
		let obj_target = obj_event.content.find('.target-object[data-index="' + id_target + '"]');
		let _option = '';

		if (self.option.parent.table_management.tableList[obj_target.find('.select-table').val()]) {
			_.each(self.option.parent.table_management.tableList[obj_target.find('.select-table').val()].items, function (item, key) {
				_option += "<option value='" + item.id + "'>" + item.item_name + "</option>"
			})
		}

		self.option_table = _option;
		
		self.rebuild_condition(id_event, id_target, id_action);
	}


	/**
     * Rebuild event
     * @version 1.0.1
     */
	this.rebuild_event = function () {
		var plus_option = $("<a/>", {
			href: 'javascript:void(0)',
			class: 'd-inline-block plus mr-1',
			css: {
				fontSize: "18px",
				lineHeight: "38px"
			},
			html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
			click: function () {
				return self.add_event();
			}
		});

		let _length = self.event.length;
		self._content.find('.btn-option').empty();
		self._content.find('.block-event').each(function (index) {
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
				click: function () {
					return self.remove_event(that);
				}
			});

			if (_length > 1) {
				$(this).find('.btn-option').append(minus_option);
			}

			if (_length == (index + 1)) {
				$(this).find('.btn-option').prepend(plus_option);
			}

			self.rebuild_target($(this).attr('data-index'));
		})
	}

	/**
     * Rebuild target object
     * @version 1.0.1
     */
	this.rebuild_target = function (id_event) {
		var plus_option = $("<a/>", {
			href: 'javascript:void(0)',
			class: 'd-inline-block plus mr-1',
			css: {
				fontSize: "18px",
				lineHeight: "38px"
			},
			html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
			click: function () {
				return self.add_target(id_event);
			}
		});

		let obj_event = _.find(self.event, function (o) { return o.id == id_event });
		let _length = obj_event.content.find('.target-object').length;

		obj_event.content.find('.btn-target').empty();
		obj_event.content.find('.target-object').each(function (index) {
			let that = this;
			var minus_option = $("<a/>", {
				href: 'javascript:void(0)',
				class: 'd-inline-block text-danger',
				css: {
					fontSize: "18px",
					lineHeight: "38px"
				},
				html: '<i class="fa fa-minus-circle" aria-hidden="true"></i>',
				click: function () {
					return self.remove_target(id_event, that);
				}
			});

			if (_length > 1) {
				$(this).find('.btn-target').append(minus_option);
			}

			if (_length == (index + 1)) {
				$(this).find('.btn-target').prepend(plus_option);
			}

			let _option = '';
			if (self.option.parent.table_management.tableList[$(this).find('.select-table').val()]) {
				_.each(self.option.parent.table_management.tableList[$(this).find('.select-table').val()].items, function (item, key) {
					_option += "<option value='" + item.id + "'>" + item.item_name + "</option>"
				})
			}

			self.option_table = _option;

			self.rebuild_action(id_event, $(this).attr('data-index'));
		})
	}

	/**
     * Rebuild action
     * @version 1.0.1
     */
	this.rebuild_action = function (id_event, id_target) {
		var plus_option = $("<a/>", {
			href: 'javascript:void(0)',
			class: 'd-inline-block plus mr-1',
			css: {
				fontSize: "18px",
				lineHeight: "38px"
			},
			html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
			click: function () {
				return self.add_action(id_event, id_target);
			}
		});

		let obj_event = _.find(self.event, function (o) { return o.id == id_event });
		let _length = obj_event.content.find('.target-object[data-index="' + id_target + '"]').find('.block-action').length;


		obj_event.content.find('.target-object[data-index="' + id_target + '"]').find('.btn-action').empty();
		obj_event.content.find('.target-object[data-index="' + id_target + '"]').find('.block-action').each(function (index) {
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
				click: function () {
					return self.remove_action(id_event, id_target, that);
				}
			});

			if (_length > 1) {
				$(this).find('.btn-action').append(minus_option);
			}

			if (_length == (index + 1)) {
				$(this).find('.btn-action').prepend(plus_option);
			}

			let select_value_table = $(this).find('.select-value-table');
			select_value_table.html(self.option_table).find('option[value="' + select_value_table.attr('data-selected') + '"]').attr('selected', 'selected');
			self.rebuild_condition(id_event, id_target, $(this).attr('data-index'));
		})
	}

	/**
     * Rebuild condition
     * @version 1.0.1
     */
	this.rebuild_condition = function (id_event, id_target, id_action) {
		var plus_option = $("<a/>", {
			href: 'javascript:void(0)',
			class: 'd-inline-block plus mr-1',
			css: {
				fontSize: "18px",
				lineHeight: "38px"
			},
			html: '<i class="fa fa-plus-circle" aria-hidden="true"></i>',
			click: function () {
				return self.add_condition(id_event, id_target, id_action);
			}
		});

		let obj_event = _.find(self.event, function (o) { return o.id == id_event });
		let obj_action = obj_event.content.find('.target-object[data-index="' + id_target + '"] .block-action[data-index="' + id_action + '"]');
		let _length = obj_action.find('.block-condition').length;

		obj_action.find('.btn-condition').empty();
		obj_action.find('.block-condition').each(function (index) {
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
				click: function () {
					return self.remove_condition(id_event, id_target, id_action, that);
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
				_.forEach(self.inputs, function (item) {
					option_condition += '<option value="' + item.code + '">' + item.name + '</option>';
				})
			}

			_select_condition.html(option_condition).find('option[value="' + _select_condition.attr('data-selected') + '"]').attr('selected', 'selected');
		})
	}

	/**
     * Get index
     * @version 1.0.1
     */
	this.get_index = function (obj) {
		let index = parseInt(obj.attr('data-index'), 10);
		return _.isNaN(index) ? 1 : (index + 1);
	}

	/**
     * Validated events
     * @version 1.0.2
     */
	this.validate = function () {
		let is_invalid = false;

		// Each row get data
		self._content.find('.block-event').each(function (index) {
			$(this).find('.target-object').each(function () {
				let select_table = $(this).find('.select-table');

				$(this).find(".block-action").each(function () {
					let select_action = $(this).find(".select-action").val();
					if ((select_action && select_action != RESET) && select_table.val() == '') {
						select_table.addClass('is-invalid');
						is_invalid = true;
						return;
					}
				})
			})
		})

		return is_invalid;
	}

	/**
     * Get input
     * @version 1.0.2
     */
	this.getInout = function () {
		self.inputs = [];
		self.outputs = [];

		objects._input._content.find('.form-row').each(function (index) {
			let _obj = { name: $(this).find('.input-group-text').text(), code: $(this).find('.input_option').val() };

			if ($(this).find('.input_option').val())
				self.inputs.push(_obj);
		})

		objects._output._content.find('.form-row').each(function (index) {
			let _obj = { name: $(this).find('.input-group-text').text(), code: $(this).find('.input_option').val() };

			if ($(this).find('.input_option').val())
				self.outputs.push(_obj);
		})

	}

}