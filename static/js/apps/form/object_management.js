function ObjectManagement()
{
    var self = this;
    this.items = [];
    this.total_item = 0;

    /**
     * Push item
     * @param object item
     * @version 1.0.0
     */
    this.push = function(item)
    {
        self.items.push(item);
    }

    /**
     * Remove item from item ID
     * @param string item_id
     * @version 1.0.0
     */
    this.splice = function(item_id)
    {
        var i = 0;
        for (i = 0; i < self.items.length; i++) {
            if (self.items[i].id == item_id) {
                self.items.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    /**
     * Get length of items
     * @version 1.0.0
     */
    this.length = function()
    {
        return self.items.length;
    }

    /**
     * Filter item
     * @param string item_id
     * @version 1.0.0
     */
    this.filter = function(obj)
    {
        let data = _.filter(self.items, obj);

        if (data) {
            return _.head(data);
        }
        
        return null;
    }

    /**
     * Get item data for update DB
     * @param string item_id
     * @version 1.0.0
     */
    this.get_item_data = function(item_id)
    {
        // Get item from id
        var item = self.filter({'id': item_id});
        if (item == null) {
            return null;
        }

        switch (item.itemtype.id) {
            case TEXT:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    table_item_id: item.tableItem_id,
                    hide_field_name: item.hide_field_name,
                    required: item.required,
                    min_length: item.min_length,
                    max_length: item.max_length,
                    default_value: item.default_value,
                    number_lines: item.number_lines,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };

            case LABEL:
                return {
                    code: item.code,
                    name: item.name,
                    display: item.display,
                    width: item.width,
                    attribute_id: item.itemtype.id,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };

            case CHECKBOX:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    table_item_id: item.tableItem_id,
                    hide_field_name: item.hide_field_name,
                    default_value: item.default_value,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };

            case NUMBER:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    table_item_id: item.tableItem_id,
                    auto_number: item.auto_number,
                    hide_field_name: item.hide_field_name,
                    thousands_separators: item.thousands_separators,
                    required: item.required,
                    min_value: item.min_value,
                    max_value: item.max_value,
                    default_value: item.default_value,
                    decimal_places: item.decimal_places,
                    unit_measure: item.unit_measure,
                    unit_measure_position: item.unit_measure_position,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };

            case SELECTION:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    table_item_id: item.tableItem_id,
                    hide_field_name: item.hide_field_name,
                    required: item.required,
                    options: item.get_options(),
                    default_value: item.default_value,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };

            case DATE:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    table_item_id: item.tableItem_id,
                    hide_field_name: item.hide_field_name,
                    required: item.required,
                    default_value: item.default_value,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };

            case BUTTON:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    bg_color: item.bg_color,
                    text_color: item.text_color,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };

            case LIST_OBJECT:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };
            
            case LOOKUP:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    table_item_id: item.tableItem_id,
                    hide_field_name: item.hide_field_name,
                    required: item.required,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };

            case IFRAME:
                return {
                    code: item.code,
                    name: item.name,
                    attribute_id: item.itemtype.id,
                    field_code: item.field_code,
                    inputs: item._input.get(),
                    outputs: item._output.get(),
                    events: item._event.get()
                };
        }

        return null;
    }

    /**
     * Get field_code
     * @version 1.0.0
     */
    this.get_field_code = function(varchar)
    {
        var field_code = varchar + '_' + (self.total_item + 1);

        return field_code;
    }

    /**
     * Get list field_code
     * @version 1.0.1
     */
    this.get_list_field_code = function (code) {
        let field_code = [];
        
        $.each(self.items, function (index, item) {
            if (item.field_code) {
                field_code.push(item.field_code);
            
                if (item.field_code != code) {
                    $.each(item.outputs, function (i, out) {
                        field_code.push(out.code);
                    })
                }
            }
        })

        return field_code;
    }

    /**
     * Get list objects
     * 
     * @param type integer 
     * @version 1.0.2
     */
    this.get_list_objects = function (type) {
        let list = [];
        
        $.each(_.filter(self.items, { 'itemtype': { 'id': type }}), function (index, item) {
            list.push(item.field_code);
        })

        return list;
    }

    /**
     * Create item
     */
    this.create = function(parent, option)
    {
        var itemtype = option.itemtype;

        var item_option = {};
        item_option.parent = parent;
        item_option.itemtype = itemtype;

        if (typeof(option.code) != 'undefined') {
            item_option.code = option.code;
        }

        try {
            item_option.width = option.item_json.width;
        }
        catch(err) {
            console.log(err.message);
        }

        try {
            var tableItem = option.tableItem;
        }
        catch(err) {
            console.log(err.message);
        }

        // required
        try {
            item_option.required = option.item_json.required;
            
        }
        catch(err) {
            try {
                item_option.required = tableItem.item_json.required;
            }
            catch(err) {}
        }

        try {
            item_option.is_force_required = tableItem.item_json.required;
        }
        catch(err) {}

        // field_name
        if (typeof (option.name) != 'undefined') {
            item_option.name = option.name;
        } else {
            try {
                item_option.name = tableItem.item_name;
            }
            catch(err) {
                console.log(err.message);
            }
        }

        try {
            item_option.input = option.item_json.inputs;
            item_option.output = option.item_json.outputs;
            item_option.events = option.item_json.events;
        }
        catch (err) {
        }

        var item = null;
        switch (itemtype.id) {
            case BUTTON:
                $.extend( item_option, self.get_button_options(option) );
                item = new ButtonField(item_option);
                break;

            case DATE:
                $.extend( item_option, self.get_date_options(option, tableItem) );
                item = new DateField(item_option);
                break;

            case SELECTION:
                $.extend( item_option, self.get_selection_options(option, tableItem) );
                item = new SelectionField(item_option);
                break;

            case NUMBER:
                $.extend( item_option, self.get_numeric_options(option, tableItem) );
                item = new NumericField(item_option);
                break;

            case CHECKBOX:
                $.extend( item_option, self.get_checkbox_options(option, tableItem) );
                item = new CheckboxField(item_option);
                break;

            case LABEL:
                $.extend( item_option, self.get_label_options(option) );
                item = new LabelField(item_option);
                break;

            case TEXT:
                $.extend( item_option, self.get_text_options( option, tableItem ) );
                item = new TextField(item_option);
                break;
            
            case LIST_OBJECT:
                $.extend( item_option, self.get_list_object_options(option) );
                item = new ListObjectField(item_option);
                break;

            case LOOKUP:
                $.extend( item_option, self.get_lookup_options(option) );
                item = new LookupField(item_option);
                break;

            case IFRAME:
                $.extend( item_option, self.get_iframe_options(option) );
                item = new IframeField(item_option);
                break;
        }
        self.items.push(item);
        self.total_item += 1;
        
        return item;
    }

    /**
     * Get button opions
     * @version 1.0.0
     */
    this.get_button_options = function(option)
    {
        var item_option = {};

        try {
            item_option.bg_color = option.item_json.bg_color;
        }
        catch(err) {
            console.log(err.message);
        }

        try {
            item_option.text_color = option.item_json.text_color;
        }
        catch(err) {
            console.log(err.message);
        }

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Button');
        }

        return item_option;
    }

    /**
     * Get label opions
     * @version 1.0.0
     */
    this.get_label_options = function(option)
    {
        var item_option = {};

        try {
            item_option.display = option.item_json.display;
        }
        catch(err) {
            console.log(err.message);
        }

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Label');
        }

        return item_option;
    }

    /**
     * Get date opions
     * @version 1.0.0
     */
    this.get_date_options = function(option, tableItem)
    {
        var item_option = {};

        // hide_field_name
        try {
            item_option.hide_field_name = option.item_json.hide_field_name;
        }
        catch(err) {
            console.log(err.message);
        }

        // default_value
        try {
            item_option.default_value = option.item_json.default_value;
        }
        catch(err) {
            try {
                item_option.default_value = tableItem.item_json.default_value;
            }
            catch(err) {
                console.log(err.message);
            }
        }

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Date');
        }

        // number_lines
        if (typeof (option.table_item_id) != 'undefined') {
            item_option.tableItem_id = option.table_item_id.toString();
        } else {
            try {
                item_option.tableItem_id = tableItem.id.toString();
            }
            catch(err) {
                console.log(err.message);
            }
        }

        return item_option;
    }

    /**
     * Get selection option
     * @version 1.0.0
     */
    this.get_selection_options = function(option, tableItem)
    {
        var item_option = {};

        // hide_field_name
        try {
            item_option.hide_field_name = option.item_json.hide_field_name;
        }
        catch(err) {
            console.log(err.message);
        }

        // options
        try {
            item_option.options = option.item_json.options;
        }
        catch(err) {
            console.log(err.message);
        }

        // default_value
        try {
            item_option.default_value = option.item_json.default_value;
        }
        catch(err) {
            try {
                item_option.default_value = tableItem.item_json.default_value;
            }
            catch(err) {
                console.log(err.message);
            }
        }

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Selection');
        }

        // number_lines
        if (typeof (option.table_item_id) != 'undefined') {
            item_option.tableItem_id = option.table_item_id.toString();
        } else {
            try {
                item_option.tableItem_id = tableItem.id.toString();
            }
            catch(err) {
                console.log(err.message);
            }
        }

        return item_option;
    }

    /**
     * Get options for Numeric type
     * @version 1.0.0
     */
    this.get_numeric_options = function(option, tableItem)
    {
        var item_option = {};

        // hide_field_name
        try {
            item_option.hide_field_name = option.item_json.hide_field_name;
        }
        catch(err) {
            console.log(err.message);
        }

        // thousands_separators
        try {
            item_option.thousands_separators = option.item_json.thousands_separators;
        }
        catch(err) {
            console.log(err.message);
        }

        // decimal_places
        try {
            item_option.decimal_places = option.item_json.decimal_places;
        }
        catch(err) {
            console.log(err.message);
        }

        // unit_measure
        try {
            item_option.unit_measure = option.item_json.unit_measure;
        }
        catch(err) {
            console.log(err.message);
        }

        // unit_measure_prefix
        try {
            item_option.unit_measure_position = option.item_json.unit_measure_position;
        }
        catch(err) {
            console.log(err.message);
        }

        // min_length
        try {
            item_option.min_value = option.item_json.min_value;
        }
        catch(err) {
            console.log(err.message);
        }

        // max_length
        try {
            item_option.max_value = option.item_json.max_value;
        }
        catch(err) {
            console.log(err.message);
        }

        // default_value
        try {
            item_option.default_value = option.item_json.default_value;
        }
        catch(err) {
            try {
                item_option.default_value = tableItem.item_json.default_value;
            }
            catch(err) {
                console.log(err.message);
            }
        }


        // Auto number
        try {
            item_option.auto_number = option.item_json.auto_number;
        }
        catch (err) {
        }

        try {
            item_option.is_force_auto_number = tableItem.item_json.auto_number;
        }
        catch (err) {
        }

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Numeric');
        }

        // number_lines
        if (typeof (option.table_item_id) != 'undefined') {
            item_option.tableItem_id = option.table_item_id.toString();
        } else {
            try {
                item_option.tableItem_id = tableItem.id.toString();
            }
            catch(err) {
                console.log(err.message);
            }
        }

        return item_option;
    }

    /**
     * Get options for Checkbox type
     * @version 1.0.0
     */
    this.get_checkbox_options = function(option, tableItem)
    {
        var item_option = {};

        // hide_field_name
        try {
            item_option.hide_field_name = option.item_json.hide_field_name;
        }
        catch(err) {
            console.log(err.message);
        }

        // default_value
        try {
            item_option.default_value = option.item_json.default_value;
        }
        catch(err) {
            try {
                item_option.default_value = tableItem.item_json.default_value;
            }
            catch(err) {
                console.log(err.message);
            }
        }

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Checkbox');
        }

        // number_lines
        if (typeof (option.table_item_id) != 'undefined') {
            item_option.tableItem_id = option.table_item_id.toString();
        } else {
            try {
                item_option.tableItem_id = tableItem.id.toString();
            }
            catch(err) {
                console.log(err.message);
            }
        }

        return item_option;
    }

    /**
     * Get options for TEXT type
     * @version 1.0.0
     */
    this.get_text_options = function(option, tableItem)
    {
        var item_option = {};

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Text');
        }

        // hide_field_name
        try {
            item_option.hide_field_name = option.item_json.hide_field_name;
        }
        catch(err) {
            console.log(err.message);
        }

        // min_length
        try {
            item_option.min_length = option.item_json.min_length;
        }
        catch(err) {
            console.log(err.message);
        }

        // max_length
        try {
            item_option.max_length = option.item_json.max_length;
        }
        catch(err) {
            try {
                item_option.max_length = tableItem.item_json.field_size;
            }
            catch(err) {
                console.log(err.message);
            }
        }

        // default_value
        try {
            item_option.default_value = option.item_json.default_value;
        }
        catch(err) {
            try {
                item_option.default_value = tableItem.item_json.default_value;
            }
            catch(err) {
                console.log(err.message);
            }
        }

        // number_lines
        try {
            item_option.number_lines = option.item_json.number_lines;
        }
        catch(err) {
            console.log(err.message);
        }

        // table item ID
        if (typeof (option.table_item_id) != 'undefined') {
            item_option.tableItem_id = option.table_item_id.toString();
        } else {
            try {
                item_option.tableItem_id = tableItem.id.toString();
            }
            catch(err) {
                console.log(err.message);
            }
        }

        return item_option;
    }

    /**
     * Get options for LIST OBJECT type
     * @version 1.0.0
     */
    this.get_list_object_options = function(option)
    {
        var item_option = {};


        try {
            item_option.height = option.item_json.height;
        }
        catch(err) {}

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('ListObject');
        }

        return item_option;
    }

    /**
     * Get options for LOOKUP type
     * @version 1.0.2
     */
    this.get_lookup_options = function(option)
    {
        var item_option = {};

        // hide_field_name
        try {
            item_option.hide_field_name = option.item_json.hide_field_name;
        }
        catch(err) {
            console.log(err.message);
        }

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Lookup');
        }

        // table item ID
        if (typeof (option.table_item_id) != 'undefined') {
            item_option.tableItem_id = option.table_item_id.toString();
        } else {
            try {
                item_option.tableItem_id = tableItem.id.toString();
            }
            catch(err) {
                console.log(err.message);
            }
        }

        return item_option;
    }

    /**
     * Get options for IFRAME type
     * @version 1.0.2
     */
    this.get_iframe_options = function(option)
    {
        var item_option = {};

        // set height
        try {
            item_option.height = option.item_json.height;
        }
        catch(err) {}

        // field_code
        try {
            item_option.field_code = option.item_json.field_code;
        }
        catch(err) {
            item_option.field_code = self.get_field_code('Iframe');
        }

        return item_option;
    }
}