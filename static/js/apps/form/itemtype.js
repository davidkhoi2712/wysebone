const INITIALEVENT = 1;
const UPDATEEVENT = 2;
const CLICKEVENT = 3;
const LABEL = parseInt($('#item_types_label').val(), 10);
const TEXT = parseInt($('#item_types_text').val(), 10);
const CHECKBOX = parseInt($('#item_types_checkbox').val(), 10);
const NUMBER = parseInt($('#item_types_number').val(), 10);
const SELECTION = parseInt($('#item_types_selection').val(), 10);
const DATE = parseInt($('#item_types_date').val(), 10);
const BUTTON = parseInt($('#item_types_button').val(), 10);
const LIST_OBJECT = parseInt($('#item_types_list_object').val(), 10);
const LOOKUP = parseInt($('#item_types_lookup').val(), 10);
const IFRAME = parseInt($('#item_types_iframe').val(), 10);
const RECORD_SEARCH = parseInt($('#event_record_seach').val(), 10);
const DISPLAY_CONTENT = parseInt($('#event_display_content').val(), 10);
const ACTION_ON_OTHER_OBJECTS = parseInt($('#event_action_on_other_objects').val(), 10);
const RECORD_REGISTER = parseInt($('#event_record_register').val(), 10);
const DELETE_RECORD = parseInt($('#event_delete_record').val(), 10);
const SCREEN_TRANSITION = parseInt($('#event_screen_transition').val(), 10);
const SET_OUTPUT = parseInt($('#event_set_output').val(), 10);
const SUM = parseInt($('#event_sum').val(), 10);
const MULTIPLICATION = parseInt($('#event_multiplication').val(), 10);
const RESET = parseInt($('#event_reset').val(), 10);
const SCREEN_DISPLAY = parseInt($('#event_screen_display').val(), 10);

function ItemType() {
    var self = this;

    /**
     * Filter item type from id
     * @version 1.0.0
     */
    this.filter = function(itemtype_id) {
        var i = 0;
        for (i = 0; i < itemTypes.length; i++) {
            if (itemTypes[i].id == itemtype_id) {
                return itemTypes[i];
            }
        }

        return null;
    }
}