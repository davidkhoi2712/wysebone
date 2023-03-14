function TableManagement() {
    var self = this;
    this.rows = [];
    this.items = [];
    this.selected_items = [];

    /**
     * Remove item from rows
     * @param string item_id
     * @version 1.0.1
     */
    this.splice = function(item_id) {
        var i = 0;
        for (i = 0; i < self.rows.length; i++) {
            if (self.rows[i].id == item_id) {
                self.rows.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    /**
     * Remove item selected
     * @param string item_id
     * @version 1.0.1
     */
    this.splice_selected = function(item_id) {
        var i = 0;
        for (i = 0; i < self.selected_items.length; i++) {
            if (self.selected_items[i].id == item_id) {
                self.selected_items.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    /**
     * Render Item
     * @param objects option
     * @param objects selected
     * @version 1.0.1
     */
    this.render_item = function(option, selected) {
        let item = new ItemManagement(option, self.rows, selected);
    }

    /**
     * Filter group
     * @param string id
     * @param objects objects
     * @version 1.0.1
     */
    this.filter_group = function(id, objects) {
        let groups = [];
        $.each(objects, function(key, value) {
            if (value.code == id) {
                groups = value.groups;
            }
        });

        return groups;
    }

    /**
     * Filter user
     * @param string id
     * @param objects objects
     * @version 1.0.1
     */
    this.filter_user = function(id, objects) {
        let users = [];
        $.each(objects, function(key, value) {
            if (value.code == id) {
                users = value.users;
            }
        });

        return users;
    }

    /**
     * Create Item
     * @param objects option
     * @param array ItemArr
     * @version 1.0.1
     */
    this.create = function(option, selected, ItemArr) {
        let authority = '<td width="20%" label="' + gettext('Authority Name') + '"><input type="hidden" name="permissions" value="' + option.id + '" text="' + option.name + '">' + option.name + '</td>';
        let groups = new Group(self.filter_group(option.id, option.objects.authority), selected.groups);
        let users = new User(self.filter_user(option.id, option.objects.authority), selected.users);
        let tr = $('<tr id="auth_' + option.id + '"></tr>');
        tr.append(authority).append(groups.content).append(users.content);

        // remove item empty
        if (self.rows.length == 0) {
            $('#authority-settings tbody').html('');
        }

        $('#authority-settings tbody').append(tr);
        self.rows.push({ 'id': option.id, 'name': option.name, 'groups': option.objects.groups, 'users': option.objects.users });

        // Set item for item mode
        let arrItem = [];
        if (ItemArr.length == 0) {
            $.each(option.objects.appItems, function(key, value) {
                arrItem.push({ 'id': value.code, 'mode': null });
            });
        } else {
            $.each(ItemArr, function(key, value) {
                arrItem.push({ 'id': value.code, 'mode': value.mode });
            });
        }

        // Set item selected
        self.selected_items.push({ 'id': option.id, 'name': option.name, 'item': arrItem });
        self.render_item(option, self.selected_items);
    }

    /**
     * Delete item
     * @param objects option
     * @version 1.0.1
     */
    this.delete = function(option) {
        $('#auth_' + option.id).remove();
        self.splice(option.id);
        self.splice_selected(option.id);

        // Render item empty
        if (self.rows.length == 0) {
            let body = '<tr><td colspan="3">' + gettext('There is no data to show.') + '</td></tr>'
            $('#authority-settings tbody').html(body);
        }
        self.render_item(option, self.selected_items);
    }

    /**
     * Change mode for item
     * @param string authority_id
     * @param string item_id
     * @param int mode
     * @version 1.0.1
     */
    this.change_mode_item = function(authority_id, item_id, mode) {
        $.each(self.selected_items, function(key, value) {
            if (value.id == authority_id) {
                $.each(value.item, function(key1, value1) {
                    if (value1.id == item_id) {
                        value1.mode = mode;
                    }
                });
            }
        });
    }

    /**
     * Get item mode
     * @param string authority_id
     * @version 1.0.1
     */
    this.get_item_mode = function(authority_id) {
        let item = [];
        $.each(self.selected_items, function(key, value) {
            if (value.id == authority_id) {
                $.each(value.item, function(key1, value1) {
                    if (value1.mode == null) {
                        value1.mode = ITEM_MODE_VIEW;
                    }
                });
                item = value.item;
            }
        });

        return item;
    }
}