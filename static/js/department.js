$(function() {
    $('#parent').each(function() {
        $(this).select2({
            theme: 'bootstrap4',
            width: '100%',
            placeholder: $(this).attr('placeholder'),
            allowClear: Boolean($(this).data('allow-clear'))
        });
    });

    tree_node();
});

function tree_node() {
    $('.treenode > .treenode-contents').on('click', function() {
        $('.treenode .treenode-contents').removeClass('active');

        var parentNode = $(this).parent().eq(0);

        if (parentNode.hasClass('treenode-expand')) {
            parentNode.find('.treenode-children').first().toggle();

            if (parentNode.find('.treenode-icon').first().hasClass('active')) {
                parentNode.find('.treenode-icon').first().removeClass('active');
            } else {
                parentNode.find('.treenode-icon').first().addClass('active');
            }

            var icon = parentNode.find('.treenode-icon svg').first();
            if (icon.hasClass('fa-caret-right')) {
                icon.removeClass('fa-caret-right');
                icon.addClass('fa-caret-down');
                $(this).addClass('active');
            } else if (icon.hasClass('fa-caret-down')) {
                icon.removeClass('fa-caret-down');
                icon.addClass('fa-caret-right');
            }
        } else {
            $(this).addClass('active');
        }

        var id = $(this).data('id');

        get_ListUser(id);
    });
}

function get_ListUser(id) {
    $.ajax({
        type: 'GET',
        url: base_url + '/api/department/' + id + '/users',
        dataType: 'json',
        success: function(data, text) {
            if (data.users.length == 0) {
                $('#listTable-member').addClass('d-none');
                $('#alert_empty_users').removeClass('d-none');
            } else {
                $('#alert_empty_users').addClass('d-none');
                $('#listTable-member').removeClass('d-none');
                var tr = '';
                $.each(data.users, function(index, value) {
                    var action_url = base_url + '/user/' + value.user_id;
                    var string = '<tr>' +
                        '<td label="' + gettext('Display Name') + '">' + value.first_name + ' ' + value.last_name + '</td>' +
                        '<td label="' + gettext('Email') + '">' + value.email + '</td>' +
                        '<td label="' + gettext('Role') + '">' + value.role_name + '</td>' +
                        '<td label="' + gettext('Status') + '" class="text-center">' +
                        ((value.is_active) ? '<span class="status-active">' + gettext('Active') + '</span>' : '<span class="status-inactive">' + gettext('Inactive') + '</span>') +
                        '<td label="' + gettext('Action') + '" class="text-right"><a  title="' + gettext('Change user') + '" href="' + action_url + '/change' + '"><i class="fa fa-edit"></i></a>' +
                        ' <a class="text-danger" title="' + gettext('Delete user') + '" href="' + action_url + '/delete' + '"><i class="fa fa-trash"></i></a></td>';
                    tr += string;
                });
                $('#listTable-member > tbody').html(tr);
            }
        },
        error: function(request, status, error) {
            alert(request.responseJSON.message);
        }
    });
}