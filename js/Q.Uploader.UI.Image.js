/// <reference path="Q.Uploader.js" />
/*
* Q.Uploader.Image.js 图片上传管理器界面
* author:devin87@qq.com  
* update:2017/08/14 15:28
*/
(function (window, undefined) {
    "use strict";

    var getFirst = Q.getFirst,
        //getLast = Q.getLast,
        getNext = Q.getNext,

        createEle = Q.createEle,
        //formatSize = Q.formatSize,
        setOpacity = Q.setOpacity,

        browser_ie = Q.ie,

        Uploader = Q.Uploader;

    //追加css样式名
    function addClass(ele, className) {
        ele.className += " " + className;
    }

    //设置元素内容
    function setHtml(ele, html) {
        if (ele) ele.innerHTML = html || "";
    }

    //生成图片预览地址(html5)
    function readAsURL(file, callback) {
        var URL = window.URL || window.webkitURL;
        if (URL) return callback(URL.createObjectURL(file));

        if (window.FileReader) {
            var fr = new FileReader();
            fr.onload = function (e) {
                callback(e.target.result);
            };
            fr.readAsDataURL(file);
        } else if (file.readAsDataURL) {
            callback(file.readAsDataURL());
        }
    }

    //图片预览
    function previewImage(box, task, callback) {
        var input = task.input,
            file = task.file || (input.files ? input.files[0] : undefined);

        if (file) {
            //IE10+、Webkit、Firefox etc
            readAsURL(file, function (src) {
                if (src) box.innerHTML = '<img src="' + src + '" />';

                callback && callback(src);
            });
        } else if (input) {
            var src = input.value;

            if (!src || /^\w:\\fakepath/.test(src)) {
                input.select();
                //解决ie报拒绝访问的问题
                parent.document.body.focus();
                //获取图片真实地址
                if (document.selection) src = document.selection.createRange().text;
            }

            if (src) {
                box.innerHTML = '<img src="' + src + '" />';

                try {
                    if (browser_ie > 6) box.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod='scale',src='" + src + "')";
                } catch (e) { }
            }

            callback && callback(src);
        }
    }

    var Blob = window.Blob || window.WebkitBlob || window.MozBlob,
        BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder;

    //是否支持图片缩放
    var support_image_scale = (function () {
        if (!window.FileReader || !window.atob || !(Blob || BlobBuilder)) return false;

        var canvas = document.createElement("canvas");
        return !!canvas.getContext && !!canvas.getContext("2d");
    })();

    //获取mimetype
    function get_image_mimetype(ext) {
        var type = ext.slice(1);
        return "image/" + (type == "jpg" ? "jpeg" : type);
    }

    //将dataURL转为Blob对象，以用于ajax上传
    function dataURLtoBlob(base64, mimetype) {
        var ds = base64.split(','),
            data = atob(ds[1]),

            arr = [];

        for (var i = 0, len = data.length; i < len; i++) {
            arr[i] = data.charCodeAt(i);
        }

        if (Blob) return new Blob([new Uint8Array(arr)], { type: mimetype });

        var builder = new BlobBuilder();
        builder.append(arr);
        return builder.getBlob(mimetype);
    }

    //图片缩放
    function scaleImage(src, mimetype, ops, callback) {
        var image = new Image();
        image.src = src;

        image.onload = function () {
            var width = image.width,
                height = image.height,

                maxWidth = ops.maxWidth,
                maxHeight = ops.maxHeight,

                hasWidthScale = maxWidth && width > maxWidth,
                hasHeightScale = maxHeight && height > maxHeight,

                hasScale = hasWidthScale || hasHeightScale;

            //无需压缩
            if (!hasScale) return callback && callback(false);

            //根据宽度缩放
            if (hasWidthScale) {
                width = maxWidth;
                height = Math.floor(image.height * width / image.width);
            }

            //根据高度缩放
            if (hasHeightScale) {
                height = maxHeight;
                width = Math.floor(image.width * height / image.height);
            }

            var canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d");

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(image, 0, 0, width, height);

            callback && callback(canvas.toDataURL(mimetype), mimetype);
        };
    }

    //默认图片格式
    var DEF_IMAGE_TYPES = ".jpg,.png,.gif,.bmp,.webp,.tif,.tiff",
        //默认缩放的图片类型
        DEF_IMAGE_SCALE_TYPES = ".jpg";

    //是否支持图片缩放
    Uploader.support.imageScale = support_image_scale;

    Uploader.previewImage = previewImage;
    Uploader.scaleImage = scaleImage;

    //图片上传UI
    Uploader.UI.Image = {
        //初始化
        init: function () {
            var ops = this.ops,
                boxView = ops.view;

            if (!ops.allows) ops.allows = DEF_IMAGE_TYPES;

            if (boxView) addClass(boxView, "ui-image " + (this.html5 ? "html5" : "html4"));
        },

        //是否支持图片压缩
        supportScale: function (type) {
            if (!support_image_scale) return false;

            if (type == ".jpeg") type = ".jpg";

            var types = (this.ops.scale || {}).types || DEF_IMAGE_SCALE_TYPES,
                isImage = DEF_IMAGE_TYPES.indexOf(type) != -1;

            if (!isImage) return false;

            return types == "*" || types.indexOf(type) != -1;
        },

        //预览并压缩图片
        previewImage: function (boxImage, task, ops) {
            var self = this,
                scale_data = task.scale || ops.scale,
                support_scale = scale_data && self.supportScale(task.ext);

            if (support_scale) task.skip = true;

            previewImage(boxImage, task, function (src) {
                self.fire("preview", { task: task, src: src });

                if (!src || !support_scale) return;

                scaleImage(src, get_image_mimetype(task.ext), scale_data, function (base64, mimetype) {
                    if (base64) {
                        var blob = dataURLtoBlob(base64, mimetype);
                        task.blob = blob;

                        self.fire("scale", { task: task, base64: base64, type: mimetype, blob: blob });
                    }

                    task.skip = false;
                    self.list.push(task);

                    if (self.auto) self.start();
                });
            });

            return self;
        },

        //绘制任务UI
        draw: function (task) {
            var self = this,
                ops = self.ops,
                boxView = ops.view;

            if (!boxView) return;

            var name = task.name;

            var html =
                '<div class="u-img"></div>' +
                '<div class="u-progress-bar">' +
                    '<div class="u-progress"></div>' +
                '</div>' +
                '<div class="u-detail"></div>' +
                '<div class="u-name" title="' + name + '">' + name + '</div>';

            var taskId = task.id,
                box = createEle("div", "u-item", html);

            box.taskId = taskId;

            var boxImage = getFirst(box),
                boxProgressbar = getNext(boxImage),
                boxProgress = getFirst(boxProgressbar),
                boxDetail = getNext(boxProgressbar);

            setOpacity(boxProgressbar, 0.3);
            setOpacity(boxProgress, 0.5);

            task.box = box;
            task.boxProgress = boxProgress;
            task.boxDetail = boxDetail;

            //添加到视图中
            boxView.appendChild(box);

            //---------------- 预览图片并更新UI ----------------
            self.previewImage(boxImage, task, ops).update(task);
        },

        //更新任务界面
        update: function (task) {
            if (!task || !task.box) return;

            var self = this,

                total = task.total || task.size,
                loaded = task.loaded,

                state = task.state,

                boxProgress = task.boxProgress,
                boxDetail = task.boxDetail,

                html_detail = Uploader.getStatusText(state);

            if (self.html5 && loaded != undefined && loaded >= 0) {
                var percentText;

                if (state == Uploader.PROCESSING) {
                    var percent = Math.min(loaded * 100 / total, 100);

                    percentText = percent.toFixed(1);
                    if (percentText == "100.0") percentText = "99.9";

                } else if (state == Uploader.COMPLETE) {
                    percentText = "100";
                }

                //进度百分比
                if (percentText) {
                    percentText += "%";
                    html_detail += " " + percentText;

                    boxProgress.style.width = percentText;
                }
            }

            setHtml(boxDetail, html_detail);
        },

        //上传完毕
        over: function (task) {
            if (!task || !task.box) return;

            addClass(task.box, "u-over");
        }
    };

    //实现默认的UI接口
    Uploader.extend(Uploader.UI.Image);

})(window);