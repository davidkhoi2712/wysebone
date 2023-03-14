$(function () {
    $('.datepicker').datetimepicker({
        "showTodayButton": true,
        "format": "L",
        "locale": lang_code
    }).on('dp.change', function (e) { 
        $(e.target).nextAll('input').val(e.date.format('YYYY-MM-DD'))
     })
});