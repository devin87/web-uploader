/// <reference path="Q.Uploader.js" />
/*
* Q.Uploader.slice.js 分片上传
* author:devin87@qq.com  
* update:2020/08/25 18:25
*/
(function (window, undefined) {
    "use strict";

    var Uploader = Q.Uploader;
    if (!Uploader.support.html5) return;

    var blobSlice = window.File ? File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice : undefined;

    Uploader.extend({
        //分片上传+断点续传
        _upload_slice: function (task) {
            var self = this,
                file = task.blob || task.file,
                size = file.size,
                chunkSize = self.chunkSize,
                start = task.sliceStart || 0,
                retryCount = self.sliceRetryCount,
                end;

            //分片上传
            var upload = function (blob, callback, c) {
                c = +c || 0;

                var xhr = new XMLHttpRequest(),
                    url = task.url,
                    completed = end == size;

                task.xhr = xhr;

                url += (url.indexOf("?") == -1 ? "?" : "&") + "action=upload&hash=" + (task.hash || task.name) + "&ok=" + (completed ? "1" : "0");

                xhr.upload.addEventListener("progress", function (e) {
                    self.progress(task, size, start + e.loaded);
                }, false);

                xhr.addEventListener("load", function (e) {
                    var responseText = e.target.responseText;
                    if (completed) return self.complete(task, Uploader.COMPLETE, responseText);

                    //分片上传成功继续上传
                    if (responseText == 1 || responseText == '"1"') return callback();

                    //服务器返回失败
                    self.complete(task, Uploader.ERROR, responseText);
                }, false);

                //分片上传失败
                xhr.addEventListener("error", function () {
                    if (++c > retryCount) return self.complete(task, Uploader.ERROR);

                    //重新上传
                    upload(blob, callback, c);
                }, false);

                var fd = new FormData;

                //处理上传参数
                self._process_params(task, function (k, v) {
                    fd.append(k, v);
                });

                fd.append("fileName", task.name);
                if (task.size != -1) fd.append("fileSize", task.size);
                fd.append(self.upName, blob, task.name);
                fd.append("sliceCount", task.sliceCount);
                fd.append("sliceIndex", task.sliceIndex);

                xhr.open("POST", url);
                self._process_xhr_headers(xhr);

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

            //分片总数
            task.sliceCount = Math.ceil(size / chunkSize);

            //递归上传直至上传完毕
            var start_upload = function () {
                if (start >= size) {
                    return;
                }

                end = start + chunkSize;
                if (end > size) end = size;

                task.sliceStart = start;
                task.sliceEnd = end;
                task.sliceIndex = Math.ceil(end / chunkSize);
                task.sliceBlob = blobSlice.call(file, start, end);

                //分片上传事件，分片上传之前触发，返回false将跳过该分片
                self.fire("sliceUpload", task, function (result) {
                    if (result === false) return next_upload();

                    upload(task.sliceBlob, next_upload);
                });
            };

            //上传下一个分片
            var next_upload = function () {
                start = end;
                start_upload();
            };

            start_upload();
            self._afterSend(task);
        }
    });

})(window);