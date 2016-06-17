/// <reference path="Q.js" />
/// <reference path="spark-md5.js" />
/*
* Q.Uploader.md5.js 计算文件md5值
* author:devin87@qq.com  
* update:2016/06/17 13:00
*/
(function (window, undefined) {
    "use strict";

    if (!window.SparkMD5 || !window.File) return;

    var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
        spark = new SparkMD5.ArrayBuffer(),
        chunkSize = 2 * 1024 * 1024;

    //计算文件md5值
    //file:文件对象 eg: input.files[0]
    //callback:回调函数 eg: callback(md5,time)
    //progress:进度函数
    function computeMd5(file, callback, progress) {
        var size = file.size,
            chunks = Math.ceil(size / chunkSize),
            currentChunk = 0,
            fr = new FileReader(),
            startTime = Date.now();

        spark.reset();

        fr.onload = function (e) {
            spark.append(e.target.result);
            currentChunk++;
            progress && progress(currentChunk / chunks);

            if (currentChunk < chunks) {
                loadNext();
            } else {
                callback && callback(spark.end(), Date.now() - startTime);
            }
        };

        fr.onerror = callback;

        function loadNext() {
            var start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= size) ? size : start + chunkSize;

            fr.readAsArrayBuffer(blobSlice.call(file, start, end));
        }

        loadNext();
    }


    Q.md5File = computeMd5;

})(window);