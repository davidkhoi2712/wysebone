const TEXT     = 1;
const NUMBER   = 6;
const DATE     = 4;
const CHECKBOX = 2;

$(function () {
    $('.item-list .item-container').each(function(idx, item){
        bindEvent($(item));
    });

    $('#add-item').click(function(){
        addItem();
    });

    toggleDeleteButton();
});

function bindEvent($item) {
    $item.find('.button-collapse').click(function () {
        $(this).closest('.item-container').find('.collapse').collapse('hide');
        $(this).hide().siblings().show();
        return false;
    });
    $item.find('.button-expanse').click(function () {
        $(this).closest('.item-edit').find('.collapse').collapse('show');
        $(this).hide().siblings().show();
        return false;
    });
    $item.find('.item-edit .del').click(function(){
        $(this).closest('.item-container').remove();
        toggleDeleteButton();
    });

    $item.find('select.item-type').on('change', function() {
        changeItemType($(this));
        toggleDeleteButton();
    });

    $item.find('.datepicker').datetimepicker({
        "showTodayButton": true,
        "format": "L",
        "locale": lang_code,
        "timeZone": timezone,
        "useStrict": true,
        'useCurrent': false,
        extraFormats: ['MM/DD/YYYY', 'YYYY/MM/DD', 'DD/MM/YYYY']
    });
}

function toggleDeleteButton(){
    var $items = $('.item-list .item-container')
    if($items.length === 1) {
        $items.find('.item-edit .del').hide();
    } else {
        $items.find('.item-edit .del').show();
    }
}

function uniqueId() {
    return Math.random().toString(36).substr(2, 16);
};

function addPrefix(prefix, $item) {
    $item.find('input').each(function(idx, input){
        $(input).attr('name', prefix + $(input).attr('name'));
    });
    $item.find('select').each(function(idx, input){
        $(input).attr('name', prefix + $(input).attr('name'));
    });
}

function addItem(){
    var prefix = 'item_new_' + uniqueId() + '-';
    var $template = $('#js_item_text').children().clone();
    addPrefix(prefix, $template)
    bindEvent($template);
    $('.item-list').append($template);
    toggleDeleteButton();
}

function changeItemType($this) {

    var prefix = $this.attr('name').split('-')[0] + '-';
    var item_type = parseInt($this.val(), 10);

    var oldElement = $this.closest('.item-container');
    var itemName = oldElement.find('input[name="'+prefix+'item_name"]').val();
    var required = oldElement.find('input[name="'+prefix+'required"]').is(":checked");

    var $template = '';
    switch(item_type) {
        case TEXT:
            $template = $('#js_item_text').children().clone();
            break;
        case NUMBER:
            $template = $('#js_item_numeric').children().clone();
            break;
        case DATE:
            $template = $('#js_item_date').children().clone();
            break;
        case CHECKBOX:
            $template = $('#js_item_yes_no').children().clone();
            break;
        default:
            // do nothing
    }

    //keep old data
    $template.find('input[name="item_name"]').val(itemName);
    $template.find('input[name="required"]').prop('checked', required);

    addPrefix(prefix, $template);

    //expanse item
    $template.find('.item-detail').addClass('show');
    $template.find('.item-footer .button-collapse').show();
    $template.find('.item-footer .button-expanse').hide();
    
    bindEvent($template);

    oldElement.replaceWith($template);
}
