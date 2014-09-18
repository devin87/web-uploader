(function () {
    //获取页名称
    function get_page_name(pathname) {
        pathname = pathname || location.pathname;
        pathname = pathname.toLowerCase().replace(/\\/g, "/");

        var index = pathname.lastIndexOf("/");

        return index != -1 ? pathname.slice(index + 1) : pathname;
    }

    var PAGE_NAME = get_page_name();

    var list_page = [
        { title: "默认上传", href: "default.html" },
        { title: "简单上传", href: "simple.html" },
        { title: "仅上传图片", href: "simple-image.html" },
        { title: "html4+滚动区域", href: "scroll-view.html" },
        { title: "文件单选", href: "simple-single.html" },
        { title: "手动上传", href: "simple-not-auto.html" },
        { title: "自定义上传", href: "custom.html" }
    ];

    function draw_sidebar() {
        var html = [];
        html.push('<div class="title">导航</div>');
        html.push('<ul>');
        for (var i = 0, len = list_page.length; i < len; i++) {
            var item = list_page[i],
                href = item.href;

            html.push('<li' + (href == PAGE_NAME ? ' class="on"' : '') + '><a href="' + item.href + '">' + item.title + '</a></li>');
        }
        html.push('</ul>');

        document.getElementById("sidebar").innerHTML = html.join('');
    }

    function init() {
        draw_sidebar();
    }

    init();
})();