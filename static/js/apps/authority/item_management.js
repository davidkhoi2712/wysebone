const ITEM_MODE_UPDATE = 1;
const ITEM_MODE_VIEW = 2;
const ITEM_MODE_HIDDEN = 3;

function ItemManagement(option, rows, selected) {
    var self = this;
    this.list_item = option.objects.appItems;
    this.list_type = option.objects.itemTypes;
    this.rows = rows;
    this.selected = selected;

    this.init = function() {
        let table = $('#item-settings');
        if (self.rows.length > 0 && self.list_item.length > 0) {
            table.parent().removeClass('col-lg-6');
            table.parent().addClass('col-lg-12');
            $('#authority-header').removeClass('d-none');
            $('#authority-header').attr('colspan', self.rows.length);
            var td = '';
            $.each(self.rows, function(key, value) {
                td += '<td>' + value.name + '</td>';
            });
            $('#authority-sub-header').html(td);
            self.template();
        } else {
            $('#authority-header').addClass('d-none');
            table.parent().removeClass('col-lg-12');
            table.parent().addClass('col-lg-6');
            $('#authority-sub-header').html('');
            let body = '<tr><td colspan="2">' + gettext('There is no data to show.') + '</td></tr>';
            $('#item-settings tbody').html(body);
        }

    }

    /**
     * Set template
     * @version 1.0.1
     */
    this.template = function() {
        let tr = '';
        $.each(self.list_item, function(key, value) {
            tr += '<tr id="item_' + value.code + '"><td label="' + gettext('Item name') + '"><input type="hidden" name="items" value="' + value.code + '">' + value.name + '</td><td label="' + gettext('Attribute') + '">' + self.filter_itemType(value.attribute) + '</td>';
            $.each(self.rows, function(key1, value1) {
                if (self.filter_mode(value1.id, value.code) != 0) {
                    tr += '<td label="' + value1.name + '"><select class="form-control" name="mode" data-code="' + value.code + '" code="' + value1.id + '" label="' + value1.name + '">' +
                        '<option value="' + ITEM_MODE_VIEW + '" ' + ((self.filter_mode(value1.id, value.code) == ITEM_MODE_VIEW || self.filter_mode(value1.id, value.code) == null) ? 'selected' : '') + '>' + gettext('VIEW') + '</option>' +
                        '<option value="' + ITEM_MODE_UPDATE + '" ' + ((self.filter_mode(value1.id, value.code) == ITEM_MODE_UPDATE) ? 'selected' : '') + '>' + gettext('UPDATE') + '</option>' +
                        '<option value="' + ITEM_MODE_HIDDEN + '" ' + ((self.filter_mode(value1.id, value.code) == ITEM_MODE_HIDDEN) ? 'selected' : '') + '>' + gettext('HIDDEN') + '</option>' +
                        '</select></td>';
                }

            });
            tr += '</tr>';
        });

        $('#item-settings tbody').html(tr);
    }

    /**
     * Filter name of item type
     * @version 1.0.1
     */
    this.filter_itemType = function(id) {
        let name = '';
        $.each(self.list_type, function(key, value) {
            if (value.id == id) {
                name = value.name;
            }
        });
        return name;
    }

    /**
     * Filter mode for item
     * @version 1.0.1
     */
    this.filter_mode = function(authority_id, item_id) {
        let mode = null;
        $.each(self.selected, function(key, value) {
            if (value.id == authority_id) {
                $.each(value.item, function(key1, value1) {
                    if (value1.id == item_id) {
                        mode = value1.mode;
                    }
                });
            }
        });

        return mode;
    }

    this.init();
}