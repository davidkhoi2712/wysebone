function Group(option, selected) {
    var self = this;

    this.list_group = option;
    this.selected = [];

    // Create template for group
    this.template = $('<select class="form-control multiple" multiple name="groups" placeholder="' + gettext('Please select') + '"></select>');

    this.content = $('<td width="40%" label="' + gettext('Authority Group') + '"></td>');

    this.set_selected = function() {
        // Create list selected
        $.each(selected, function(key, value) {
            self.selected.push(value.uuid);
        });
    }

    // Event change group
    this.event = function() {
        self.template.on('change', function() {
            is_edited = true;
        });
    }

    this.init = function() {
        let option = '';
        self.set_selected();
        $.each(self.list_group, function(key, value) {
            option += '<option value="' + value.uuid + '" ' + ((self.selected.indexOf(value.uuid) != -1) ? 'selected' : '') + '>' + value.name + '</option>';
        });
        self.template.append(option);
        self.content.append(self.template);
        self.event();
    }

    this.init();
}