function User(option, selected) {
    var self = this;

    this.list_user = option;
    this.selected = [];

    // Create template for user
    this.template = $('<select class="form-control multiple" multiple name="users" placeholder="' + gettext('Please select') + '"></select>');

    this.content = $('<td width="40%" label="' + gettext('Authority User') + '"></td>');

    this.set_selected = function() {
        // Create list selected
        $.each(selected, function(key, value) {
            self.selected.push(value.user_id);
        });
    }

    // Event change user
    this.event = function() {
        self.template.on('change', function() {
            is_edited = true;
        });
    }

    this.init = function() {
        let option = '';
        self.set_selected();
        $.each(self.list_user, function(key, value) {
            option += '<option value="' + value.user_id + '" ' + ((self.selected.indexOf(value.user_id) != -1) ? 'selected' : '') + '>' + value.first_name + ' ' + value.last_name + '</option>';
        });
        self.template.append(option);
        self.content.append(self.template);
        self.event();
    }

    this.init();
}