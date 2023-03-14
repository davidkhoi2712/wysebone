$(function () {
    
    $('.wb-entry-container').height($('.wb-entry-container').height() + $(".app-item:last").height());

    $(document).on('keydown', '[tabindex]', function (e) {
        if (e.keyCode === 9 || (e.keyCode == 13 && !e.shiftKey) ) {
            e.preventDefault();

            var nextElement = $('[tabindex="' + (this.tabIndex + 1) + '"]');

            if (nextElement.length)
                nextElement.focus()
            else
                $('[tabindex="1"]').focus();
        }
    });

    $('.User-datepicker').datetimepicker({
        "showTodayButton": true,
        "format": "L",
        "locale": lang_code,
        "timeZone": timezone,
        "useStrict": true,
        'useCurrent': false,
        extraFormats: ['MM/DD/YYYY', 'YYYY/MM/DD', 'DD/MM/YYYY'],
        tooltips: {
            today: gettext('Today'),
            clear: gettext('Clear selection')
        },
        keyBinds: {
            enter: function () {
                this.hide();
                
                var nextElement = $('[tabindex="' + ($('.User-datepicker')[0].tabIndex + 1) + '"]');

                if (nextElement.length)
                    nextElement.focus()
                else
                    $('[tabindex="1"]').focus();
            }
        }

    });

    var events = JSON.parse(document.getElementById('event-data').textContent);

    $.each(events, function (index, item) {
        $("#" + index).on('change', function () {
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
                    if (response.data) {
                        $.each(response.data, function (index, item) {
                            $("[name='"+index+"']").val(item).trigger('change');
                        })
                    }
                },
                error: function(response, status, error) {
                    
                }
            });
        })
    })
    
});