function get_ListUser(uuid) {
    $.ajax({
        type: 'GET',
        url: base_url + '/api/group/' + uuid + '/users',
        dataType: 'json',
        success: function(data) {
            $('#display-users').removeClass('d-none');
            var tr = '';
            if (data.users.length == 0) {
                $('#alert_empty_users').removeClass('d-none');
                $('#user-list').addClass('d-none');
            } else {
                $('#alert_empty_users').addClass('d-none');
                $('#user-list').removeClass('d-none');
                $.each(data.users, function(index, value) {
                    var action_url = base_url + '/user/' + value.user_id;
                    let role = '';
                    $.each(value.role_name, function(i, v) {
                        role += v + '<br>';
                    });

                    var string = '<tr>' +
                        '<td label="' + gettext('Display Name') + '">' + value.first_name + ' ' + value.last_name + '</td>' +
                        '<td label="' + gettext('Email') + '">' + value.email + '</td>' +
                        '<td width="120" label="' + gettext('Role') + '">' + role + '</td>' +
                        '<td label="' + gettext('Status') + '" class="text-center">' +
                        ((value.is_active) ? '<span class="badge badge-primary badge-pill">' + gettext('Active') + '</span>' : '<span class="badge badge-danger badge-pill">' + gettext('Inactive') + '</span>') +
                        '<td width="60" label="' + gettext('Action') + '" class="text-right">' +
                        ((value.is_admin) ? '' : '<a  title="' + gettext('Change user') + '" href="' + action_url + '/change?next=/group/"><i class="fa fa-edit"></i></a>') +
                        ((value.is_admin) ? '' : ' <a class="text-danger" title="' + gettext('Delete user') + '" href="' + action_url + '/delete?next=/group/"><i class="fa fa-trash"></i></a></td>');
                    tr += string;
                });
            }

            $('#user-list > tbody').html(tr);
        },
        error: function(request, status, error) {
            $('#alert_empty_users').removeClass('d-none');
            $('#user-list').addClass('d-none');
            alert(request.responseJSON.message);
        }
    });
}

function tree_node() {
    // Set active for group
    var id_group = localStorage.getItem('group');
    var li = $('.list-group > .list-group-item');
    for (let i = 0; i < li.length; i++) {
        if (li.eq(i).find('a').data('uuid') == id_group) {
            li.eq(i).addClass('list-group-item-light');
            get_ListUser(id_group);
        }
    }

    // Event click changed group
    $('.list-group > .list-group-item > a').on('click', function() {
        $('.index-group .list-group-item').removeClass('list-group-item-light');
        parent_li = $(this).parent().addClass('list-group-item-light');

        var uuid = $(this).data('uuid');
        get_ListUser(uuid);
        localStorage.setItem('group', uuid);
    });
}

$(function() {
    tree_node();
});