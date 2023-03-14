var department = null;
$(function () {
    var search = gettext('Search')+'...'
    $('#modal-department .modal-body').append('<iframe id="iframe-add" src="" width="100%" height="550" frameborder="0" allowtransparency="true"></iframe>');
    $('.User-datepicker').datetimepicker({
        "showTodayButton": true,
        format: 'L',
        "locale": lang_code,
        "useStrict": true,
        // 'useCurrent': false
    }).on('dp.change', function(e) {
        if ($(this).val() == '') {
            $(e.target).nextAll('input').val('')
        } else {
            $(e.target).nextAll('input').val(e.date.format('YYYY-MM-DD'))
        }
    });

    // Change status
    $('#status').on('change', function() {
        if ($(this).is(':checked')) {
            $(this).next().text(gettext('Active'));
        } else {
            $(this).next().text(gettext('Inactive'));
        }
    });

    // Set timezone
    var select = $('#User_time_zone');
    var browserTimeZone = (select.data('val') ? select.data('val') : moment.tz.guess());
    var timeZones = moment.tz.names();
    var data = [];
    timeZones.forEach((timeZone) => {
        var option = {};
        option.text = `${timeZone} (GMT${moment.tz(timeZone).format('Z')})`;
        option.id = timeZone;

        if (timeZone == browserTimeZone) {
            option.selected = true;
        }
        data.push(option);
    });

    select.select2({
        theme: "bootstrap4",
        width: '100%',
        data: data
    });


    // Change image
    var avatar = document.getElementById('avatar');
    var image = document.getElementById('image');
    var input = document.getElementById('user_avatar');
    var $modal = $('#modal-profile-crop');
    var $cropActionsBtn = $modal.find("[data-method]");
    var cropper = null,
        croppedCanvas = null;
    input.addEventListener('change', function(e) {
        var files = e.target.files;
        var done = function(url) {
            input.value = '';
            image.src = url;
            $modal.modal('show');
        };
        var reader;
        var file;

        if (files && files.length > 0) {
            file = files[0];

            var pattern = /image-*/;
            if (!file.type.match(pattern)) {
                alert(interpolate(gettext('The file format of "%s" is not supported.', file.name), [file.name]));
                return;
            }


            if (file.size > 3145728) {
                alert(gettext('The maximum file size is 3MB. Please try again.'));
                return;
            }

            if (URL) {
                done(URL.createObjectURL(file));
            } else if (FileReader) {
                reader = new FileReader();
                reader.onload = function(e) {
                    done(reader.result);
                };
                reader.readAsDataURL(file);
            }
        }
    });
    $cropActionsBtn.on("click", function(e) {
        var i;
        if (i = $(this).data(), i.method) return cropper[i.method](i.option)
    })

    $modal.on('shown.bs.modal', function() {
        cropper = new Cropper(image, {
            viewMode: 1,
            center: !1,
            aspectRatio: 1 / 1,
            modal: !0,
            scalable: !1,
            rotatable: !0,
            checkOrientation: !0,
            zoomable: !0,
            dragMode: "move",
            guides: !1,
            zoomOnTouch: !1,
            zoomOnWheel: !1,
            cropBoxMovable: !1,
            cropBoxResizable: !1,
            toggleDragModeOnDblclick: !1,
            autoCropArea: 1,
            ready: function() {
                var e = this.cropper.getContainerData(),
                    a = this.cropper.getCropBoxData();


                this.cropper.setCropBoxData({
                    width: a.width,
                    height: a.height,
                    left: (e.width - a.width) / 2,
                    top: (e.height - a.height) / 2
                })
            }
        });

    }).on('hidden.bs.modal', function() {
        cropper.destroy();
        cropper = null;
    });

    document.getElementById('crop').addEventListener('click', function() {
        var initialAvatarURL;
        var canvas;
        $modal.modal('hide');
        if (cropper) {
            croppedCanvas = cropper.getCroppedCanvas({
                width: 300,
                height: 300,
            });

            canvas = getRoundedCanvas(croppedCanvas);
            initialAvatarURL = avatar.src;
            avatar.src = canvas.toDataURL("image/png");
            $('#upload_avatar').val(avatar.src);
            $('#remove_avatar').show();
        }
    });

    $('#roles').select2({
        theme: 'bootstrap4',
        width: 'style',
        placeholder: $('#roles').attr('placeholder'),
        allowClear: Boolean($('#roles').data('allow-clear'))
    });

    // Multiselect Department
    $('#department').each(function() {
        $(this).select2({
            theme: 'bootstrap4',
            width: 'style',
            placeholder: $(this).attr('placeholder'),
            allowClear: Boolean($(this).data('allow-clear'))
        });
    });

    // Multiselect
    $('#permissions').multiselect({
        sort: false,
        search: {
            left: '\
                    <i class="fa fa-search icon"  aria-hidden="true"></i> \
                    <input type="text" name="q" class="input-field form-control form-control-sm float-right card-header" \
                    placeholder='+search+' /> \
               ',
            right: '\
                <i class="fa fa-search icon"  aria-hidden="true"></i> \
                <input type="text" name="q" class="input-field form-control form-control-sm float-right card-header" \
                placeholder='+search+' />  \
            ',
        },
        fireSearch: function(value) {
            return value.length > 2;
        }
    });
    $('#groups').multiselect({
        sort: false,
        search: {
            left: '\
                    <i class="fa fa-search icon"  aria-hidden="true"></i> \
                    <input type="text" name="q" class="input-field form-control form-control-sm float-right card-header" \
                    placeholder='+search+' /> \
               ',
            right: '\
                <i class="fa fa-search icon"  aria-hidden="true"></i> \
                <input type="text" name="q" class="input-field form-control form-control-sm float-right card-header" \
                placeholder='+search+' />  \
            ',
        },
        fireSearch: function(value) {
            return value.length > 2;
        } 
    });


    // Generate password
    $('#generate').on('click', function() {
        let length = Math.floor(Math.random() * (10 - 8 + 1)) + 8;
        let password = randomPassword(length);
        $('#password1').val(password);
        $('#password2').val(password);
    });

    // Show hidden password
    $('.view-password').on('click', function() {
        let i = $(this).find('i');
        if (i.hasClass('fa fa-eye')) {
            i.removeClass('fa fa-eye');
            i.addClass('fa fa-eye-slash');
            $('#password1').attr('type', 'text');
            $('#password2').attr('type', 'text');
        } else {
            i.removeClass('fa fa-eye-slash');
            i.addClass('fa fa-eye');
            $('#password1').attr('type', 'password');
            $('#password2').attr('type', 'password');
        }
    });

    $('#add-department').on('click', function () {
        $('#modal-department .modal-body iframe').attr('src', $(this).data('href'));
    });

    $("#iframe-add").load(function() {
        $("#iframe-add").contents().on("click", "#department_cancel", function() {
            closeModal();
        });
    });

    $('#modal-department').on('hidden.bs.modal', function(e) {
        if (department) {
            let option = '<option value="' + department.code + '" selected>' + department.name + '</option>';
            $('#department').append(option);
            department = null;
        }
    });
});

function closeModal() {
    $('#modal-department').modal('hide');
}

// Clear image
function clearImage(obj) {
    var img_default = base_url + '/static/images/avatar.png';
    $('#avatar').attr('src', img_default);
    $('#upload_avatar').val('delete');
    $(obj).hide();
};


function getRoundedCanvas(sourceCanvas) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var width = sourceCanvas.width;
    var height = sourceCanvas.height;
    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingEnabled = true;
    context.drawImage(sourceCanvas, 0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.beginPath();
    context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);
    context.fill();
    return canvas;
}

// Generate password
function randomPassword(length) {
    var chars = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+<>ABCDEFGHIJKLMNOP1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
    }
    return pass;
}