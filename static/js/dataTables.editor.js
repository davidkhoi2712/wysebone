/*! Editor 1.0.0
 * ©2019
 */

 /**
 * @summary     Editor
 * @description Add Excel like editor options to DataTables
 * @version     1.0.0
 * @file        dataTables.editor.js
 * @author      Nguyen Xuan Sanh
 * @copyright   Copyright 2019.
 *
 */
(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';

var DataTable = $.fn.dataTable;
var namespaceCounter = 0;

var Editor = function ( dt, opts )
{
	// Sanity check that we are using DataTables 1.10 or newer
	if ( ! DataTable.versionCheck || ! DataTable.versionCheck( '1.10.8' ) ) {
		throw 'Editor requires DataTables 1.10.8 or newer';
	}

	// User and defaults configuration object
	this.c = $.extend( true, {},
		opts
	);

		// Internal settings
	this.s = {
		/** @type {DataTable.Api} DataTables' API instance */
		dt: new DataTable.Api( dt ),

		enable: true,

		/** @type {string} Unique namespace per instance */
		namespace: '.editor-' + (namespaceCounter++),
		changed: false,
	};

	this.dom = {
		cell_modify: $('<div class="cell-modify table-borderless"></div>'),
		invalid_feedback: $('<div class="errorMsgBase errorMsg"></div>'),
		input: null
	};

	// Check if row reorder has already been initialised on this table
	var settings = this.s.dt.settings()[0];
	var existing = settings.editor;
	if ( existing ) {
		return existing;
	}

	settings.editor = this;
	this._constructor();
};

$.extend( Editor.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * API methods for DataTables API interface
	 */
	/**
	 * Execute on a cell
	 * @param  {tag} cell
	 * @param  {string} value
	 */
	execute: function (cell, value) {
		this._execute(cell, value);
	},

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Initialise the Editor instance
	 *
	 * @private
	 */
	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var namespace = this.s.namespace;

		$(dt.table().body()).on('dblclick' + namespace, '.cell', {editor: that} , this._handleDoubleClick);

		dt.on( 'destroy'+namespace, function () {
			dt.off(namespace);
			$(dt.table().body()).off( namespace );
		} );

	},

	/**
	 * Handle double click on cell
	 * 
	 * @param {object} e Event
	 * @private
	 */
	_handleDoubleClick: function (event) {
		const that = event.data.editor;

		if ( that.s.enable === false ) {
			return;
		}

		var cell = that.s.dt.cell( this );
		
		if ( ! cell.any() ) {
			return;
		}
		
		that._execute(this);
	},

	/**
	 * Execute cell
	 * 
	 * @param {Tag} cell
	 * @param {String} value
	 * @private
	 */
	_execute: function (cell, value)
	{
		var that = this;
		var dt = this.s.dt;
		var node = $(cell);
		var namespace = this.s.namespace;

		let header_index = node.attr('data-x');
		this.s.item_type = this.c.listHeader[header_index].type;
		this.s.changed = false;
		
		if (this.s.item_type.code == "NUMBER" && this.s.item_type.auto_number == true || this.c.listHeader[header_index].display || this.c.authority != 1) {
			$(dt.table().body()).off('dblclick' + namespace, cell);
			return;
		}

		$( dt.table().body() ).off( 'dblclick'+namespace, '.cell' );

		node.addClass('active');

		switch (this.s.item_type.code){
			case "TEXT":
			case "TIME":
				this._textEditor();
				break;
			case "NUMBER":
				this._numberEditor();
				break;
			case "DATE":
				this._dateEditor();	
				break;
			case "SELECTION":
				this._selectEditor();	
				break;
			case "CHECKBOX":
				this._checkboxEditor();	
				break;	
		}
		
		if (typeof value == 'undefined' && this.s.item_type.code !=='CHECKBOX') {
			value = node.find('span').attr('data-val');

			if (node.attr('data-formulas')) {
				value = '=' + node.attr('data-formulas');
			}

			this.dom.input.val(value);
		} else if (this.s.item_type.code=='CHECKBOX') {
			value = node.find('span').text();
			this.dom.input.prop('checked', parseInt(value));
		}
		
		const rect = this._getPosition(node[0]);

		this.dom.cell_modify.css({
			'top': rect.top,
			'width': node.outerWidth(true),
			'min-height': node.outerHeight(true),
			'left': rect.left
		});

		let dtScroll = $(".dataTables_scrollBody", dt.table().container());
		dtScroll.scroll(function () {
			const rect = that._getPosition(node[0]);

			that.dom.cell_modify.css({
				'top': rect.top,
				'left': rect.left,
			});
		});

		this.dom.cell_modify.append(this.dom.input);

		$('#'+this.c.offsetParent).append(this.dom.cell_modify);

		let rect_root = $('#'+this.c.offsetParent)[0].getBoundingClientRect();
		let rect_left = $('.DTFC_LeftBodyWrapper', dt.table().container())[0].getBoundingClientRect();
		let rect_cell = this.dom.cell_modify[0].getBoundingClientRect();
		let scroll_left = 0;

		if (rect_cell.right > rect_root.right)
			scroll_left = rect_cell.right - rect_root.right + 1;
		else if (rect_cell.left < rect_left.right)
			scroll_left = dtScroll.scrollLeft() - rect_left.right + rect_cell.left;
		
		if (scroll_left)	
			dtScroll.scrollLeft(scroll_left);
			
		this._jSuites(this.s.item_type.code, value);

		this.dom.input.focusTextToEnd();
		this.dom.node = node;

		// Disabled KeyTable
		// dt.keys.enable( false );

		var getValue = function(e) {
			var _val = $(e.target).val();
			
			if (that.s.item_type.code=='CHECKBOX') {
				_val = $(e.target).is(':checked');
			}
			
			if (that.s.item_type.code == 'NUMBER' && e.target.validity.valid == false) {
				_val = true;
			}

			return _val;
		}

		this.dom.input.change(function () {
			that.s.changed = true;
		});

		if (this.s.item_type.code != 'DATE') {
			this.dom.input.blur(function(e){
				e.preventDefault();
				that._updateData(getValue(e));
			});

			this.dom.input.on("keyup"+namespace, function(e){
				if ( $.inArray(e.keyCode, [37, 38, 39, 40]) >= 0 ) {
					e.preventDefault();
					that._updateData(getValue(e));
				}
				
			});

			this.dom.input.on("keypress"+namespace, function(e){
				if ( e.keyCode == 13 &&  !e.shiftKey) {
					e.preventDefault();
					that._updateData(getValue(e));
				}
			});
		}

		$.each(this.c.events, function (index, item) {
			$('body').on('change' + namespace, "#" + index, function () {
                api({
                    type: 'POST',
                    url: 'apps/triggerEvent/',
                    dataType: 'json',
                    data: JSON.stringify({'input': $(this).val(), 'event': item}),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    success: function(response) {
						triggerEvent = 0;
						that._emitEvent( 'triggerEvent-updateData', [that.dom.node, response.data] );
						$('body').off(namespace);
                    },
                    error: function(response, status, error) {
                        
                    }
                });
            })
        })

	},

	/**
	 * Update data
	 *
	 * @param {string} value
	 * @private
	 */
	_updateData: function (value) {
		let error_mess = '';
		let context_menu = $('.contextMenu');

		if ($.trim(value) == '' && _.has(this.s.item_type, 'required') && this.s.item_type.required == true) {
			error_mess = gettext("This field is required.");
		}

		if (value && this.dom.input[0].hasAttribute("minlength") && value.length < this.s.item_type.min_length) {
			error_mess = interpolate(gettext("Ensure this value has at least %(limit_value)s characters (it has %(show_value)s)."), { limit_value: this.s.item_type.min_length, show_value: value.length }, true);
		}

		if (value && this.dom.input[0].hasAttribute("maxlength") && value.length > this.s.item_type.max_length) {
			error_mess = interpolate(gettext("Ensure this value has at most %(limit_value)s characters (it has %(show_value)s)."), { limit_value: this.s.item_type.max_length, show_value: value.length }, true);
		}

		if (this.dom.input[0].hasAttribute("min") && Number(value) < Number(this.s.item_type.min_value)) {
			error_mess = interpolate(gettext("Ensure this value is less than or equal to %s.", this.s.item_type.min_value), [this.s.item_type.min_value]);
		}

		if (this.dom.input[0].hasAttribute("max") && Number(value) > Number(this.s.item_type.max_value)) {
			error_mess = interpolate(gettext("Ensure this value is greater than or equal to %s.", this.s.item_type.max_value), [this.s.item_type.max_value]);
		}
		
		if (this.s.item_type.code == 'NUMBER' && value===true) {
			error_mess = gettext("Only numbers are allowed.");
		}

		if (this.s.changed && error_mess !== '') {
			this.dom.invalid_feedback.html(error_mess);
			this.dom.cell_modify.append(this.dom.invalid_feedback);
			this.dom.input.attr('title', '');
			this.s.dt.keys.enable( false );
			context_menu.contextMenu(false);

			return;
		}

		var dt = this.s.dt;
		var namespace = this.s.namespace;
		var node = this.dom.node;

		node.removeClass('active');

		this.dom.input.off(this.s.namespace);
		
		this.dom.input = null;
		this.dom.invalid_feedback.html('');
		this.dom.cell_modify.empty().remove();

		// Enable ContextMenu
		if (context_menu.hasClass('context-menu-disabled')) {
			context_menu.contextMenu(true);
			// this.s.dt.keys.enable();
		}

		this._emitEvent( 'editor-updateData', [ node, value ] );
		$(dt.table().body()).on('dblclick' + namespace, '.cell', {editor: this} , this._handleDoubleClick);
	},

	/**
	 * Text editor
	 *
	 * @param  {string} type
	 * @private
	 */
	_textEditor: function () {
		this.dom.input = $('<input class="form-control cell-input" id="'+this.s.item_type.field_code+'"/>');

		if (this.s.item_type.number_lines > 1) {
			this.dom.input = $('<textarea class="form-control cell-input" rows="' + this.s.item_type.number_lines+'" style="height: auto" />');
		}

		if (this.s.item_type.min_length !== '')
			this.dom.input.attr('minlength', this.s.item_type.min_length);

		if (this.s.item_type.max_length !== '')
			this.dom.input.attr('maxlength', this.s.item_type.max_length);
	},

	/**
	 * Number editor
	 * 
	 * @private
	 */
	_numberEditor: function () {
		this.dom.input = $('<input class="form-control cell-input" type="number" onkeypress="return event.charCode == 46 || (event.charCode >= 48 && event.charCode <= 57)" />');

		if (this.s.item_type.min_value !== '')
			this.dom.input.attr('min', this.s.item_type.min_value)

		if (this.s.item_type.max_value !== '')
			this.dom.input.attr('max', this.s.item_type.max_value)

		if (this.s.item_type.decimal_places) {
			this.dom.input.attr('step', 'any');
		}
	},

	/**
	 * Date/Time editor
	 * 
	 * @private
	 */
	_dateEditor: function () {
		this.dom.input = $('<input class="form-control cell-input" />');
	},

	/**
	 * Selection editor
	 * 
	 * @private
	 */
	_selectEditor: function(){
		this.dom.input = $('<div></div>');
	},

	/**
	 * checkbox editor
	 *
	 * @param  {string} type
	 * @private
	 */
	_checkboxEditor: function (type) {
		this.dom.input = $('<input class="form-control cell-input" type="checkbox"/>');
	},

	/**
	 * execute jSuites library
	 * 
	 * @param  {string} type
	 * @param  {string} value
	 * @private
	 */
	_jSuites: function (type, value) {
		const that = this;
		switch (type){
			case 'DATE':
				this.dom.date = this.dom.input.datetimepicker({
					"showTodayButton": true,
					"showClear": true,
					"format": "L",
					"locale": lang_code,
					"timeZone": timezone,
					"useStrict": true,
					'useCurrent': false,
					extraFormats: format_date,
					tooltips: {
						today: gettext('Today'),
						clear: gettext('Clear selection')
					}
				}).on('dp.hide', function(e){
					let value = $(e.target).val();
					that._updateData(value);
				}).on('dp.change', function(e){
					that.s.changed = true
				});
				
				break;
			
			case 'SELECTION':
				let _options = [];
				_.each(this.s.item_type.options, function (item, key) {
					_options.push(_.escape(item))
				})

				jSuites.dropdown(this.dom.input[0], {
					data: _options,
					value: _.escape(value),
					onopen:function(el) {
						$(el).find('.jdropdown-header').val(_.unescape(value));
					},
					onclose: function (el, newval) {
						that._updateData(_.unescape(newval));
					}
				}).open();
		}
	},

	/**
	 * Emit an event on the DataTable for listeners
	 *
	 * @param  {string} name Event name
	 * @param  {array} args Event arguments
	 * @private
	 */
	_emitEvent: function ( name, args )
	{
		this.s.dt.iterator( 'table', function ( ctx, i ) {
			$(ctx.nTable).triggerHandler( name, args );
		} );
	},

	_getPosition: function ( node )
	{
		var
			currNode = node,
			currOffsetParent,
			top = 0,
			left = 0,
			targetParent = $('#'+this.c.offsetParent);

		
		do {
			try {
				// Don't use jQuery().position() the behaviour changes between 1.x and 3.x for
				// tables
				var positionTop = currNode.offsetTop;
				var positionLeft = currNode.offsetLeft;

				// jQuery doesn't give a `table` as the offset parent oddly, so use DOM directly
				currOffsetParent = $(currNode.offsetParent);

				top += positionTop + parseInt(currOffsetParent.css('border-top-width')) * 1;
				left += positionLeft + parseInt(currOffsetParent.css('border-left-width')) * 1;

				// Emergency fall back. Shouldn't happen, but just in case!
				if (currNode.nodeName.toLowerCase() === 'body') {
					break;
				}

				currNode = currOffsetParent.get(0); // for next loop
			} catch (error) {
				break
			}
		}
		while ( currOffsetParent.get(0) !== targetParent.get(0) )

		return {
			top: top -  $(".dataTables_scrollBody", this.s.dt.table().container()).scrollTop(),
			left: left - $(".dataTables_scrollBody", this.s.dt.table().container()).scrollLeft()
		};
	},
	
});

Editor.version = "1.0";

/*
 * API
 */
DataTable.Api.register( 'editor.execute()', function (cell, value) {
	return this.iterator( 'table', function (ctx) {
		if ( ctx.editor ) {
			ctx.editor.execute(cell, value );
		}
	} );
} );

$(document).on( 'preInit.dt.dtk', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}


	var init = settings.oInit.editor;
	var defaults = DataTable.defaults.editor;

	if ( init || defaults ) {
		var opts = $.extend( {}, defaults, init );

		if ( init !== false ) {
			new Editor( settings, opts  );
		}
	}
} );

// Alias for access
$.fn.dataTable.Editor = Editor;
$.fn.DataTable.Editor = Editor;

return Editor;
}));
