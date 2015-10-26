/// <reference path="Q.Uploader.js" />
/*
* Q.Uploader.UI.js 上传管理器界面
* author:devin87@qq.com  
* update:2015/10/16 11:30
*/
(function (window, undefined) {
    "use strict";

    var def = Q.def,

        getFirst = Q.getFirst,
        getLast = Q.getLast,
        getNext = Q.getNext,

        createEle = Q.createEle,
        formatSize = Q.formatSize,

        E = Q.event,
        addEvent = E.add,

        Uploader = Q.Uploader;

    //追加css样式名
    function addClass(ele, className) {
        ele.className += " " + className;
    }

    //设置元素内容
    function setHtml(ele, html) {
        if (ele) ele.innerHTML = html || "";
    }

    //实现默认的UI接口
    Uploader.extend({
        init: function () {
            var boxView = this.ops.view;
            if (!boxView) return;

            addClass(boxView, this.html5 ? "html5" : "html4");
        },

        //绘制任务UI
        draw: function (task) {
            var self = this,
                ops = self.ops,
                boxView = ops.view;

            if (!boxView) return;

            var ops_button = ops.button || {},

                text_button_cancel = def(ops_button.cancel, "取消"),
                text_button_remove = def(ops_button.remove, "删除"),

                name = task.name;

            var html =
                '<div class="fl">' +
                    '<div class="u-name" title="' + name + '">' + name + '</div>' +
                '</div>' +
                '<div class="fr">' +
                    '<div class="u-size"></div>' +
                    '<div class="u-speed">--/s</div>' +
                    '<div class="u-progress-bar">' +
                        '<div class="u-progress" style="width:1%;"></div>' +
                    '</div>' +
                    '<div class="u-detail">0%</div>' +
                    '<div class="u-state"></div>' +
                    '<div class="u-op">' +
                        '<a class="u-op-cancel">' + text_button_cancel + '</a>' +
                        '<a class="u-op-remove">' + text_button_remove + '</a>' +
                    '</div>' +
                '</div>' +
                '<div class="clear"></div>';

            var taskId = task.id,
                box = createEle("div", "u-item", html);

            box.taskId = taskId;

            task.box = box;

            //添加到视图中
            boxView.appendChild(box);

            //---------------- 事件绑定 ----------------
            var boxButton = getLast(box.childNodes[1]),
                buttonCancel = getFirst(boxButton),
                buttonRemove = getLast(boxButton);

            //取消上传任务
            addEvent(buttonCancel, "click", function () {
                self.cancel(taskId);
            });

            //移除上传任务
            addEvent(buttonRemove, "click", function () {
                self.remove(taskId);

                boxView.removeChild(box);
            });

            //---------------- 更新UI ----------------
            self.update(task);
        },

        //更新任务界面
        update: function (task) {
            if (!task || !task.box) return;

            var total = task.total || task.size,
                loaded = task.loaded,

                state = task.state;

            var box = task.box,
                boxInfo = box.childNodes[1],
                boxSize = getFirst(boxInfo),
                boxSpeed = getNext(boxSize),
                boxProgressbar = getNext(boxSpeed),
                boxProgress = getFirst(boxProgressbar),
                boxDetail = getNext(boxProgressbar),
                boxState = getNext(boxDetail);

            //更新任务状态
            setHtml(boxState, Uploader.getStatusText(state));

            if (total < 0) return;

            var html_size = '';

            //更新上传进度(for html5)
            if (this.html5 && loaded != undefined && loaded >= 0) {
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

                    boxProgress.style.width = percentText;
                    setHtml(boxDetail, percentText);
                }

                //已上传的文件大小
                html_size = '<span class="u-loaded">' + formatSize(loaded) + '</span> / ';

                //上传速度;
                var speed = task.avgSpeed || task.speed;
                setHtml(boxSpeed, formatSize(speed) + "/s");
            }

            //文件总大小
            html_size += '<span class="u-total">' + formatSize(total) + '</span>';

            setHtml(boxSize, html_size);
        },

        //上传完毕
        over: function (task) {
            if (!task || !task.box) return;

            addClass(task.box, "u-over");
        }
    });

})(window);