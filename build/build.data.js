//build 配置文件
module.exports = {
    root: "../",

    noStore: true,

    concat: {
        title: "文件合并",

        dir: "js",

        list: [
            {
                src: ["Q.js", "Q.Uploader.js", "Q.Uploader.UI.js"],
                dest: "/Q.Uploader.all.js"
            },
            {
                src: ["Q.js", "Q.Uploader.js", "Q.Uploader.Image.js"],
                dest: "/Q.Uploader.image.all.js"
            }
        ],

        replace: [
            //移除\r字符
            [/\r/g, ""],
            //移除VS引用
            [/\/\/\/\s*<reference path="[^"]*" \/>\n/gi, ""]
        ]
    },

    cmd: [
        {
            title: "压缩js",

            //cmd: "java -jar D:\\tools\\compiler.jar --js=%f.fullname% --js_output_file=%f.dest%",
            cmd: "uglifyjs %f.fullname% -o %f.dest% -c -m",

            output: "dist",
            match: ["*.js", "js/*.js"],

            replace: [
                //去掉文件头部压缩工具可能保留的注释
                [/^\/\*([^~]|~)*?\*\//, ""]
            ],

            //可针对单一的文件配置 before、after,def 表示默认
            before: [{
                "def": "//devin87@qq.com\n//build:%NOW%\n",
                "spark-md5.js": "//spark-md5 v2.0.2 https://github.com/satazor/js-spark-md5\n//build:%NOW%\n"
            }]
        }
    ],

    run: ["concat", "cmd"]
};