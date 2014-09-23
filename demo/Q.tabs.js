/// <reference path="../js/Q.js" />
/// <reference path="jquery-1.11.1.js" />
/*
* Q.tabs.js 选项卡插件
* author:devin87@qq.com  
* update:2014/09/23 11:15
*/
(function () {
    "use strict";

    var isFunc = Q.isFunc,
        getFirst = Q.getFirst;

    //设置选项卡切换
    function setTabs(ops) {
        ops = ops || {};

        var context = ops.context,

            list_li = $(".tabTitle>li", context),
            list_cont = $(".tabCont>.turn-box", context),

            lastIndex;

        if (list_li.size() <= 0) return;

        var map_tab_index = {};

        $.each(list_li, function (i, li) {
            //优先显示
            if ($(li).attr("x-def") == "1") ops.index = i;

            var link = getFirst(li);
            if (!link) return;

            var hash = link.href.split("#")[1];
            if (hash) map_tab_index[hash] = i;
        });

        list_li.removeClass("on");
        list_cont.hide();

        //切换操作
        var showTab = function (index) {
            if (index === lastIndex) return;

            if (lastIndex !== undefined) {
                var lastTab = list_li[lastIndex],
                    lastCont = list_cont[lastIndex];

                $(lastTab).removeClass("on");
                $(lastCont).hide();
            }

            var tab = list_li[index],
                cont = list_cont[index];

            $(tab).addClass("on");
            $(cont).show();

            lastIndex = index;

            //回调函数(自定义切换事件)
            var callback = window.onTabChange;

            if (isFunc(callback)) {
                setTimeout(function () {
                    callback({ index: index, tab: tab, cont: cont });
                }, 100);
            }
        };

        //点击切换事件
        list_li.each(function (i) {
            $(this).click(function () {
                showTab(i);
            });
        });

        //初始化
        setTimeout(function () {
            var hash = location.hash.slice(1),
                index = map_tab_index[hash];

            if (index == undefined) index = ops.index || 0;

            //默认显示顺序 location hash -> html定义(x-def属性) -> ops.index -> 0
            showTab(index);
        }, 20);
    }

    //------------------------- export -------------------------

    Q.setTabs = setTabs;

})();