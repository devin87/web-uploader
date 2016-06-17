/// <reference path="Q.Uploader.js" />
/*
* Q.Uploader.slice.js 分片上传
* author:devin87@qq.com  
* update:2016/06/17 13:23
*/
(function (window, undefined) {
    "use strict";

    var Blob = window.Blob || window.WebkitBlob || window.MozBlob,
        BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder,
        blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,

        Uploader = Q.Uploader;

    Uploader.extend({
        //分片上传+断点续传
        _upload_slice: function (task) {
            var self = this,
                file = task.blob || task.file,
                size = file.size,
                chunkSize = self.chunkSize,
                start = task.sliceStart || 0,
                end;

            //分片上传
            var upload = function (blob, callback) {
                var xhr = new XMLHttpRequest(),
                    url = task.url,
                    completed = end == size;

                url += (url.indexOf("?") == -1 ? "?" : "&") + "action=upload&hash=" + task.hash + "&ok=" + (completed ? "1" : "0");

                xhr.upload.addEventListener("progress", function (e) {
                    self.progress(task, size, start + e.loaded);
                }, false);

                xhr.addEventListener("load", function (e) {
                    if (completed) self.complete(task, Uploader.COMPLETE, e.target.responseText);

                    callback();
                }, false);

                xhr.addEventListener("error", function () {
                    self.complete(task, UPLOAD_STATE_ERROR);
                }, false);

                var fd = new FormData;

                //上传完毕
                if (completed) {
                    //处理上传参数
                    self._process_params(task, function (k, v) {
                        fd.append(k, v);
                    });

                    fd.append("fileName", task.name);
                }

                fd.append(self.upName, blob, task.name);

                xhr.open("POST", url);

                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

                //上传完毕
                if (completed) {
                    self.fire("send", task, function (result) {
                        if (result === false) return self.complete(task, Uploader.SKIP);

                        xhr.send(fd);
                    });
                } else {
                    xhr.send(fd);
                }
            };

            //递归上传直至上传完毕
            var start_upload = function () {
                if (start >= size) {
                    return;
                }

                end = start + chunkSize;
                if (end > size) end = size;

                var chunk = blobSlice.call(file, start, end);

                upload(chunk, function () {
                    start = end;
                    start_upload();
                });
            };

            start_upload();
            self._afterSend(task);
        }
    });

})(window);