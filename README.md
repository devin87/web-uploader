web-uploader
============

js (html5 + html4) 文件上传管理器，支持上传进度显示，支持秒传+分片上传+断点续传，支持图片预览+缩放，支持 IE6+、Firefox、Chrome等。

[博客园详细介绍](http://www.cnblogs.com/devin87/p/web-uploader.html)

[图片上传介绍](http://www.cnblogs.com/devin87/p/web-uploader-image.html)

### 特点：
<ul>
    <li>轻量级，不依赖任何JS库，核心代码（Q.Uploader.js）仅约700行，min版本加起来不到12KB</li>
    <li>纯JS代码，无需Flash，无需更改后台代码即可实现带进度条（IE10+、其它标准浏览器）的上传，其它（eg：IE6+）自动降级为传统方式上传</li>
    <li>单独的图片上传UI，支持图片预览（IE6+、其它浏览器）和缩放（IE10+、其它浏览器）</li>
    <li>支持秒传+分片上传+断点续传（IE10+、其它标准浏览器），适应多种上传环境（默认基于md5，不限于浏览器和使用场景，只要文件相同即可；也可自行实现hash计算）</li>
    <li>上传文件的同时可以指定上传参数，支持上传类型过滤</li>
    <li>完善的事件回调，可针对上传的每个过程进行单独处理</li>
    <li>上传核心与UI界面分离，方便的UI接口，可以很方便的定制上传界面包括上传按钮</li>
</ul>

### 演示环境（其它语言可自行实现服务端接收和网站部署）
演示前请在根目录下创建upload文件夹，以保存上传文件<br>
执行程序：api/upload.ashx
```
asp.net 4.0+
iis
```

Node.js 演示见[web-uploader-node](https://github.com/devin87/web-uploader-node)

### 简单调用示例
例：一般文件上传，使用默认的UI
```
1. 导入样式文件(若自己实现UI接口，则无需导入默认的样式文件)
<link href="css/uploader.css" rel="stylesheet" type="text/css" />

2. 导入js文件（可自行合并，若自己实现UI接口，则无需导入 Q.Uploader.UI.File.js 文件）
<script type="text/javascript" src="js/Q.js"></script>
<script type="text/javascript" src="js/Q.Uploader.js"></script>
<script type="text/javascript" src="js/Q.Uploader.UI.File.js"></script>

或
<script type="text/javascript" src="Q.Uploader.file.all.js"></script>

3. 调用
new Q.Uploader({
    url:"api/upload.ashx",

    target: element,    //上传按钮,可为数组 eg:[element1,element2]
    view: element       //上传任务视图(若自己实现UI接口，则无需指定此参数)
});
```

例：图片上传+预览+缩放
```
1. 导入样式文件(若自己实现UI接口，则无需导入默认的样式文件)
<link href="css/uploader-image.css" rel="stylesheet" type="text/css" />

2. 导入js文件（可自行合并）
<script type="text/javascript" src="js/Q.js"></script>
<script type="text/javascript" src="js/Q.Uploader.js"></script>
<script type="text/javascript" src="js/Q.Uploader.UI.Image.js"></script>

或
<script type="text/javascript" src="Q.Uploader.image.all.js"></script>

3. 调用
new Q.Uploader({
    url:"api/upload.ashx",

    target: element,    //上传按钮,可为数组 eg:[element1,element2]
    view: element,      //上传任务视图(若自己实现UI接口，则无需指定此参数)

    allows: ".jpg,.png,.gif,.bmp",

    //图片缩放
    scale: {
        //要缩放的图片格式
        types: ".jpg",
        //最大图片宽度（maxWidth）或高度（maxHeight）
        maxWidth: 1024
    }
});
```

### 完整调用示例
```javascript
new Q.Uploader({
    //--------------- 必填 ---------------
    url: "",            //上传路径
    target: element,    //上传按钮,可为数组 eg:[element1,element2]
    view: element,      //上传任务视图(若自己实现UI接口，则无需指定此参数)

    //--------------- 可选 ---------------
    html5: true,       //是否启用html5上传,若浏览器不支持,则自动禁用
    multiple: true,    //选择文件时是否允许多选,若浏览器不支持,则自动禁用(仅html5模式有效)

    clickTrigger:true, //是否启用click触发文件选择 eg: input.click()  =>  IE9及以下不支持

    auto: true,        //添加任务后是否立即上传

    data: {},          //上传文件的同时可以指定其它参数,该参数将以POST的方式提交到服务器

    dataType: "json",  //服务器返回值类型

    workerThread: 1,   //同时允许上传的任务数(仅html5模式有效)

    upName: "upfile",  //上传参数名称,若后台需要根据name来获取上传数据,可配置此项
    accept: "",        //指定浏览器接受的文件类型 eg:image/*,video/*  =>  IE9及以下不支持
    isDir: false,      //是否是文件夹上传（仅Webkit内核浏览器和新版火狐有效）

    allows: "",        //允许上传的文件类型(扩展名),多个之间用逗号隔开
    disallows: "",     //禁止上传的文件类型(扩展名)

    maxSize: 0,        //允许上传的最大文件大小,字节,为0表示不限(仅对支持的浏览器生效,eg: IE10+、Firefox、Chrome)

    //秒传+分片上传+断点续传,具体见示例（demo/slice.html）
    isSlice: false,               //是否启用分片上传，若为true，则isQueryState和isMd5默认为true
    chunkSize: 2 * 1024 * 1024,   //默认分片大小为2MB
    //查询路径为： url?action=query&hash=file hash
    isQueryState:false,           //是否查询文件状态（for 秒传或续传）
    isMd5: false,                 //是否计算上传文件md5值
    isUploadAfterHash:true,       //是否在Hash计算完毕后再上传
    sliceRetryCount:2,            //分片上传失败重试次数

    container:document.body,      //一般无需指定
    getPos: function(){ },        //一般无需指定

    //上传回调事件(function)
    on: {
        init: function(){ },              //上传管理器初始化完毕后触发
    
        select: function(task){ },        //点击上传按钮准备选择上传文件之前触发,返回false可禁止选择文件
        add: function(task){ },           //添加任务之前触发,返回false将跳过该任务
        upload: function(task){ },        //上传任务之前触发,返回false将跳过该任务
        hashProgress: function(task){ },  //文件hash进度（仅isMd5为true时有效）
        hash: function(task){ },          //查询状态之前触发（for 秒传或续传）
        sliceQuery: function(task){ },    //秒传查询之前触发
        sliceUpload: function(task){ },   //分片上传之前触发，返回false将跳过该分片
        send: function(task){ },          //发送数据之前触发,返回false将跳过该任务
    
        cancel: function(task){ },        //取消上传任务后触发
        remove: function(task){ },        //移除上传任务后触发
    
        progress: function(task){ },      //上传进度发生变化后触发(仅html5模式有效)
        complete: function(task){ }       //上传完成后触发
    },

    //UI接口(function),若指定了以下方法,将忽略默认实现
    UI:{
        init: function(){ },           //执行初始化操作
        draw: function(task){ },       //添加任务后绘制任务界面
        update: function(task){ },     //更新任务界面  
        over: function(){ }            //任务上传完成
    }
});
```

task属性说明
```
task = {
    id,         //任务编号

    name,       //上传文件名（包括扩展名）
    ext,        //上传文件扩展名
    size,       //上传文件大小（单位：Byte，若获取不到大小，则值为-1）

    input,      //上传控件
    file,       //上传数据（仅 html5）

    state,      //上传状态

    limited,    //若存在值，表示禁止上传的文件类型
    skip,       //若为true，表示要跳过的任务

    //分片上传
    sliceCount, //分片总数
    sliceIndex, //当前分片数
    sliceStart, //当前分片上传的起始点
    sliceEnd,   //当前分片上传的结束点
    sliceBlob,  //当前分片数据

    //上传后会有如下属性（由于浏览器支持问题，以下部分属性可能不存在）
    xhr,        //XMLHttpRequest对象（仅 html5）

    total,      //总上传大小（单位：Byte）
    loaded,     //已上传大小（单位：Byte）
    speed,      //上传速度（单位：Byte/s）

    avgSpeed,   //平均上传速度（仅上传完毕）

    startTime,  //开始上传的时间
    endTime,    //结束上传的时间（仅上传完毕）

    timeHash,   //文件hash所用时间（毫秒，仅当isMd5为true）
    time,       //上传所用时间（毫秒）

    deleted,     //若为true，表示已删除的文件

    //文件成功上传
    queryOK,     //仅秒传成功时为true
    response,    //服务器返回的字符串
    json         //response解析后的JSON对象(仅当 dataType 为json)
};
```

回调事件示例
```javascript
on: {
    add: function(task) {
        //task.limited存在值的任务不会上传，此处无需返回false
        switch(task.limited){
            case 'ext':return alert("允许上传的文件格式为：" + this.ops.allows);
            case 'size':return alert("允许上传的最大文件大小为：" + Q.formatSize(this.ops.maxSize));
        }

        //自定义判断，返回false时该文件不会添加到上传队列
        //return false;
    },
    upload: function(task) {
        //可以针对单个task指定上传参数,该参数将以POST的方式提交到服务器
        task.data = {};
    },
    complete: function (task) {
        var json = task.json;
        if (!json) return alert("上传已完成，但无法获取服务器返回数据！");
        if (json.ret != 1) return alert(json.msg || "上传失败！");

        alert("上传成功！");
    }
}
```


说明：回调事件(add、upload、hash、sliceUpload、send)支持异步调用，只需在后面加上Async即可，比如在上传之前需要访问服务器验证数据，通过的就上传，否则跳过
```javascript
on: {
    uploadAsync: function (task, callback) {
        $.postJSON(url, function (json) {
            //若 json.ok 返回false，该任务不会上传
            callback(json.ok);
        });
    },
    //计算文件hash
    hashAsync: function(task, callback){
        Q.md5File(task.file, function(md5){
            //task.hash:秒传或断点续传唯一标识
            task.hash = md5;
            callback();
        });
    },
    //分片上传之前触发
    sliceUploadAsync: function (task, callback) {
        log(task.name + ": 上传分片 " + task.sliceIndex + " / " + task.sliceCount);

        callback();
    }
}
```


### 手动操作(api)
```
var uploader = new Q.Uploader(ops);

//上传任务列表，数组
uploader.list

//当前上传任务索引 => var task = uploader.list[uploader.index];
uploader.index

//更改上传配置
uploader.set(settings);

//添加上传任务，支持文件多选、input元素和文件对象 => input.files | input | file
uploader.add(input_or_file);

//批量添加上传任务 list => [input_or_file]
uploader.addList(list);

//手动开始上传（默认自动上传，实例化时可配置 ops.auto=false）
uploader.start();

//上传一个任务
uploader.upload(task);

//取消上传任务
//onlyCancel: 若为true,则仅取消上传而不触发任务完成事件
uploader.cancel(taskId, onlyCancel);

//移除上传任务，会先调用 uploader.cancel(taskId)
uploader.remove(taskId);

//更新上传进度
//total  ： 总上传数据(byte)
//loaded ： 已上传数据(byte)
uploader.progress(task, total, loaded);

```

### 自定义UI实现
可以在初始化时指定UI处理函数，亦可以通过扩展的方式实现
```
Uploader.extend({
    //初始化操作，一般无需处理
    init: function () { },

    //绘制任务界面
    draw: function (task) { },

    //更新上传进度
    update: function (task) { },

    //上传完毕，一般无需处理
    over: function () { }
});
```