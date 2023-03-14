function ChooseIcon() {
    this.color_selected = $('#app_color').val();
    this.icon_selected = $('#app_icon').val();
    var self = this;

    /**
     * Select color for icon
     */
    this.select_color_event = function() {
        $('.colors li > a').on('click', function() {
            self.color_selected = $(this).data('color');
            self.active_icon();
        });
    }

    /**
     * Select icon
     */
    this.select_icon_event = function() {
        $('.icons li > a').on('click', function() {
            self.icon_selected = $(this).data('icon');
            self.active_icon();
        });
    }

    /**
     * Button Choose
     */
    this.button_choose = function() {
        $('#choose_icon_choose').on('click', function() {
            var object = $('#choose_icon');
            object.attr('data-icon', self.icon_selected);
            object.attr('data-color', self.color_selected);
            $('#chooseIconModal').modal('hide');
            if (typeof is_edited === "undefined") {
                return;
            } else {
                is_edited = true;
            }
        });
    }

    /**
     * Button Cancel
     */
    this.button_cancel = function() {
        $('#chooseIconModal').on('hidden.bs.modal', function(e) {
            var object = $('#choose_icon');
            self.icon_selected = object.attr('data-icon');
            self.color_selected = object.attr('data-color');
            self.active_icon();
        });
    }

    /**
     * Actived icon selected
     */
    this.active_icon = function() {
        $('.colors li a').removeClass('active');
        $(".colors li a[data-color='" + self.color_selected + "']").addClass('active');

        $('.icons li a').removeClass('active');
        $('.icons li a').css('background-color', 'transparent');
        $(".icons li a[data-icon='" + self.icon_selected + "']").addClass('active').css('background-color', self.color_selected);

        $('#app_icon').val(self.icon_selected);
        $('#app_color').val(self.color_selected);

        $('.app-icon-lg').css('background-color', self.color_selected);
        $('.app-icon-lg').html('<i class="' + self.icon_selected + '" aria-hidden="true"></i>');
    }

    this.init = function() {
        if (self.color_selected == '') {
            self.color_selected = '#b97a56';
        }

        if (self.icon_selected == '') {
            self.icon_selected = 'fa fa-list-alt';
        }

        self.select_color_event();
        self.select_icon_event();
        self.active_icon();
        self.button_choose();
        self.button_cancel();
    }

    this.init();
}

jQuery(document).ready(function($) {
    new ChooseIcon();
});