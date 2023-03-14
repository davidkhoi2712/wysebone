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

function clearImage(obj) {
    var img_default = base_url + '/static/images/avatar.png';
    $('#avatar').attr('src', img_default);
    $('#avatar_img').val('delete');
    $(obj).hide();
}

(function($) {
    'use strict';

    $.fn.select2.defaults.set("theme", "bootstrap4");
    $.fn.select2.defaults.set("language", lang_code);

    $(function() {

        $('#language').val(lang_code);

        var select = $('#User_time_zone');
        var browserTimeZone = select.data('val');
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
            width: '100%',
            data: data
        });

        $('#department').select2({
            width: '100%'
        });

        $('.datepicker').datetimepicker({
            "showTodayButton": true,
            "format": "L",
            "locale": lang_code,
            "timeZone": timezone,
            "useStrict": true,
            'useCurrent': false
        })

        var avatar = document.getElementById('avatar');
        var image = document.getElementById('image');
        var input = document.getElementById('input');
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
                    width: 200,
                    height: 200,
                });

                canvas = getRoundedCanvas(croppedCanvas);

                initialAvatarURL = avatar.src;
                avatar.src = canvas.toDataURL("image/png");
                $('#avatar_img').val(avatar.src);
                $('#remove_avatar').show();
            }
        });
    });

})(jQuery);