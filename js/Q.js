/*
* Q.js for Uploader
* author:devin87@qq.com
* update:2014/09/18 15:33
*/
(function (window, undefined) {
    "use strict";

    var toString = Object.prototype.toString,
        has = Object.prototype.hasOwnProperty,
        slice = Array.prototype.slice;

    //若value不为undefine,则返回value;否则返回defValue
    function def(value, defValue) {
        return value !== undefined ? value : defValue;
    }

    //检测是否为函数
    function isFunc(fn) {
        //在ie11兼容模式（ie6-8）下存在bug,当调用次数过多时可能返回不正确的结果
        //return typeof fn == "function";

        return toString.call(fn) === "[object Function]";
    }

    //检测是否为正整数
    function isUInt(n) {
        return typeof n == "number" && n > 0 && n === Math.floor(n);
    }

    //触发指定函数,如果函数不存在,则不触发
    function fire(fn, bind) {
        if (isFunc(fn)) return fn.apply(bind, slice.call(arguments, 2));
    }

    //扩展对象
    //forced:是否强制扩展
    function extend(destination, source, forced) {
        for (var key in source) {
            if (key == undefined || !has.call(source, key)) continue;

            if (forced || destination[key] === undefined) destination[key] = source[key];
        }
        return destination;
    }

    //Object.forEach
    extend(Object, {
        //遍历对象
        forEach: function (obj, fn, bind) {
            for (var key in obj) {
                if (has.call(obj, key)) fn.call(bind, key, obj[key], obj);
            }
        }
    });

    extend(Date, {
        //获取当前日期和时间所代表的毫秒数
        now: function () {
            return +new Date;
        }
    });

    //json解析
    //secure:是否进行安全检测
    function json_decode(text, secure) {
        //安全检测
        if (secure !== false && !/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) throw new Error("JSON SyntaxError");
        try {
            return (new Function("return " + text))();
        } catch (e) { }
    }

    if (!window.JSON) window.JSON = {};
    if (!JSON.parse) JSON.parse = json_decode;

    //-------------------------- DOM ---------------------------

    //设置元素透明
    function setOpacity(ele, value) {
        if (value <= 1) value *= 100;

        if (ele.style.opacity != undefined) ele.style.opacity = value / 100;
        else if (ele.style.filter != undefined) ele.style.filter = "alpha(opacity=" + parseInt(value) + ")";
    }

    //获取元素绝对定位
    function getOffset(ele, root) {
        var left = 0, top = 0, width = ele.offsetWidth, height = ele.offsetHeight;

        do {
            left += ele.offsetLeft;
            top += ele.offsetTop;
            ele = ele.offsetParent;
        } while (ele && ele != root);

        return { left: left, top: top, width: width, height: height };
    }

    //遍历元素节点
    function walk(ele, walk, start, all) {
        var el = ele[start || walk];
        var list = [];
        while (el) {
            if (el.nodeType == 1) {
                if (!all) return el;
                list.push(el);
            }
            el = el[walk];
        }
        return all ? list : null;
    }

    //获取上一个元素节点
    function getPrev(ele) {
        return ele.previousElementSibling || walk(ele, "previousSibling", null, false);
    }

    //获取下一个元素节点
    function getNext(ele) {
        return ele.nextElementSibling || walk(ele, "nextSibling", null, false);
    }

    //获取第一个元素子节点
    function getFirst(ele) {
        return ele.firstElementChild || walk(ele, "nextSibling", "firstChild", false);
    }

    //获取最后一个元素子节点
    function getLast(ele) {
        return ele.lastElementChild || walk(ele, "previousSibling", "lastChild", false);
    }

    //获取所有子元素节点
    function getChilds(ele) {
        return ele.children || walk(ele, "nextSibling", "firstChild", true);
    }

    //创建元素
    function createEle(tagName, className, html) {
        var ele = document.createElement(tagName);
        if (className) ele.className = className;
        if (html) ele.innerHTML = html;

        return ele;
    }

    //解析html标签
    function parseHTML(html, all) {
        var box = createEle("div", "", html);
        return all ? box.childNodes : getFirst(box);
    }

    //-------------------------- event ---------------------------

    var addEvent,
        removeEvent;

    if (document.addEventListener) {  //w3c
        addEvent = function (ele, type, fn) {
            ele.addEventListener(type, fn, false);
        };

        removeEvent = function (ele, type, fn) {
            ele.removeEventListener(type, fn, false);
        };
    } else if (document.attachEvent) {  //IE
        addEvent = function (ele, type, fn) {
            ele.attachEvent("on" + type, fn);
        };

        removeEvent = function (ele, type, fn) {
            ele.detachEvent("on" + type, fn);
        };
    }

    //event简单处理
    function fix_event(event) {
        var e = event || window.event;

        //for ie
        if (!e.target) e.target = e.srcElement;

        return e;
    }

    //添加事件
    function add_event(element, type, handler, once) {
        var fn = function (e) {
            handler.call(element, fix_event(e));

            if (once) removeEvent(element, type, fn);
        };

        addEvent(element, type, fn);

        if (!once) {
            return {
                //直接返回停止句柄 eg:var api=add_event();api.stop();
                stop: function () {
                    removeEvent(element, type, fn);
                }
            };
        }
    }

    //触发事件
    function fire_event(ele, type, e) {
        if (isFunc(ele[type])) ele[type]();
        else if (ele.fireEvent) ele.fireEvent("on" + type);
        else if (ele.dispatchEvent) {
            var event = ele.ownerDocument.createEvent('MouseEvents');
            if (e) event.initMouseEvent(type, true, true, ele.ownerDocument.defaultView, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, false, false, 0, null);
            else event.initEvent(type, false, true);
            ele.dispatchEvent(event);
        }
    }

    //阻止事件默认行为并停止事件冒泡
    function stop_event(event, preventDefault, stopPropagation) {
        var e = fix_event(event);

        if (preventDefault !== false) {
            if (e.preventDefault) e.preventDefault();
            else e.returnValue = false;
        }

        if (stopPropagation !== false) {
            if (e.stopPropagation) e.stopPropagation();
            else e.cancelBubble = true;
        }
    }

    //---------------------- other ----------------------

    var RE_HTTP = /^https?:\/\//i;

    //是否http路径(以 http:// 或 https:// 开头)
    function isHttpURL(url) {
        return RE_HTTP.test(url);
    }

    //判断指定路径与当前页面是否同域(包括协议检测 eg:http与https不同域)
    function isSameHost(url) {
        if (!isHttpURL(url)) return true;

        var start = RegExp.lastMatch.length,
            end = url.indexOf("/", start),
            host = url.slice(0, end != -1 ? end : undefined);

        return host.toLowerCase() == (location.protocol + "//" + location.host).toLowerCase();
    }

    //按照进制解析数字的层级 eg:时间转化 -> parseLevel(86400,[60,60,24]) => { value=1, level=3 }
    //steps:步进,可以是固定的数字(eg:1024),也可以是具有层次关系的数组(eg:[60,60,24])
    //limit:限制解析的层级,正整数,默认为100
    function parseLevel(size, steps, limit) {
        size = +size;
        steps = steps || 1024;

        var level = 0,
            isNum = typeof steps == "number",
            stepNow = 1,
            count = isUInt(limit) ? limit : (isNum ? 100 : steps.length);

        while (size >= stepNow && level < count) {
            stepNow *= (isNum ? steps : steps[level]);
            level++;
        }

        if (level && size < stepNow) {
            stepNow /= (isNum ? steps : steps[steps.length - 1]);
            level--;
        }

        return { value: level ? size / stepNow : size, level: level };
    }

    var UNITS_FILE_SIZE = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];

    //格式化数字输出,将数字转为合适的单位输出,默认按照1024层级转为文件单位输出
    function formatSize(size, ops) {
        ops = ops || {};

        if (isNaN(size) || size == undefined || size < 0) return { text: ops.error || "--" };

        var pl = parseLevel(size, ops.steps, ops.limit),

            digit = ops.digit,

            value = pl.value,
            text = value.toFixed(isUInt(digit) || digit == 0 ? digit : 2);

        if (ops.trim !== false && text.lastIndexOf(".") != -1) text = text.replace(/\.?0+$/, "");

        pl.text = text + (ops.join || "") + (ops.units || UNITS_FILE_SIZE)[pl.level + (ops.levelFix || 0)];

        return pl;
    }

    //---------------------- export ----------------------

    var Q = {
        def: def,
        isFunc: isFunc,
        isUInt: isUInt,

        fire: fire,
        extend: extend,

        setOpacity: setOpacity,
        getOffset: getOffset,

        walk: walk,
        getPrev: getPrev,
        getNext: getNext,
        getFirst: getFirst,
        getLast: getLast,
        getChilds: getChilds,

        createEle: createEle,
        parseHTML: parseHTML,

        isHttpURL: isHttpURL,
        isSameHost: isSameHost,

        parseLevel: parseLevel,
        formatSize: formatSize
    };

    Q.Event = {
        fix: fix_event,
        stop: stop_event,
        fire: fire_event,

        add: add_event
    };

    window.Q = Q;

})(window);