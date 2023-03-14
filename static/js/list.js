$(function () {
    $('#inlineFormSubmit').click(function(){
        var name = document.getElementById("inlineFormInputName").value;
        name = name.trim()
        var object = document.getElementById('object_target').value
        var object_url = base_url + '/'+object+'/'
        url_redirect = object_url
        if (name) {
            url_redirect = object_url+'?name='+name;
        }
        //Check per_page_exist
        var perpage_param = new RegExp('[\\?&]' + 'per_page' + '=([^&#]*)').exec(window.location.href);
        if (perpage_param && perpage_param[1]) {
            const url = window.location.search
            const urlParams = new URLSearchParams(url);
            const per_page = urlParams.get('per_page')
            if (name) {
                url_redirect = url_redirect+'&per_page='+per_page;
            } else {
                url_redirect = url_redirect+'?per_page='+per_page;
            }
        }
        location.href  = url_redirect;
        return false;
    });

    $('#inlineFormCustomSelect').change(function(){
        var object_per_page=$(this).val();
        var object = document.getElementById('object_target').value
        var object_url = base_url + '/'+object+'/'
        object_url_select = object_url+'?per_page='+object_per_page;
        var name_param = new RegExp('[\\?&]' + 'name' + '=([^&#]*)').exec(window.location.href);
        //Check name exist
        if (name_param && name_param[1]) {
            const url = window.location.search
            const urlParams = new URLSearchParams(url);
            const name = urlParams.get('name')
            object_url_select = object_url+'?name='+name+'&per_page='+object_per_page;
        } 
        location.href  = object_url_select;
    });
});