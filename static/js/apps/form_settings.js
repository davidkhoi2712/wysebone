var itemTypes = [];
var is_edited = false;
var tablePrimary = 0;
var inputProperty = [];

var Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 5000,
});

var xSave;
var ySave;

// Collision detection
function collision($sib, $el) {
    var sibInner = $sib.find('.item-content');
    var wigInner = $el.find('.item-content');
    var x1 = wigInner.offset().left;
    var y1 = wigInner.offset().top;
    var h1 = wigInner.outerHeight(true);
    var w1 = wigInner.outerWidth(true);
    var b1 = y1 + h1;
    var r1 = x1 + w1;
    var x2 = sibInner.offset().left;
    var y2 = sibInner.offset().top;
    var h2 = sibInner.outerHeight(true);
    var w2 = sibInner.outerWidth(true);
    var b2 = y2 + h2;
    var r2 = x2 + w2;

    // CHECK FOR COLLISION
    if ((r1 >= x2 && b1 >= y2 && y1 < y2 && x1 < r2) ||
        (x1 <= r2 && b1 >= y2 && y1 < y2 && r1 > r2) ||
        (r1 >= x2 && y1 <= b2 && b1 > b2 && x1 < x2) ||
        (x1 <= r2 && y1 <= b2 && b1 > b2 && r1 > r2) ||
        (y1 == y2 && r1 == r2 && b1 == b2 && x1 == x2) ||
        (y1 >= y2 && x1 < r2 && b1 <= b2 && r1 > r2) ||
        (y1 >= y2 && r1 >= x2 && b1 <= b2 && x1 < x2) ||
        (x1 >= x2 && r1 <= r2 && y1 <= b2 && b1 > b2) ||
        (x1 >= x2 && y1 >= y2 && b1 <= b2 && r1 <= r2)
    ) {
        sibInner.addClass('collision');
        wigInner.css('left', x2 - x1 + '!important');
        return true;
    } else {
        sibInner.removeClass('collision');
    }
}

function checkOverlap(ui) {
    $('.collision').each(function() {
        $sib = $(this).parent();

        $(this).removeClass('collision');
        let pos = $sib.position();

        if ($sib.hasClass('overlap')) return;

        if (pos.left > ui.position.left) {
            $(ui.helper).data('pos', ui.position)
            $sib.data('left', pos.left).css('left', pos.left + $(ui.helper).width() + 10).addClass('overlap');
            $('.wb-drop-item').each(function() {
                var $sib1 = $(this);

                if ($sib1.hasClass('overlap')) return;

                var sa = collision($sib1, $sib);
            });
            checkOverlap(ui)

        }
    })
}

function AppForm() {
    var self = this;
    this.item_type = new ItemType();
    this.listApp = [];
    this.eventList = [];
    this.items_management = new ObjectManagement();
    this.table_management = new TableManagement(this);

    this.canvas = $('.canvas');

    this.is_new_app = $('#is_new_app').val();
    if (typeof(this.is_new_app) == 'undefined') {
        this.is_new_app = '0';
    }

    this.app_code = $('#app_id').val();
    if (this.is_new_app == '1') {
        this.app_code = '0';
    }

    this.dragging = $('#wb-dragging');
    this.app_items = [];
    this.property = { name: $('#app_name').val(), field_code: 'Overrall01', inputs: [], events: [] };

    /**
     * Display app items
     * @version 1.0.0
     */
    this.display_app_items = function() {

        // Loop each app items
        $.each(self.app_items, function(index, item) {
            try {
                item.itemtype = self.item_type.filter(item.attribute__id);
                item.tableItem = self.table_management.filter_table_item(item.table_item);
                var obj_droper = self.items_management.create(self, item);
                obj_droper._item.append(obj_droper._content);
                obj_droper._item.css({
                    'left': self.round_position(item.item_json.left, 10),
                    'top': self.round_position(item.item_json.top, 10)
                })

                self.canvas.append(obj_droper._item);

                self.resizeCanvas();

                let handles = (obj_droper instanceof ListObjectField || obj_droper instanceof IframeField) ? 'e,s,se' : 'e';

                obj_droper._item.resizable({
                    grid: [10, 1],
                    handles: handles,
                    resize: function(event, ui) {
                        self.resizeCanvas();
                        is_edited = true;
                    },
                    stop: function(event, ui) {
                        self.resizeCanvas();
                    }
                });

                // Disable item has choose
                $('.wb-drag-item[data-table-item="' + item.table_item + '"]').draggable("disable");
                $('#table_items_field option[value="' + item.table_item + '"]').prop('disabled', true);

            } catch (err) {
                console.log(err.message);
            }
        });

        $('.wb-drop-item').draggable({
            containment: 'parent',
            scroll: true,
            grid: [10, 10],
            refreshPositions: true,
            zIndex: 10000,
            start: function(event, ui) {
                is_edited = true;

                // save coordinates for collision detection.
                xSave = $(this).position().left;
                ySave = $(this).position().top;
                var $el = $(this);
                var $elSibs = $(this).siblings('.wb-drop-item');
                // DETECT COLLISION
                $elSibs.each(function() {
                    var self = this;
                    var $sib = $(self);
                    collision($sib, $el);
                });

            },
            drag: function(event, ui) {
                self.resizeCanvas();

                $('.overlap').each(function() {
                    let pos = $(this).position();
                    let bottom = pos.top + $(this).height()
                    if (bottom < ui.position.top || bottom > ui.position.top) {
                        $(this).css('left', $(this).data('left')).removeClass('overlap')
                    }
                })

                var $el = $(this);
                var $elSibs = $(this).siblings('.wb-drop-item');
                // DETECT COLLISION
                $elSibs.each(function() {
                    var self = this;
                    var $sib = $(self);
                    collision($sib, $el);
                });

                checkOverlap(ui);

                var startPosition = $(this).position();
                $(this).css({
                    'left': self.round_position(startPosition.left, 10),
                    'top': self.round_position(startPosition.top, 10)
                })
            },
            stop: function(event, ui) {
                self.resizeCanvas();
                var $el = $(this);
                var $elSibs = $(this).siblings('.wb-drop-item');
                $el.removeClass('dragging');
                // DETECT COLLISION
                $elSibs.each(function() {
                    var self = this;
                    var $sib = $(self);
                    collision($sib, $el);
                    var result = collision($sib, $el);
                    // if there is collision, we send back to start position.
                    if (result == true) {
                        $el.css({ 'top': ySave, 'left': xSave });
                        $sib.find('.item-content').removeClass('collision');
                    }
                });
                $('.wb-drop-item').removeClass('overlap');
            },
        });
    }

    this.resizeCanvas = function() {
        var left = 0,
            top = 0;

        $('.canvas').find('.wb-drop-item').each(function(index) {
            var w = $(this).outerWidth() + $(this).position().left;
            if (w > left) {
                left = w;
            }

            var h = $(this).outerHeight() + $(this).position().top;
            if (h > top) {
                top = h;
            }
        });

        $('.canvas').css('width', (left + 500) + 'px');
        $('.canvas').css('height', (top + 400) + 'px');
    }

    this.enableDraggable = function(item_id) {
        let item = self.items_management.get_item_data(item_id);

        if (item.table_item_id == null || item.table_item_id == '')
            return

        // Enable item has choose
        $('.wb-drag-item[data-table-item="' + item.table_item_id + '"]').draggable("enable");
    }

    /**
     * Drop item
     * @version 1.0.0
     */
    this.create_item = function(ui) {
        try {
            self.resizeCanvas();

            var item = ui.helper;
            var itemtype = self.item_type.filter(parseInt($(item[0]).data('itemtype'), 10));
            var tableItem = self.table_management.filter_table_item(parseInt($(item[0]).data('table-item'), 10));

            if ($(item[0]).data('table-item') != undefined) {
                // Disable item table
                $('#table_items_field option[value="' + $(item[0]).data('table-item') + '"]').prop('disabled', true);
            }

            var option = {
                itemtype: itemtype,
                tableItem: tableItem
            };

            var obj_droper = self.items_management.create(self, option);

            $(item).html(obj_droper._content);
            $(item).css('visibility', 'hidden');
            $(item).css("height", 'auto');
            $(item).data("item-id", obj_droper.id);

            self.dragging.show();
            self.dragging.css('left', ui.offset.left + 'px');
            self.dragging.css('top', (ui.offset.top - $(window).scrollTop()) + 'px');
            self.dragging.css('width', obj_droper.width + 'px');
            self.dragging.css('height', ($(item).height() - 20) + 'px');
        } catch (err) {
            console.log(err.message);
        }
    }

    /**
     * Set sortable, draggable and droppable event
     * @version 1.0.0
     */
    this.set_event = function() {
        // Drag item
        $(".wb-drag-item:not(.ui-draggable-handle)").draggable({
            scroll: true,
            helper: "clone",
            cursor: "move",
            start: function(event, ui) {
                is_edited = true;
                self.create_item(ui);
            },
            drag: function(event, ui) {
                self.dragging.css('left', ui.offset.left + 'px');
                self.dragging.css('top', (ui.offset.top - $(window).scrollTop()) + 'px');
            },
            stop: function(event, ui) {
                self.dragging.hide();
                self.dragging.css('left', '-1000px');
                self.dragging.css('top', '-1000px');
            },
            containment: 'document',
            zIndex: 100,
            addClasses: false
        });

        $(".canvas").droppable({
            accept: ".wb-drag-item",
            drop: function(event, ui) {
                var helper = ui.helper;

                if (helper[0].hasAttribute('data-table-item'))
                    ui.draggable.draggable("disable");

                var id = $(helper).data('item-id');

                var obj_droper = self.items_management.filter({ 'id': id });
                obj_droper._item.append(obj_droper._content);
                obj_droper._item.css('top', self.round_position(ui.offset.top - $(this).offset().top, 10));
                obj_droper._item.css('left', self.round_position(ui.offset.left - $(this).offset().left, 10));

                $(this).append(obj_droper._item);

                self.resizeCanvas();

                let handles = (obj_droper instanceof ListObjectField || obj_droper instanceof IframeField) ? 'e,s,se' : 'e';

                obj_droper._item.draggable({
                    containment: 'parent',
                    scroll: true,
                    grid: [10, 10],
                    refreshPositions: true,
                    zIndex: 10000,
                    start: function(event, ui) {
                        is_edited = true;

                        // save coordinates for collision detection.
                        xSave = $(this).position().left;
                        ySave = $(this).position().top;
                        var $el = $(this);
                        var $elSibs = $(this).siblings('.wb-drop-item');
                        // DETECT COLLISION
                        $elSibs.each(function() {
                            var self = this;
                            var $sib = $(self);
                            collision($sib, $el);
                        });

                    },
                    drag: function(event, ui) {
                        self.resizeCanvas();

                        $('.overlap').each(function() {
                            let pos = $(this).position();
                            let bottom = pos.top + $(this).height()
                            if (bottom < ui.position.top || bottom > ui.position.top) {
                                $(this).css('left', $(this).data('left')).removeClass('overlap')
                            }
                        })

                        var $el = $(this);
                        var $elSibs = $(this).siblings('.wb-drop-item');
                        // DETECT COLLISION
                        $elSibs.each(function() {
                            var self = this;
                            var $sib = $(self);
                            collision($sib, $el);
                        });

                        checkOverlap(ui);

                        var startPosition = $(this).position();
                        $(this).css({
                            'left': self.round_position(startPosition.left, 10),
                            'top': self.round_position(startPosition.top, 10)
                        })
                    },
                    stop: function(event, ui) {
                        self.resizeCanvas();
                        var $el = $(this);
                        var $elSibs = $(this).siblings('.wb-drop-item');
                        $el.removeClass('dragging');
                        // DETECT COLLISION
                        $elSibs.each(function() {
                            var self = this;
                            var $sib = $(self);
                            collision($sib, $el);
                            var result = collision($sib, $el);
                            // if there is collision, we send back to start position.
                            if (result == true) {
                                $el.css({ 'top': ySave, 'left': xSave });
                                $sib.find('.item-content').removeClass('collision');
                            }
                        });
                        $('.wb-drop-item').removeClass('overlap');
                    },
                }).resizable({
                    grid: [10, 1],
                    handles: handles,
                    resize: function(event, ui) {
                        self.resizeCanvas();
                        is_edited = true;
                    },
                    stop: function(event, ui) {
                        self.resizeCanvas();
                    }
                });

            }
        });
    }

    this.validate = function() {
        // Validate table item is required
        var tableItems = self.table_management.get_available_items();
        var is_required = true;
        $.each(tableItems, function(index, item) {
            if (item.item_json.required) {
                if (self.items_management.filter({ 'tableItem_id': item.id.toString() }) == null) {
                    is_required = false;
                    alert(interpolate(gettext('The %s field is required.'), [item.item_name]));
                    return false;
                }
            }
        });

        if (!is_required) {
            return false;
        }

        // Validate event button
        is_required = true;
        $.each(self.items_management.items, function(index, item) {
            if (item.itemtype.id == BUTTON) {
                if (item.process == '') {
                    is_required = false;
                    alert(interpolate(gettext('Please set the event for the "%s" button.'), [item.name]));
                    return false;
                }
            }
        });

        if (!is_required) {
            return false;
        }

        return true;
    }

    /**
     * Submit form
     * @version 1.0.0
     */
    this.submit_event = function() {
        $("#app_settings").submit(function(e) {
            e.preventDefault();
            let link_table_item = false;

            if (!self.validate()) {
                $("#app_settings").find("[type='submit']").attr("disabled", false);
                return false;
            }

            var items = [];

            $('.invalid-feedback').remove();

            // Loop each rows to get items
            $('.canvas').find('.wb-drop-item').each(function(index) {
                var item = $(this);
                var item_put = self.items_management.get_item_data(item.attr('id'));

                if (item_put != null) {
                    item_put.width = item.outerWidth();
                    item_put.height = item.outerHeight();
                    item_put.left = item.position().left;
                    item_put.top = item.position().top;
                    items.push(item_put);
                }
            });

            if (link_table_item) {
                $('[type="submit"]').prop('disabled', false);
                return false;
            }

            // Information app
            let app_name = $('#app_name').val();
            let app_icon = $('#app_icon').val();
            let app_color = $('#app_color').val();
            let is_menu = $('#is_menu').prop("checked") == true ? true : false;

            // Validate application name
            if ($.trim(app_name) == '') {
                $('#app_name').addClass('is-invalid');
                $('#sub_appname').hide();
                let error = '<div class="invalid-feedback">' + interpolate(gettext('The %s field is required.'), [gettext('Application name')]) + '</div>';
                $('#app_name').parent().find('div.invalid-feedback').remove();
                $('#app_name').parent().append(error);
                $('#app_name').val($.trim(app_name));
                $('[type="submit"]').prop('disabled', false);
                return false;
            }

            $('.spinner').removeClass('d-none');
            api({
                type: 'PUT',
                url: 'app/' + self.app_code,
                dataType: 'json',
                data: JSON.stringify({
                    items: items,
                    tables: self.table_management.get_selected_tables_id(),
                    app_name: $.trim(app_name),
                    app_icon: app_icon,
                    app_color: app_color,
                    is_new_app: self.is_new_app,
                    property: self.property,
                    menu: is_menu
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                success: function(data) {
                    if (next_uri == '') {
                        window.location.href = base_url + '/app';
                    } else {
                        window.location.href = base_url + next_uri;
                    }
                },
                error: function(response, status, error) {
                    $('.spinner').addClass('d-none');
                    $("#app_settings").find("[type='submit']").attr("disabled", false);

                    $('.canvas').find('.wb-drop-item').each(function(index) {
                        var item = $(this);
                        var item_put = self.items_management.get_item_data(item.attr('id'));

                        if (item_put.table_item_id == '') {
                            item.find('.item-content').addClass('is_invalid').append('<div class="invalid-feedback">' + gettext('Please set table link for this item.') + '</div>');
                        }
                    });

                    if (typeof(response.responseJSON) == 'undefined') {
                        Toast.fire({
                            title: gettext('An error occurred while processing. Please try again later.')
                        });
                        return false;
                    }

                    if (response.status == 404) {
                        window.location.href = base_url + '/app';
                        return false;
                    }

                    if (typeof(response.responseJSON.errors) != 'undefined') {
                        var errors = response.responseJSON.errors;

                        if (typeof(errors.name) != 'undefined') {
                            $('#app_name').addClass('is-invalid');
                            $('#sub_appname').hide();
                            $('#app_name').parent().find('div.invalid-feedback').remove();
                            $('#app_name').parent().append('<div class="invalid-feedback">' + errors.name[0] + '</div>');
                            $('#app_name').val($.trim(app_name));
                            return false;
                        } else {
                            $('#app_name').removeClass('is-invalid');
                            $('#sub_appname').show();
                            $('#app_name').parent().find('div.invalid-feedback').remove();
                        }

                        if (typeof(errors.tables) != 'undefined') {
                            Toast.fire({
                                title: errors.tables[0]
                            });
                            return false;
                        }

                        if (typeof(errors.icon) != 'undefined') {
                            Toast.fire({
                                title: errors.icon[0]
                            });
                            return false;
                        }

                        if (typeof(errors.color) != 'undefined') {
                            Toast.fire({
                                title: errors.color[0]
                            });
                        }

                        return false;
                    }

                    Toast.fire({
                        title: response.responseJSON.message
                    });
                }
            });

            return false;
        });
    }

    /**
     * Get data from server
     * @version 1.0.2
     */
    this.get_data_from_server = function() {
        $('.spinner').removeClass('d-none');

        api({
            type: 'GET',
            url: 'app/' + self.app_code,
            dataType: 'json',
            data: { is_new_app: self.is_new_app },
            success: function(data) {
                $('.spinner').addClass('d-none');

                itemTypes = data.itemTypes;
                tablePrimary = data.tablePrimary;
                self.eventList = data.eventList;
                self.app_items = data.appItems;
                self.listApp = data.listApp;
                inputProperty = data.input;

                if (data.property != null) {
                    self.property = data.property;
                }

                // All tables in DB
                self.table_management.tableList = data.tableList;

                // Update selected tables
                self.table_management.updateTableSelected(data.appTables);

                // Update the items added into app
                self.display_app_items();
            },
            error: function(response, status, error) {
                alert(gettext('An error occurred while processing. Please try again later.'));
                window.location.href = base_url + '/app'
            }
        });
    }

    /**
     * round the starting position to the nearest radix pixels
     */
    this.round_position = function(pos, radix) {
        return Math.round(pos / radix) * radix;
    }

    this.init = function() {
        self.submit_event();
        self.get_data_from_server();

        $("body").on('change', '#auto_number_field', function() {
            $("#not_autonumber").toggle(!$(this).is(':checked'))
        })

        $('#attributeModal').on('show.bs.modal', function(e) {
            $("#not_autonumber").toggle(!$('#auto_number_field').is(':checked'))
        })
        // Event for property
        $('#view-property').on('click', function() {
            let property = new Property(self, { 'input': inputProperty });
        });
    }

    this.init();

    /**
     * Get list of table items selected
     * @version 1.0.0
     */
    this.get_tableItems = function() {
        var tableItems = [];
        $.each(self.items_management.items, function(index, item) {
            if (item.tableItem_id != '') {
                tableItems.push(parseInt(item.tableItem_id, 10));
            }
        });

        return tableItems;
    }

    /**
     * Check item is draggable
     * @version 1.0.0
     */
    this.verify_draggable = function() {
        // Get list of table items
        var tableItems = self.get_tableItems();

        $('.wb-drag-item').each(function(index) {
            var item = $(this);
            var tableitem_id = item.data('table-item');
            if (typeof(tableitem_id) == 'undefined') {
                return true;
            }

            if (jQuery.inArray(tableitem_id, tableItems) == -1) {
                item.draggable("enable");
                item.removeClass('disabled');
            } else {
                item.draggable("disable");
            }
        });
    }

    this.disabled_selected_options = function(tableItem_id) {
        var tableItems = self.get_tableItems();

        $('#table_items_field').find('option').each(function(index) {
            var option = $(this);
            var value = parseInt(option.val(), 10);

            if (value == tableItem_id || jQuery.inArray(value, tableItems) == -1) {
                option.prop('disabled', false);
            } else {
                option.prop('disabled', true);
            }
        });
    }

    this.display_field_code = function() {
        let html = ' <div class="row form-group"> ' +
            '     <div class="col-md-6"> ' +
            '         <label for="field_code_field"><b>' + gettext("Field Code") + '</b></label> ' +
            '         <input type="text" class="form-control" id="field_code_field" value="" required readonly> ' +
            '     </div> ' +
            '     <div class="col-md-12"> ' +
            '         <small class="form-text text-muted">' + gettext("Each field in a Wysebone app has a Field Code, that is unique within the App. These field codes are necessary when creating, retrieving, and updating data via API.") + '</small> ' +
            '     </div> ' +
            ' </div>';
        return html;
    }

    /**
     * Remove the items in table
     * @version 1.0.2
     */
    this.removeItemsInApp = function(item_id) {
        var item = self.items_management.filter({ 'tableItem_id': item_id.toString() });
        if (item != null) {
            item.delete();
        }
    }
}

jQuery(document).ready(function($) {
    new AppForm();
});