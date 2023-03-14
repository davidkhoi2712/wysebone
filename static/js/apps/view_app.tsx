const calcDataTableHeight = function (obj) {
    var h = Math.floor($(obj).height() * 50 / 100);
    h = $(obj).height() - $('.dataTables_scrollHead').outerHeight(true) - 10;
    return h + 'px';
};

const showLoading = function () {
    
    if ($('.loadding').data('save') == true) 
        return
    
    let _str = gettext("Saving") + '... <svg version="1.1" style="width:20px;height:20px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve"> <circle fill="none" stroke="#3a3b45" stroke-width="4" cx="50" cy="50" r="44" style="opacity:0.5;"></circle> <circle fill="#4e73df" stroke="#4e73df" stroke-width="3" cx="8" cy="54" r="6" transform="rotate(154.441 50 49.716)"> <animateTransform attributeName="transform" dur="2s" type="rotate" from="0 50 48" to="360 50 52" repeatCount="indefinite"></animateTransform> </circle> </svg>';
    $('.loadding').stop().html(_str).data('save', true).fadeIn(100).delay(1000).queue(function () {
        $(this).data('save', false).html(gettext('All changes saved')).dequeue();
    }).delay(800).fadeOut(400, function () {
        $(this).html('');
    });
};

const UUID = function (len = 10) {
    var dec2hex = [];
    for (var i = 0; i <= 35; i++) {
        dec2hex[i] = i.toString(36);
    }

    var uuid = '';
    for (var i=1; i<=len; i++) {
      if (i===20) {
        uuid += dec2hex[(Math.random()*4|0 + 8)];
      } else {
        uuid += dec2hex[(Math.random()*36|0)];
      }
    }
    return uuid.toUpperCase();
}

const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 5000,
});

(function ($) {
	'use strict';
	
	$.fn.tableColFixer = function (param) {
		var defaults = {
			left: 2
		};
	
        var settings = $.extend({}, defaults, param);
        var offsetParent = param.dtTable.table().container();

		return this.each(function () {
			settings.table = this;
			settings.parent = $(".dataTables_scrollBody", offsetParent);
	
			settings.frozenColumnCount = param.dtTable.columns().header().length > 4 ? 3 : 2;
	
            $('.dataTables_scroll', offsetParent).append('<div id="paneDivider" style="left: 177px;" class="">\
				<div class="line noevents"></div>\
				<div class="drag_handle noevents" style="top: 247px;"></div>\
				<div class="tooltips" style="top: 247px;">'+ gettext("Drag to adjust the number of frozen columns")+'</div>\
			</div>');
			init();
			$(window).resize(setLeft)
		});
	
		function init() {
			fixLeft();
    
			$('#paneDivider', offsetParent).on('mouseenter mousemove', function (e) {
				var t = e.offsetY;
	
				$('.drag_handle', this).css('top', t);
				$(this).addClass("hover");
				var l, n = (e.pageX + $('.tooltips', this).width()) / 2 < $('.DTFC_LeftWrapper', offsetParent).width();
				n ? (l = -$('.tooltips', this).width() - 48) : l = "", $('.tooltips', this).toggleClass("hanging-left", n), $('.tooltips', this).css({
					top: t,
					left: l
				})
	
            }).on('mouseleave', function () {
				$(this).removeClass("hover");
            }).on('mousedown', function () {
                $('body').addClass('event-dragging');
                settings.parent.scrollLeft(0);
            }).on('mouseup', function () {
                $('body').removeClass('event-dragging');
            }).draggable({
				containment: $(".dataTables_scrollBody", offsetParent),
				axis: "x",
				scroll: false,
				start: function () {
					$(this).removeClass("hover").addClass('dragging');
				},
				drag: function (event, ui) {
					var i = _getUnroundedColumnIndexOfMouseCoord(ui.position);
					$("[data-column-index]", offsetParent).css('border-right-color', '');
					
					if (i !== (settings.left-1))
						$("[data-column-index='" + i + "']", offsetParent).css('border-right-color', 'rgb(45, 127, 249)');
				},
				stop: function (event, ui) {
                    settings.left = _getUnroundedColumnIndexOfMouseCoord(ui.position) + 1;
                    $(settings.table).triggerHandler('freezePanes', [settings.left]);
                    $("[data-column-index]", offsetParent).css('border-right-color', '');
                    fixLeft();
                    $('body').removeClass('event-dragging');
					$(this).removeClass("dragging");
				}
			});
        }
        
        function elementsFromPoint(x, y) {
            var elements = [], previousPointerEvents = [], current, i, d;
            // chrome supports this (and future unprefixed IE/Edge hopefully)
            if (typeof document.elementsFromPoint === "function")
                return Array.prototype.slice.call(document.elementsFromPoint(x, y));
            // IE11/10 should support this
            if (typeof document.msElementsFromPoint === "function")
                return Array.prototype.slice.call(document.msElementsFromPoint(x, y));
            // get all elements via elementFromPoint, and remove them from hit-testing in order
            while ((current = document.elementFromPoint(x, y)) && elements.indexOf(current) === -1 && current != null) {
                // push the element and its current style
                elements.push(current);
                previousPointerEvents.push({
                    value: current.style.getPropertyValue('pointer-events'),
                    priority: current.style.getPropertyPriority('pointer-events')
                });
                // add "pointer-events: none", to get to the underlying element
                current.style.setProperty('pointer-events', 'none', 'important');
            }
            // restore the previous pointer-events values
            for (i = previousPointerEvents.length; d = previousPointerEvents[--i];) {
                elements[i].style.setProperty('pointer-events', d.value ? d.value : '', d.priority);
            }
            // return our results
            return elements;
        }
	
		function _getUnroundedColumnIndexOfMouseCoord(e) {
			var clientRect = settings.parent[0].getBoundingClientRect(),
                elements = $(elementsFromPoint(parseInt(e.left) + clientRect.left-100, clientRect.top + 12)),
				i = 0;
            
            for (var j = 0; j < elements.length; j++) {
                if (elements[j].localName == 'td' && $(elements[j]).hasClass('cell')) {
                    i = $(elements[j]).attr('data-column-index');
                }
            }
            
			if (typeof i == "undefined") i = 0;
	
			if (i > settings.frozenColumnCount) i = settings.frozenColumnCount;
			
			return parseInt(i);
		}
	
		function setLeft() {
			var left = $('.DTFC_LeftWrapper', offsetParent).outerWidth();
	
			$('#paneDivider', offsetParent).css('left', left);
		}
	
		function fixLeft() {
	
			$("[data-column-index]", offsetParent).removeClass('fixedCol');
	
			for (var i = 0; i < settings.left; i++) {
				$("[data-column-index='" + i + "']", offsetParent).addClass('fixedCol');
			}
	
			setLeft();
		}
	
	};

    $.fn.focusTextToEnd = function() {
        this.focus();
        var $thisVal = this.val();
        this.val('').val($thisVal);
        
		return this;
    };

    $.fn.selectRange = function(start, end) {
        if(typeof end === 'undefined') {
            end = start;
        }
        return this.each(function() {
            if('selectionStart' in this) {
                this.selectionStart = start;
                this.selectionEnd = end;
            } else if(this.setSelectionRange) {
                this.setSelectionRange(start, end);
            } else if(this.createTextRange) {
                var range = this.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        });
    };

    window.addEventListener('online', function () {
        Toast.fire({
            title: gettext('Reconnected')
        });
    });

    window.addEventListener('offline', function () {
        Toast.fire({
            timer: null,
            title: gettext('Trying to reconnect... please check your internet connection')
        });
    });

})(jQuery);

var triggerEvent = 0;
var data_option = {
    destroy: true,
    searching: false,
    paging: false,
    ordering: false,
    scrollY: "100vh",
    scrollX: true,
    scrollCollapse: true,
    dom: "Rlfrtip",
    info: false,
    autoWidth: true,
    keys: {
        columns: '.column-name',
        rows: '.row-name',
        className: 'highlight focus',
        clipboard: false,
        blurable: false,
    },
    fixedColumns: {
        heightMatch: 'none',
        leftColumns: 2
    }
}

function CheckBox(props) {
    const regex = /^\s*(true|1|on)\s*$/i;

    if (!regex.test(props.checked)) {
        return null;
    }

    return (
        <span style={{textAlign: 'center', display: 'block'}}>
            <i className="fa fa-check"></i><i className="d-none">1</i>
        </span>
    );
}

function formatWysebone(str, type) {
    if (str && type.code == 'DATE')
        return moment(str, format_date, lang_code).format('L');

    if (str && type.code == 'NUMBER') {
        let decimals = 0, decPoint = '.', thousandsSep = '';
        if (type.decimal_places)
            decimals = type.decimal_places

        if (type.thousands_separators)
            thousandsSep = ','
        
        str = number_format(str, decimals, decPoint, thousandsSep);

        if (type.unit_measure !== '') {
            if (type.unit_measure_position == 1)
                str = type.unit_measure + ' ' + str;
            else 
                str += ' ' + type.unit_measure;
        }

        return str;
    }
    
    if (type.code === 'CHECKBOX')
        return <CheckBox checked={str} />
    
    return str;
}

class Wysebone extends React.Component {
    constructor(props) {
        super(props);
        this.datatable = null;
        this.state = { listHeader: [], listData: [], loaded: false, configs: [] };
        this.events = [];
        this.is_updated = false;
        this.fixedCol = 2;
        this.isLoaded = false;
        this.isRender = false;
        this.isCalc = false;
        this.select_row = {};
        this.isRemove = false;
		this.namespace = '.wysebone';
        this.freezePanes = this.freezePanes.bind(this);
        this.business_table = [];
    }

    componentDidMount() {
        try {
            this.postData(this.props.appcode + '/', null, 'GET').then((result) => {
                
                if (result) {
                    this.isLoaded = true;
                    this.isRender = true;

                    if (_.has(result.configs, 'freezePanes'))
                        this.fixedCol = result.configs.freezePanes;

                    let business_table = [];    
                    _.forEach(result.header, function (item) {
                        if (_.indexOf(business_table, item.table)==-1)
                            business_table.push(item.table)
                    });

                    this.business_table = business_table;
                    this.is_updated = result.is_updated;
                    this.events = result.events;
                    
                    this.setState({
                        loaded: true,
                        listHeader: result.header,
                        listData: result.list,
                        configs: result.configs
                    });

                    
                }
                
            })
        } catch (error) {
            console.error(error);
        }
    }

    shouldComponentUpdate() {
        if (this.isRender && this.isLoaded === false) {
            $(document).off(this.namespace)
            this.datatable.destroy();
            return true;
        }

        if (this.isCalc || this.isLoaded)
            return true;

        return false;
    }

    componentDidUpdate() {
        if (this.isRender) {
            this.buildData();
        }

        if (this.isCalc) {
            // this.rules.init();
            
            this.isCalc = false;
            showLoading();
        }
    }

	buildData() {
        var that = this;

        this.isRender = false;
        this.isLoaded = false;
        this.fixedCol = this.fixedCol > this.state.listHeader.length ? (this.fixedCol - 2) : this.fixedCol;
        data_option.editor = {listHeader: this.state.listHeader, offsetParent: this.props.attr_id, events: this.events, authority: parseInt(this.props.authority)};

        data_option['aoColumnDefs'] = [{ "width": "40px", "targets": 0 }];
        data_option['fixedColumns']['leftColumns'] = this.fixedCol>0 ? this.fixedCol : 1;
        
        _.forEach(this.state.listHeader, function (item, index) {
            data_option['aoColumnDefs'].push({ "width": item.width, "targets": index + 1 });
        })

        this.datatable = $(this.refs.main).DataTable(data_option);

        this.datatable.on('preDraw', function () {
            if (that.isRemove) {
                this.datatable.column(0).nodes().each(function (cell, i) {
                    if ($(cell).hasClass('row-num'))
                        cell.innerHTML = i + 1;
                });
                that.isRemove = false;
            }

        });

        $('div.dataTables_scrollBody', this.datatable.table().container()).css('height', calcDataTableHeight('#'+this.props.attr_id));
		this.datatable.columns.adjust().draw().fixedColumns().relayout();
        $(this.refs.main).tableColFixer({ "left": this.fixedCol, dtTable: this.datatable }).on('freezePanes', function(e, col){
            that.freezePanes(col);
        });
        
        if (this.select_row) {
            this.datatable.cell(this.select_row.row, this.select_row.col).focus();
        }

        $(window).resize(function () {
            $('div.dataTables_scrollBody', that.datatable.table().container()).css('height', calcDataTableHeight('#'+that.props.attr_id));
            setTimeout(() => {
                that.datatable.columns.adjust().draw().fixedColumns().relayout();
            }, 1);
        });

        this.datatable.on('editor-updateData', function (e, cell, value) {
            const name = that.state.listHeader[$(cell).attr('data-x')].col;
            const index = $(cell).attr('data-index');

            that.updateData(value, name, index);

        }).on('key-focus', function (e, datatable, cell) {
            if ($(".dataTables_scrollBody", that.datatable.table().container()).scrollLeft() > 0 && cell.index().column - 1 <= that.fixedCol)
                $(".dataTables_scrollBody", that.datatable.table().container()).scrollLeft(0);

            that.select_row = { row: cell.index().row, col: cell.index().column };
        }).on('triggerEvent-updateData', function (e, cell, data) {
            if (triggerEvent++ > 0) {
                return true;
            }
            
            const _index = $(cell).attr('data-index');
            const index = _.findIndex(that.state.listData, { 'code': _index });
            let json_data = that.state.listData[index].json_data;
            
            _.forEach(data, function (value, key) {
                json_data[key] = value;
            })

            that.state.listData[index].json_data = json_data;
        
            that.isCalc = true;
            that.setState({
                listData: that.state.listData
            });
        });

        $(document).on("mouseenter" + this.namespace, '#'+this.props.attr_id+" .tr_after", function () {
            $('.tr_after', $('#'+that.props.attr_id)).find('td').css('background-color', '#f8f8f8')
        }).on("mouseleave" + this.namespace, '#'+this.props.attr_id+" .tr_after", function () {
            $('.tr_after', $('#'+that.props.attr_id)).find('td').css('background-color', '');
        }).on('click' + this.namespace, '#'+this.props.attr_id+" .tr_after", function (e) {
            that.insertRow(e.currentTarget.previousSibling, 'bottom')
        })

        $(document).on('keypress'+this.namespace, function(e){
            var name = e.target.nodeName.toLowerCase();
    
            if ( name !== 'body' ) {
                return;
            }

            let selectedCells = $('.highlight');

            $('table').find('.highlight').each(function () {
                if ($(this).hasClass('fixedCol')) {
                    selectedCells = this;
                    return;
                }
            })

            if (e.keyCode == 13 && e.shiftKey) {
                that.insertRow(selectedCells, 'bottom');

                return;
            } else if (e.keyCode == 13) {
                that.datatable.keys.move('down')
                return;
            }
    
            if (e.charCode<=0 || $(selectedCells).find('.cell-input').length) return;
            if (selectedCells.length > 1) return;
            
            that.datatable.editor.execute( selectedCells, String.fromCharCode(e.charCode) );
        });

        if (this.props.authority == 1) {
            $.contextMenu({
                selector: '.contextMenu',
                zIndex: 300,
                events: {
                    show: function (options) {

                        if ($(options.$trigger).hasClass('row-num')) {
                            $(that.datatable.row(options.$trigger).node()).addClass('wysebone-primary');
                        }

                        that.datatable.cell(options.$trigger).focus();

                        that.datatable.fixedColumns().update();
                    },
                    hide: function () {
                        $('.cell').removeClass('wysebone-primary');
                        $('.cell').parent().removeClass('wysebone-primary');
                    }
                },
                build: function ($trigger) {
                    var $menu = [];

                    $menu = {
                        callback: function (itemKey) {
                            switch (itemKey) {
                                case 'insertAbove':
                                    that.insertRow($trigger, 'top');
                                    break;
                                case 'insertBelow':
                                    that.insertRow($trigger, 'bottom');
                                    break;
                                case 'delete':
                                    that.deleteRow($trigger);
                                    break;
                                case 'clearContent':
                                    that.clearContent($trigger);
                                    break;
                                default:
                                    return false;
                            }
                        },
                        items: {
                            "insertAbove": { name: "Insert row above", icon: "row-above" },
                            "insertBelow": { name: "Insert row below", icon: "row-below" },
                            "delete": { name: "Remove row", icon: "delete-row" },
                            'clearContent': { name: "Clear content", icon: 'erase' },
                        }
                    };

                    return $menu;
                }
            });
        }
    }

    updateData(value, name, _index) {
        const index = _.findIndex(this.state.listData, { 'code': _index });
        let data = this.state.listData[index].json_data;
        let value_old = data[name];

        let col = _.find(this.state.listHeader, { 'col': name});

        if (value_old && col.type.code == 'DATE')
            value_old = moment(value_old, format_date, lang_code).format('L');
        
        
        if (value_old == value) return;

        if (!_.isBoolean(value) && value.indexOf('=') == 0) {
			value = value.replace("=", "");
            data['formula'][name] = value;
            
		}
		else {
            data.formula = _.omit(data.formula, [name]);
        }
        
        data[name] = value;
        this.state.listData[index].json_data = data;
        
        this.isCalc = true;
        this.setState({
            listData: this.state.listData
        });
        
        let data_save = _.clone(this.state.listData[index]);
        data_save.json_data = { formula: data.formula };
        data_save.json_data[name] = value;

        this.datatable.fixedColumns().update();
        
        if (this.is_updated)
            this.postData(this.props.appcode + '/', { code: this.state.listData[index].code, 'data': data_save, 'table': col.table}, 'PUT');
    }

    insertRow (target, position) {
        var _index = parseInt($(target).attr('data-y'));
        var index = (position == 'top' ? _index : (_index + 1));
        var data = this.state.listData;
        let order_number = 1;
        let order_number_after = 0;

        if (data.length == 0) {
            order_number = 1
            order_number_after = 1
        }
        else if (index == data.length) {
            order_number = order_number_after = data[_index].order_number + 1;
        } else {
            order_number = data[_index].order_number;

            __index = (position == 'top' ? _index - 1 : (_index + 1));
            order_number_after = __index > 0 ? data[__index].order_number : 0;
        }

        var obj = { code: UUID(), order_number: order_number, order_number_after: order_number_after, json_data: { height: 'auto', formula: [] }, json_table: {} };

        _.forEach(this.state.listHeader, function (item) {
            if (!_.has(obj.json_table, item.table))
                obj.json_table[item.table] = { height: 'auto', formula: {} }
            
            if (item.type.code == 'NUMBER' && item.type.auto_number)
            {
                let _auto_number = _.maxBy(data, function (o) { return o.json_data[item.col]; });
                obj.json_table[item.table][item.col] = obj.json_data[item.col] = _auto_number?parseInt(_auto_number.json_data[item.col], 10) + 1:1;
            }
            else
                obj.json_table[item.table][item.col] = obj.json_data[item.col] = _.has(item.type, 'default_value') ? item.type.default_value : '';
            
        });

        
        
        data.splice(index, 0, obj);

        this.isRender = true;
        this.select_row = { row: index, col: (this.datatable.cell(target).index() && this.datatable.cell(target).index().column > 0 ? this.datatable.cell(target).index().column : 1) };

        this.setState(() => ({
            listData: data
        }));

        showLoading();

        if (this.is_updated)
            this.postData(this.props.appcode + '/create_row/', obj, 'POST');
    }

    clearContent($event) {
        const { listHeader, listData } = this.state;
        let itemCode = $($event).attr('data-index');
        const index = _.findIndex(listData, { 'code': itemCode });
        let json_table = {};

        _.forEach(listHeader, function (item) {
            listData[index].json_data[item.col] = '';
            if (item.table == '')
                return;
            
            if (!_.has(json_table, item.table))
                json_table[item.table] = { formula: {} };
            
            json_table[item.table][item.col] = ''
        });
        
        listData[index].json_data.formula = {};
        this.isCalc = true;
        this.setState({
            listData: listData
        });
        this.datatable.fixedColumns().update();

        if (this.is_updated)
            this.postData(this.props.appcode + '/clear/', {'code': itemCode, 'data': json_table}, 'PUT');
    }

    deleteRow($event) {
        const that = this;
        const { listData } = this.state;
        let itemCode = $($event).attr('data-index');
        listData = _.remove(listData, function (item) {
            return item.code != itemCode;
        });

        const row = $("[data-index='" + itemCode + "']");
        let step = 1;
        row.slideToggle({
            duration: "fast",
            complete: function () {
                if (step++ >= row.length) {
                    if (that.is_updated)
                        that.postData(that.props.appcode + '/', { 'code': itemCode, 'table': that.business_table }, 'DELETE');
                    
                    showLoading();
                    setTimeout(function () {
                        that.isRender = true;
                        that.setState({
                            listData: listData
                        });
                        $('[data-index]:hidden').show();
                    }, 1)
                }
            }
        })
    }

    search() {
        try {
            const that = this;
            const { inputs, events } = this.state.configs.property;
            let $input = {};

            _.forEach(inputs, function(item) {
                $input[item.code] = $('#' + item.code).val();
            });

            this.postData(this.props.appcode + '/search/', {input: $input, event: _.find(events, ['type', 1]).target}, 'POST').then((result) => {
                
                if (result) {
                    this.isRender = true;

                    this.setState({
                        listData: result.list
                    });
                    
                    $.each(this.events, function (index, item) {
                        $(".DTFC_LeftBodyWrapper ." + index).each(function () {
                            let cell = $(this).parent();
                            that.postData('triggerEvent/', { input: $(this).text(), event: item }, 'POST').then((response) => {
                                const _index = $(cell).attr('data-index');
                                const index = _.findIndex(that.state.listData, { 'code': _index });
                                let json_data = that.state.listData[index].json_data;
                                
                                _.forEach(response.data, function (value, key) {
                                    json_data[key] = value;
                                })

                                that.state.listData[index].json_data = json_data;
                            
                                that.isCalc = true;
                                that.setState({
                                    listData: that.state.listData
                                });
                            })
                        })
                    })
                }
            })
        } catch (error) {
            console.error(error);
        }
    }

    syncData() {
        const { inputs, events } = this.state.configs.property;
        let $input = {};
        let _event = _.find(events, ['type', 2]);

        if (_event) {

            _.forEach(inputs, function (item) {
                $input[item.code] = $('#' + item.code).val();
            });
        
            this.postData(this.props.appcode + '/updateData/', { input: $input, list: this.state.listData, event: _event.target }, 'PUT').then((result) => {
                if (result) {
                    window.location.href = window.location.href;
                }
            })
        } else {
            window.location.href = window.location.href;
        }
    }

    columnName(i) {
        var letter = '';

        if (i > 701) {
            letter += String.fromCharCode(64 + parseInt(i / 676));
            letter += String.fromCharCode(64 + parseInt((i % 676) / 26));
        } else if (i > 25) {
            letter += String.fromCharCode(64 + parseInt(i / 26));
        }

        letter += String.fromCharCode(65 + (i % 26));
		
        return letter;
	}
	
    freezePanes($size) {
        if (this.datatable.settings()[0]._oFixedColumns.s.iLeftColumns == $size)
            return
        
        this.datatable.settings()[0]._oFixedColumns.s.iLeftColumns = $size;
        this.datatable.fixedColumns().relayout();

        try {
            this.postData(this.props.appcode + '/update_setting/', { 'freezePanes': $size });
            showLoading();
        } catch (error) {
            console.error(error);
        }
    }

    async postData($url = '', $data = {}, $method = 'PUT') {
        const $param = {
            method: $method, // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/json'
            },
            xsrfCookieName: 'csrftoken',
            xsrfHeaderName: 'X-CSRFToken'
        };

        if ($data) 
            $param['data'] = JSON.stringify($data) // body data type must match "Content-Type" header

        try {
            const response = await axios(base_url + "/api/apps/" + $url, $param);
            const data = await response.data;

            return data; // parses JSON response into native JavaScript objects
        } catch (error) {
            if (error.response) {
                Toast.fire({
                    title: error.response.data.message
                });
            } else if (error.request) {
                const that = this;
                setTimeout(function () {
                    that.postData($url, $data, $method);
                }, 2000);
            } else {
                // Something happened in setting up the request that triggered an Error
                Toast.fire({
                    title: error.message
                });
            }
        }
    }

    renderHeader() {
        return (
            <thead>
                <tr>
                    <th scope="col" className="row-number" style={{ width: 40 }}></th>
                    {this.state.listHeader.map((post, i) =>
                        <th scope="col" className="column-name" key={i} style={{ width: post.width }}>
                            <span className="col-name">{this.columnName(i)}</span>{post.name}
                        </th>
                    )}
                </tr>
            </thead>
        );
    }

    renderBody() {

        return (
            <tbody>
                {this.state.listData.map((item, i) =>
                    <tr key={i} className={"row-name " + (this.state.listData.length - 1 == i ? "tr_last " : '' + item.code)} data-y={i} data-index={item.code}>
                        <th scope="row" className="row-num contextMenu" data-index={item.code} data-y={i} data-column-index="0" style={{ height: item.height }} >{i + 1}</th>
                        {this.state.listHeader.map((header, j) =>
                            <td key={j} id={'cell' + this.columnName(j) + (i + 1)} className={"cell contextMenu " + (header.display ? "table-secondary" : '')} data-y={i} data-column-index={j + 1} data-x={j} data-index={item.code} style={{ height: item.json_data.height }} data-formulas={item.json_data.formula[header.col]}>
                                {item.json_data.formula[header.col] ? (
                                    <React.Fragment>
                                        <input type="text" readOnly id={this.columnName(j) + (i + 1)} value={item.json_data[header.col]} data-formula={item.json_data.formula[header.col]} style={{ display: 'none' }} />
                                        <span id={j.toString() + (i + 1)} data-formula={item.json_data.formula[header.col]} >{item.json_data[header.col]}</span>
                                    </React.Fragment>
                                ) : (
                                        <span data-val={item.json_data[header.col]} className={header.type.field_code}>
                                            {formatWysebone(item.json_data[header.col], header.type)}
                                        </span>
                                    )}
                            </td>
                        )}
                    </tr>
                )}
                {this.props.authority == 1 ? ( 
                        <tr title={gettext("You can also insert a new record anywhere by pressing Shift-Enter")} className="tr_after">
                            <th scope="row" className="row-num1" data-column-index="0" style={{ borderBottomWidth: 1 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style={{ width: 16, height: 16 }} viewBox="0 0 16 16" className="icon" style={{ shapeRendering: 'geometricPrecision' }}><path fillRule="evenodd" fill="currentColor" d="M9,7 L9,3.5 C9,3.224 8.776,3 8.5,3 L7.5,3 C7.224,3 7,3.224 7,3.5 L7,7 L3.5,7 C3.224,7 3,7.224 3,7.5 L3,8.5 C3,8.776 3.224,9 3.5,9 L7,9 L7,12.5 C7,12.776 7.224,13 7.5,13 L8.5,13 C8.776,13 9,12.776 9,12.5 L9,9 L12.5,9 C12.776,9 13,8.776 13,8.5 L13,7.5 C13,7.224 12.776,7 12.5,7 L9,7 Z"></path></svg>
                            </th>
                            {this.state.listHeader.map((post, i) =>
                                <td key={i} {...(i == 0 ? { colSpan: this.state.listHeader.length } : { style: { display: 'none' } })}></td>
                            )}
                        </tr>
                    ):(
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <td scope="row" className="border-0" data-column-index="0" style={{ borderBottomWidth: 1 }}></td>
                            {this.state.listHeader.map((post, i) =>
                                <td key={i} {...(i == 0 ? { colSpan: this.state.listHeader.length } : { style: { display: 'none' } })}></td>
                            )}
                        </tr>
                    )
                }
            </tbody>
        );

    }

    render() {
        if (!this.state.loaded) {
            return <svg className="lds-message" width="150" height="120" style={{width:150, height:120}} xmlns="http://www.w3.org/2000/svg" viewBox="0 20 100 100" preserveAspectRatio="xMidYMid"> <g transform="translate(20 50)"> <circle cx="0" cy="0" r="6" fill="#4658ac" transform="scale(0.291977 0.291977)"> <animateTransform attributeName="transform" type="scale" begin="-0.375s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="1s" repeatCount="indefinite"></animateTransform> </circle> </g> <g transform="translate(40 50)"> <circle cx="0" cy="0" r="6" fill="#e7008a" transform="scale(0.642625 0.642625)"> <animateTransform attributeName="transform" type="scale" begin="-0.25s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="1s" repeatCount="indefinite"></animateTransform> </circle> </g> <g transform="translate(60 50)"> <circle cx="0" cy="0" r="6" fill="#ff003a" transform="scale(0.93284 0.93284)"> <animateTransform attributeName="transform" type="scale" begin="-0.125s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="1s" repeatCount="indefinite"></animateTransform> </circle> </g> <g transform="translate(80 50)"> <circle cx="0" cy="0" r="6" fill="#ff6d00" transform="scale(0.967249 0.967249)"> <animateTransform attributeName="transform" type="scale" begin="0s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="1s" repeatCount="indefinite"></animateTransform> </circle> </g> </svg>;
        } else {
            return (
                <table ref="main" id="wysebone_table" className="table table-bordered nowrap tcs">
                    {this.renderHeader()}
                    {this.renderBody()}
                </table>
            );
        }
    }
}

window.instance_wysebone = {}

$('.wysebone_listTable').each(function (index) {
    let appcode = $(this).data('appcode');
    let attr_id = $(this).attr('id');
    let authority = $(this).data('authority');
    
    if (appcode) {
        window.instance_wysebone[appcode] = ReactDOM.hydrate(
            <Wysebone appcode={appcode} attr_id={attr_id} authority={authority} />,
            document.getElementById(attr_id)
        );
    }
})

