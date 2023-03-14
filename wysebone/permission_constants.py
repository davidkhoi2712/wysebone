from wysebone import constants

admin_permissions = [
    'wysebone.view_company_info',
    'wysebone.add_user', 'wysebone.change_user', 'wysebone.delete_user', 'wysebone.view_user',
    'wysebone.add_department', 'wysebone.change_department', 'wysebone.delete_department', 'wysebone.view_department',
]
developer_permissions = [
    'wysebone.add_user', 'wysebone.change_user', 'wysebone.delete_user', 'wysebone.view_user',
    'wysebone.add_department', 'wysebone.change_department', 'wysebone.delete_department', 'wysebone.view_department',
    'auth.add_group', 'auth.change_group', 'auth.delete_group', 'auth.view_group',
    'wysebone.add_tableinfo', 'wysebone.change_tableinfo', 'wysebone.delete_tableinfo', 'wysebone.view_tableinfo',
    'wysebone.add_authority', 'wysebone.change_authority', 'wysebone.delete_authority', 'wysebone.view_authority',
    'wysebone.add_app', 'wysebone.change_app', 'wysebone.delete_app', 'wysebone.view_app', 'wysebone.approve_app',
    'wysebone.add_list_table', 'wysebone.change_list_table', 'wysebone.delete_list_table', 'wysebone.view_list_table',
]
tester_permissions = [
    'wysebone.use_app',
]
operation_permissions = [
    'wysebone.add_user', 'wysebone.change_user', 'wysebone.delete_user', 'wysebone.view_user',
    'wysebone.add_department', 'wysebone.change_department', 'wysebone.delete_department', 'wysebone.view_department',
]
general_permissions = [
    'wysebone.use_app',
]

permissions_roles = {
    constants.CUSTOMER_ADMIN_ROLE:     admin_permissions,
    constants.CUSTOMER_DEVELOPER_ROLE: developer_permissions,
    constants.CUSTOMER_TESTER_ROLE:    tester_permissions,
    constants.CUSTOMER_OPERATION_ROLE: operation_permissions,
    constants.CUSTOMER_GENERAL_ROLE:   general_permissions,
}
