/// <reference path="Q.js" />
/// <reference path="Q.md5File.js" />
/*
* Q.Uploader.js 文件上传管理器 1.0
* https://github.com/devin87/web-uploader
* author:devin87@qq.com  
* update:2017/12/04 15:04
*/
(function (window, undefined) {
    "use strict";

    var def = Q.def,
        fire = Q.fire,
        extend = Q.extend,

        getFirst = Q.getFirst,
        getLast = Q.getLast,

        parseJSON = JSON.parse,

        createEle = Q.createEle,
        parseHTML = Q.parseHTML,

        setOpacity = Q.setOpacity,
        getOffset = Q.getOffset,

        md5File = Q.md5File,

        E = Q.event,
        addEvent = E.add,
        triggerEvent = E.trigger,
        stopEvent = E.stop;

    //Object.forEach
    //Date.now

    //-------------------------------- Uploader --------------------------------

    var support_html5_upload = false,        //是否支持html5(ajax)方式上传
        support_multiple_select = false,     //是否支持文件多选

        support_file_click_trigger = false,  //上传控件是否支持click触发文件选择 eg: input.click() => ie9及以下不支持

        UPLOADER_GUID = 0,                   //文件上传管理器唯一标示,多用于同一个页面存在多个管理器的情况

        UPLOAD_TASK_GUID = 0,                //上传任务唯一标示
        UPLOAD_HTML4_ZINDEX = 0;             //防止多个上传管理器的触发按钮位置重复引起的问题

    //上传状态
    var UPLOAD_STATE_READY = 0,              //任务已添加,准备上传
        UPLOAD_STATE_PROCESSING = 1,         //任务上传中
        UPLOAD_STATE_COMPLETE = 2,           //任务上传完成

        UPLOAD_STATE_SKIP = -1,              //任务已跳过(不会上传)
        UPLOAD_STATE_CANCEL = -2,            //任务已取消
        UPLOAD_STATE_ERROR = -3;             //任务已失败

    //获取上传状态说明
    function get_upload_status_text(state) {
        var LANG = Uploader.Lang;

        switch (state) {
            case UPLOAD_STATE_READY: return LANG.status_ready;
            case UPLOAD_STATE_PROCESSING: return LANG.status_processing;
            case UPLOAD_STATE_COMPLETE: return LANG.status_complete;

            case UPLOAD_STATE_SKIP: return LANG.status_skip;
            case UPLOAD_STATE_CANCEL: return LANG.status_cancel;
            case UPLOAD_STATE_ERROR: return LANG.status_error;
        }

        return state;
    }

    //上传探测
    function detect() {
        var XHR = window.XMLHttpRequest;
        if (XHR && new XHR().upload && window.FormData) support_html5_upload = true;

        var input = document.createElement("input");
        input.type = "file";

        support_multiple_select = !!input.files;
        support_file_click_trigger = support_html5_upload;
    }

    //截取字符串
    function get_last_find(str, find) {
        var index = str.lastIndexOf(find);
        return index != -1 ? str.slice(index) : "";
    }

    //将逗号分隔的字符串转为键值对
    function split_to_map(str) {
        if (!str) return;

        var list = str.split(","), map = {};

        for (var i = 0, len = list.length; i < len; i++) {
            map[list[i]] = true;
        }

        return map;
    }

    //iframe load 事件
    //注意：低版本 ie 支持 iframe 的 onload 事件,不过是隐形的(iframe.onload 方式绑定的将不会触发),需要通过 attachEvent 来注册
    function bind_iframe_load(iframe, fn) {
        if (iframe.attachEvent) iframe.attachEvent("onload", fn);
        else iframe.addEventListener("load", fn, false);
    }

    //计算上传速度
    function set_task_speed(task, total, loaded) {
        if (!total || total <= 0) return;

        var nowTime = Date.now(), tick;

        //上传完毕,计算平均速度(Byte/s)
        if (loaded >= total) {
            tick = nowTime - task.startTime;
            if (tick) task.avgSpeed = Math.min(Math.round(total * 1000 / tick), total);
            else if (!task.speed) task.avgSpeed = task.speed = total;

            task.time = tick || 0;
            task.endTime = nowTime;
            return;
        }

        //即时速度(Byte/s)
        tick = nowTime - task.lastTime;
        if (tick < 200) return;

        task.speed = Math.min(Math.round((loaded - task.loaded) * 1000 / tick), task.total);
        task.lastTime = nowTime;
    }

    /*
        文件上传管理器,调用示例
        new Uploader({
            //--------------- 必填 ---------------
            url: "",            //上传路径
            target: element,    //上传按钮，可为数组
            view: element,      //上传任务视图(需加载UI接口默认实现)

            //--------------- 可选 ---------------
            html5: true,       //是否启用html5上传,若浏览器不支持,则自动禁用
            multiple: true,    //选择文件时是否允许多选,若浏览器不支持,则自动禁用(仅html5模式有效)

            clickTrigger:true, //是否启用click触发文件选择 eg: input.click() => ie9及以下不支持

            auto: true,        //添加任务后是否立即上传

            data: {},          //上传文件的同时可以指定其它参数,该参数将以POST的方式提交到服务器

            workerThread: 1,   //同时允许上传的任务数(仅html5模式有效)

            upName: "upfile",  //上传参数名称,若后台需要根据name来获取上传数据,可配置此项

            allows: "",        //允许上传的文件类型(扩展名),多个之间用逗号隔开
            disallows: "",     //禁止上传的文件类型(扩展名)

            maxSize: 2*1024*1024,   //允许上传的最大文件大小,字节,为0表示不限(仅对支持的浏览器生效,eg: IE10+、Firefox、Chrome)

            isSlice: false,               //是否启用分片上传，若为true，则isQueryState和isMd5默认为true
            chunkSize: 2 * 1024 * 1024,   //默认分片大小为2MB
            isQueryState:false,           //是否查询文件状态（for 秒传或续传）
            isMd5: false,                 //是否计算上传文件md5值
            isUploadAfterHash:true,       //是否在Hash计算完毕后再上传

            container:element, //一般无需指定
            getPos:function,   //一般无需指定

            //上传回调事件(function)
            on: {
                init,          //上传管理器初始化完毕后触发
    
                select,        //点击上传按钮准备选择上传文件之前触发,返回false可禁止选择文件
                add[Async],    //添加任务之前触发,返回false将跳过该任务
                upload[Async], //上传任务之前触发,返回false将跳过该任务
                send[Async],   //发送数据之前触发,返回false将跳过该任务
    
                cancel,        //取消上传任务后触发
                remove,        //移除上传任务后触发
    
                progress,      //上传进度发生变化后触发(仅html5模式有效)
                complete       //上传完成后触发
            },

            //UI接口(function),若指定了以下方法,将忽略默认实现
            UI:{
                init,       //执行初始化操作
                draw,       //添加任务后绘制任务界面
                update,     //更新任务界面  
                over        //任务上传完成
            }
        });
    */
    function Uploader(ops) {
        var self = this;

        //---------------- settings ----------------

        self.guid = ops.guid || "uploader" + (++UPLOADER_GUID);

        self.url = ops.url;                      //上传路径
        self.dataType = ops.dataType || "json";  //返回值类型
        self.data = ops.data;                    //上传参数

        self.targets = ops.target || [];
        if (!self.targets.forEach) self.targets = [self.targets];

        self.target = self.targets[0];          //当前上传按钮

        //是否以html5(ajax)方式上传
        self.html5 = support_html5_upload && !!def(ops.html5, true);

        //是否允许多选(仅在启用了html5的情形下生效)
        //在html4模式下,input是一个整体,若启用多选,将无法针对单一的文件进行操作(eg:根据扩展名筛选、取消、删除操作等)
        //若无需对文件进行操作,可通过 uploader.multiple = true 强制启用多选(不推荐)
        self.multiple = support_multiple_select && self.html5 && !!def(ops.multiple, true);

        //是否启用click触发文件选择 eg: input.click() => ie9及以下不支持
        self.clickTrigger = support_file_click_trigger && !!def(ops.clickTrigger, true);

        //允许同时上传的数量(html5有效)
        //由于设计原因,html4仅能同时上传1个任务,请不要更改
        self.workerThread = self.html5 ? ops.workerThread || 1 : 1;
        self.workerIdle = self.workerThread;

        self.auto = ops.auto !== false;                 //是否在添加任务后自动开始

        self.upName = ops.upName || "upfile";           //上传参数名

        self.allows = split_to_map(ops.allows);         //允许上传的文件类型（扩展名）,多个之间用逗号隔开 eg:.jpg,.png
        self.disallows = split_to_map(ops.disallows);   //禁止上传的文件类型（扩展名）,多个之间用逗号隔开
        self.maxSize = +ops.maxSize || 0;

        self.chunkSize = ops.chunkSize || 2 * 1024 * 1024;            //分片上传大小
        self.isSlice = !!ops.isSlice;                                 //是否启用分片上传
        self.isQueryState = !!def(ops.isQueryState, self.isSlice);    //是否查询文件状态（for 秒传或续传）
        self.isMd5 = !!def(ops.isMd5, self.isSlice);                  //是否计算上传文件md5值
        self.isUploadAfterHash = ops.isUploadAfterHash !== false;     //是否在Hash计算完毕后再上传

        //ie9及以下不支持click触发(即使能弹出文件选择框,也无法获取文件数据,报拒绝访问错误)
        //若上传按钮位置不确定(比如在滚动区域内),则无法触发文件选择
        //设置原则:getPos需返回上传按钮距container的坐标
        self.container = ops.container || document.body;
        //函数,获取上传按钮距container的坐标,返回格式 eg:{ left: 100, top: 100 }
        if (ops.getPos) self.getPos = ops.getPos;

        //UI接口,此处将覆盖 prototype 实现
        var UI = ops.UI || {};
        if (UI.init) self.init = UI.init;             //执行初始化操作
        if (UI.draw) self.draw = UI.draw;             //添加任务后绘制任务界面
        if (UI.update) self.update = UI.update;       //更新任务界面  
        if (UI.over) self.over = UI.over;             //任务上传完成

        //上传回调事件
        self.fns = ops.on || {};

        //上传选项
        self.ops = ops;

        //---------------- init ----------------

        self.list = [];
        self.map = {};

        self.index = 0;
        self.started = false;

        self._init();
    }

    Uploader.prototype = {
        //修复constructor指向
        constructor: Uploader,

        //初始化上传管理器
        _init: function () {
            var self = this;

            if (self._inited) return;
            self._inited = true;

            var guid = self.guid,
                container = self.container;

            var boxInput = createEle("div", "upload-input " + guid);
            container.appendChild(boxInput);

            self.boxInput = boxInput;

            //构造html4上传所需的iframe和form
            if (!self.html5) {
                var iframe_name = "upload_iframe_" + guid;

                var html =
                    '<iframe class="u-iframe" name="' + iframe_name + '"></iframe>' +
                    '<form class="u-form" action="" method="post" enctype="multipart/form-data" target="' + iframe_name + '"></form>';

                var boxHtml4 = createEle("div", "upload-html4 " + guid, html);
                container.appendChild(boxHtml4);

                var iframe = getFirst(boxHtml4),
                    form = getLast(boxHtml4);

                self.iframe = iframe;
                self.form = form;

                //html4上传完成回调
                bind_iframe_load(iframe, function () {
                    if (self.workerIdle != 0) return;

                    var text;
                    try {
                        text = iframe.contentWindow.document.body.innerHTML;
                    } catch (e) { }

                    self.complete(undefined, UPLOAD_STATE_COMPLETE, text);
                });
            }

            self.targets.forEach(function (target) {
                if (self.clickTrigger) {
                    addEvent(target, "click", function (e) {
                        if (self.fire("select", e) === false) return;

                        self.resetInput();

                        //注意:ie9及以下可以弹出文件选择框,但获取不到选择数据,拒绝访问。
                        triggerEvent(self.inputFile, "click");
                    });
                } else {
                    addEvent(target, "mouseover", function (e) {
                        self.target = this;
                        self.updatePos();
                    });
                }
            });

            //html4点击事件
            if (!self.clickTrigger) {
                addEvent(boxInput, "click", function (e) {
                    if (self.fire("select", e) === false) stopEvent(e);
                });

                setOpacity(boxInput, 0);

                self.resetInput();
            }

            self.fire("init");

            return self.run("init");
        },

        //重置上传控件
        resetInput: function () {
            var self = this,

                boxInput = self.boxInput;

            boxInput.innerHTML = '<input type="file" name="' + self.upName + '" style="' + (self.clickTrigger ? 'visibility: hidden;' : 'font-size:100px;') + '"' + (self.multiple ? ' multiple="multiple"' : '') + '>';

            var inputFile = getFirst(boxInput);

            //文件选择事件
            addEvent(inputFile, "change", function (e) {
                self.add(this);

                //html4 重置上传控件
                if (!self.html5) self.resetInput();
            });

            self.inputFile = inputFile;

            return self.updatePos();
        },
        //更新上传按钮坐标(for ie)
        updatePos: function (has_more_uploader) {
            var self = this;
            if (self.clickTrigger) return self;

            var getPos = self.getPos || getOffset,

                boxInput = self.boxInput,
                inputFile = getFirst(boxInput),
                target = self.target,

                inputWidth = target.offsetWidth,
                inputHeight = target.offsetHeight,

                pos = inputWidth == 0 ? { left: -10000, top: -10000 } : getPos(target);

            boxInput.style.width = inputFile.style.width = inputWidth + "px";
            boxInput.style.height = inputFile.style.height = inputHeight + "px";

            boxInput.style.left = pos.left + "px";
            boxInput.style.top = pos.top + "px";

            //多用于选项卡切换中上传按钮位置重复的情况
            if (has_more_uploader) boxInput.style.zIndex = ++UPLOAD_HTML4_ZINDEX;

            return self;
        },
        //触发ops上定义的回调方法,优先触发异步回调(以Async结尾)
        fire: function (action, arg, callback) {
            if (!callback) return fire(this.fns[action], this, arg);

            var asyncFun = this.fns[action + "Async"];
            if (asyncFun) return fire(asyncFun, this, arg, callback);

            callback(fire(this.fns[action], this, arg));
        },

        //运行内部方法或扩展方法(如果存在)
        run: function (action, arg) {
            var fn = this[action];
            if (fn) fire(fn, this, arg);
            return this;
        },

        //添加一个上传任务
        addTask: function (input, file) {
            if (!input && !file) return;

            var name, size;

            if (file) {
                name = file.name || file.fileName;
                size = file.size || file.fileSize;
            } else {
                name = get_last_find(input.value, "\\").slice(1) || input.value;
                size = -1;
            }

            var self = this,
                ext = get_last_find(name, ".").toLowerCase(),
                limit_type;

            if ((self.disallows && self.disallows[ext]) || (self.allows && !self.allows[ext])) limit_type = "ext";
            else if (size != -1 && self.maxSize && size > self.maxSize) limit_type = "size";

            var task = {
                id: ++UPLOAD_TASK_GUID,

                name: name,
                ext: ext,
                size: size,

                input: input,
                file: file,

                state: limit_type ? UPLOAD_STATE_SKIP : UPLOAD_STATE_READY
            };

            if (limit_type) {
                task.limited = limit_type;
                task.disabled = true;
            }

            self.fire("add", task, function (result) {
                if (result === false || task.disabled || task.limited) return;

                task.index = self.list.length;
                self.list.push(task);
                self.map[task.id] = task;

                self.run("draw", task);

                if (self.auto) self.start();
            });

            return task;
        },

        //添加上传任务,自动判断input(是否多选)或file
        add: function (input_or_file) {
            var self = this;

            if (input_or_file.tagName == "INPUT") {
                var files = input_or_file.files;
                if (files) {
                    for (var i = 0, len = files.length; i < len; i++) {
                        self.addTask(input_or_file, files[i]);
                    }
                } else {
                    self.addTask(input_or_file);
                }
            } else {
                self.addTask(undefined, input_or_file);
            }
        },

        //批量添加上传任务
        addList: function (list) {
            for (var i = 0, len = list.length; i < len; i++) {
                this.add(list[i]);
            }
        },

        //获取指定任务
        get: function (taskId) {
            if (taskId != undefined) return this.map[taskId];
        },

        //取消上传任务
        //onlyCancel: 若为true,则仅取消上传而不触发任务完成事件
        cancel: function (taskId, onlyCancel) {
            var self = this,
                task = self.get(taskId);

            if (!task) return;

            var state = task.state;

            //若任务已完成,直接返回
            if (state != UPLOAD_STATE_READY && state != UPLOAD_STATE_PROCESSING) return self;

            if (state == UPLOAD_STATE_PROCESSING) {
                //html5
                var xhr = task.xhr;
                if (xhr) {
                    xhr.abort();

                    //无需调用complete,html5 有自己的处理,此处直接返回
                    return self;
                }

                //html4
                self.iframe.contentWindow.location = "about:blank";
            }

            return onlyCancel ? self : self.complete(task, UPLOAD_STATE_CANCEL);
        },

        //移除任务
        remove: function (taskId) {
            var task = this.get(taskId);
            if (!task) return;

            if (task.state == UPLOAD_STATE_PROCESSING) this.cancel(taskId);

            //this.list.splice(task.index, 1);
            //this.map[task.id] = undefined;

            //从数组中移除任务时,由于任务是根据index获取,若不处理index,将导致上传错乱甚至不能上传
            //此处重置上传索引,上传时会自动修正为正确的索引(程序会跳过已处理过的任务)
            //this.index = 0;

            //添加移除标记(用户可以自行操作,更灵活)
            task.deleted = true;

            this.fire("remove", task);
        },

        //开始上传
        start: function () {
            var self = this,

                workerIdle = self.workerIdle,

                list = self.list,
                index = self.index,

                count = list.length;

            if (!self.started) self.started = true;

            if (count <= 0 || index >= count || workerIdle <= 0) return self;

            var task = list[index];
            self.index++;

            return self.upload(task);
        },

        //上传任务
        upload: function (task) {
            var self = this;

            if (!task || task.state != UPLOAD_STATE_READY || task.skip) return self.start();

            task.url = self.url;
            self.workerIdle--;

            self.fire("upload", task, function (result) {
                if (result === false) return self.complete(task, UPLOAD_STATE_SKIP);

                if (self.html5 && task.file) self._upload_html5_ready(task);
                else if (task.input) self._upload_html4(task);
                else self.complete(task, UPLOAD_STATE_SKIP);
            });

            return self;
        },

        //根据 task.hash 查询任务状态（for 秒传或续传）
        queryState: function (task, callback) {
            var self = this,
                url = self.url,
                xhr = new XMLHttpRequest();

            task.queryUrl = url + (url.indexOf("?") == -1 ? "?" : "&") + "action=query&hash=" + (task.hash || encodeURIComponent(task.name)) + "&fileName=" + encodeURIComponent(task.name);

            //秒传查询事件
            self.fire("sliceQuery", task);

            xhr.open("GET", task.queryUrl);
            //xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return;

                var responseText, json;

                if (xhr.status >= 200 && xhr.status < 400) {
                    responseText = xhr.responseText;

                    if (responseText === "ok") json = { ret: 1 };
                    else if (responseText) json = parseJSON(responseText);

                    if (!json || typeof json == "number") json = { ret: 0, start: json };

                    task.response = responseText;
                    task.json = json;

                    if (json.ret == 1) {
                        task.queryOK = true;
                        self.cancel(task.id, true).complete(task, UPLOAD_STATE_COMPLETE);
                    } else {
                        var start = +json.start || 0;
                        if (start != Math.floor(start)) start = 0;

                        task.sliceStart = start;
                    }
                }

                fire(callback, self, xhr);
            };

            xhr.onerror = function () {
                fire(callback, self, xhr);
            };

            xhr.send(null);

            return self;
        },

        //处理html5上传（包括秒传和断点续传）
        _upload_html5_ready: function (task) {
            var self = this;

            //上传处理
            var goto_upload = function () {
                if (task.state == UPLOAD_STATE_COMPLETE) return;

                if (self.isSlice) self._upload_slice(task);
                else self._upload_html5(task);
            };

            var after_hash = function (callback) {
                //自定义hash事件
                self.fire("hash", task, function () {
                    if (task.hash && self.isQueryState && task.state != UPLOAD_STATE_COMPLETE) self.queryState(task, callback);
                    else callback();
                });
            };

            //计算文件hash
            var compute_hash = function (callback) {
                //计算上传文件md5值
                if (self.isMd5 && md5File) {
                    var hashProgress = self.fns.hashProgress;

                    md5File(task.file, function (md5, time) {
                        task.hash = md5;
                        task.timeHash = time;
                        after_hash(callback);
                    }, function (pvg) {
                        fire(hashProgress, self, task, pvg);
                    });
                } else {
                    after_hash(callback);
                }
            };

            if (self.isUploadAfterHash) {
                compute_hash(goto_upload);
            } else {
                goto_upload();
                compute_hash();
            }

            return self;
        },

        //处理上传参数
        _process_params: function (task, fn) {
            if (this.data) Object.forEach(this.data, fn);
            if (task.data) Object.forEach(task.data, fn);
        },

        //以html5的方式上传任务
        _upload_html5: function (task) {
            var self = this,
                xhr = new XMLHttpRequest();

            task.xhr = xhr;

            xhr.upload.addEventListener("progress", function (e) {
                self.progress(task, e.total, e.loaded);
            }, false);

            xhr.addEventListener("load", function (e) {
                self.complete(task, UPLOAD_STATE_COMPLETE, e.target.responseText);
            }, false);

            xhr.addEventListener("error", function () {
                self.complete(task, UPLOAD_STATE_ERROR);
            }, false);

            xhr.addEventListener("abort", function () {
                self.complete(task, UPLOAD_STATE_CANCEL);
            }, false);

            var fd = new FormData;

            //处理上传参数
            self._process_params(task, function (k, v) {
                fd.append(k, v);
            });

            fd.append("fileName", task.name);
            fd.append(self.upName, task.blob || task.file, task.name);

            xhr.open("POST", task.url);

            //移除自定义标头,以防止跨域上传被拦截
            //xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

            self.fire("send", task, function (result) {
                if (result === false) return self.complete(task, UPLOAD_STATE_SKIP);

                xhr.send(fd);

                self._afterSend(task);
            });
        },

        //以传统方式上传任务
        _upload_html4: function (task) {
            var self = this,
                form = self.form,
                input = task.input;

            //解决多选的情况下重复上传的问题(即使如此，仍然不建议html4模式下开启多选)
            if (input._uploaded) return self.complete(task, UPLOAD_STATE_COMPLETE);
            input._uploaded = true;

            input.name = self.upName;

            form.innerHTML = "";
            form.appendChild(input);

            form.action = task.url;

            //处理上传参数
            self._process_params(task, function (k, v) {
                form.appendChild(parseHTML('<input type="hidden" name="' + k + '" value="' + v + '">'));
            });

            self.fire("send", task, function (result) {
                if (result === false) return self.complete(task, UPLOAD_STATE_SKIP);

                form.submit();

                self._afterSend(task);
            });
        },

        //已开始发送数据
        _afterSend: function (task) {
            task.lastTime = task.startTime = Date.now();

            task.state = UPLOAD_STATE_PROCESSING;
            this._lastTask = task;

            this.progress(task);
        },

        //更新进度显示
        progress: function (task, total, loaded) {
            if (!total) total = task.size;
            if (!loaded || loaded < 0) loaded = 0;

            var state = task.state || UPLOAD_STATE_READY;

            if (loaded > total) loaded = total;
            if (loaded > 0 && state == UPLOAD_STATE_READY) task.state = state = UPLOAD_STATE_PROCESSING;

            var completed = state == UPLOAD_STATE_COMPLETE;
            if (completed) total = loaded = task.size;

            //计算上传速度
            set_task_speed(task, total, loaded);

            task.total = total;
            task.loaded = loaded;

            this.fire("progress", task);
            this.run("update", task);
        },

        //处理响应数据
        _process_response: function (task, responseText) {
            task.response = responseText;
            if (!responseText) return;

            if (this.dataType == "json") task.json = parseJSON(responseText);
        },

        //完成上传
        complete: function (task, state, responseText) {
            var self = this;

            if (!task && self.workerThread == 1) task = self._lastTask;

            if (task) {
                if (state != undefined) task.state = state;

                if (task.state == UPLOAD_STATE_PROCESSING || state == UPLOAD_STATE_COMPLETE) {
                    task.state = UPLOAD_STATE_COMPLETE;
                    self.progress(task, task.size, task.size);
                }

                if (responseText !== undefined) self._process_response(task, responseText);
            }

            self.run("update", task).run("over", task);

            if (state == UPLOAD_STATE_CANCEL) self.fire("cancel", task);
            self.fire("complete", task);

            self.workerIdle++;
            if (self.started) self.start();

            return self;
        }
    };

    //扩展上传管理器
    //forced:是否强制覆盖
    Uploader.extend = function (source, forced) {
        extend(Uploader.prototype, source, forced);
    };

    //---------------------- export ----------------------
    detect();

    extend(Uploader, {
        support: {
            html5: support_html5_upload,
            multiple: support_multiple_select
        },

        READY: UPLOAD_STATE_READY,
        PROCESSING: UPLOAD_STATE_PROCESSING,
        COMPLETE: UPLOAD_STATE_COMPLETE,

        SKIP: UPLOAD_STATE_SKIP,
        CANCEL: UPLOAD_STATE_CANCEL,
        ERROR: UPLOAD_STATE_ERROR,

        //UI对象,用于多套UI共存
        UI: {},

        //默认语言
        Lang: {
            status_ready: "准备中",
            status_processing: "上传中",
            status_complete: "已完成",
            status_skip: "已跳过",
            status_cancel: "已取消",
            status_error: "已失败"
        },

        getStatusText: get_upload_status_text
    });

    Q.Uploader = Uploader;

})(window);