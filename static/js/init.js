$(function() {
    $('.create-app, .card-panel-gird a').tooltip();
    $('.Sidebar, .main').addClass('transition');
    $(".sidebar-toggle").click(function () {
        $('body').toggleClass("closed-sidebar");
        saveSlidebarStatus();
    });

    $(document).on("click", ".Sidebar", function(e) {
        if (e.offsetX > $(this)[0].offsetWidth) {
            $('body').toggleClass("closed-sidebar");
        }
    });

    $("form").submit(function (e) {
        $(this).find("[type='submit']").attr("disabled", true);
        return true;
    });
});

/**
 * Save Slidebar status
 */
function saveSlidebarStatus() {
    var is_closed_sidebar = $('body').hasClass('closed-sidebar') ? 'closed-sidebar' : '';
    console.log(is_closed_sidebar);
    setCookie('closed-sidebar', is_closed_sidebar);
}

/**
 * Set cookie
 * @param string name 
 * @param string value 
 * @param int days 
 */
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

/**
 * Get cookie from string
 * @param string name
 * @version 1.0.0
 * @author Dong Nguyen
 */
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

/**
 * Call API via Ajax
 * @param object Ajax option
 * @version 1.0.0
 * @author Dong Nguyen
 */
function api(options) {
    var csrftoken = getCookie('csrftoken');

    options.beforeSend = function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }

    options.url = base_url + '/api/' + options.url;

    $.ajax(options);
}

/**
 * Check int number
 * @param {number} value
 * @version 1.0.0
 * @author Dong Nguyen
 */
function isIntNumber(value) {
    return value % 1 === 0;
}

/**
 * Check positive int number
 * @param {number} value
 * @version 1.0.0
 * @author Dong Nguyen
 */
function isPositiveIntNumber(value) {
    return isIntNumber(value) && parseInt(value, 10) > 0;
}

/**
 * format number
 * @version 1.0.0
 * @author Sanh Nguyen
 */
function number_format(number, decimals, decPoint, thousandsSep) {
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
    var n = !isFinite(+number) ? 0 : +number
    var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
    var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
    var dec = (typeof decPoint === 'undefined') ? '.' : decPoint
    var s = ''

    var toFixedFix = function (n, prec) {
        if (('' + n).indexOf('e') === -1) {
            return +(Math.round(n + 'e+' + prec) + 'e-' + prec)
        } else {
            var arr = ('' + n).split('e')
            var sig = ''
            if (+arr[1] + prec > 0) {
                sig = '+'
            }
            return (+(Math.round(+arr[0] + 'e' + sig + (+arr[1] + prec)) + 'e-' + prec)).toFixed(prec)
        }
    }

    // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec).toString() : '' + Math.round(n)).split('.')
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || ''
        s[1] += new Array(prec - s[1].length + 1).join('0')
    }

    return s.join(dec)
}