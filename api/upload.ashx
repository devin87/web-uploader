<%@ WebHandler Language="C#" Class="upload" %>

using System;
using System.Web;
using System.IO;

public class upload : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        HttpRequest request = context.Request;

        string action = request["action"];
        string hash = request["hash"];

        int fileCount = request.Files.Count;

        if (string.IsNullOrEmpty(hash))
        {
            //普通上传
            if (fileCount > 0)
            {
                HttpPostedFile file = request.Files[0];

                string fileName = request["fileName"];
                if (string.IsNullOrEmpty(fileName)) fileName = file.FileName;

                string dir = Path.GetDirectoryName(fileName);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(context.Server.MapPath("~/upload/" + dir));

                string path = context.Server.MapPath("~/upload/" + fileName);
                file.SaveAs(path);
            }
        }
        else
        {
            //秒传或断点续传
            string path = context.Server.MapPath("~/upload/" + hash);
            string path_ok = path + ".ok";

            //状态查询
            if (action == "query")
            {
                if (File.Exists(path_ok)) Finish(GetResponseJSON(request, ",\"ret\":1"));
                else if (File.Exists(path)) Finish(new FileInfo(path).Length.ToString());
                else Finish("0");
            }
            else
            {
                if (fileCount > 0)
                {
                    HttpPostedFile file = request.Files[0];
                    using (FileStream fs = File.Open(path, FileMode.Append))
                    {
                        byte[] buffer = new byte[file.ContentLength];
                        file.InputStream.Read(buffer, 0, file.ContentLength);

                        fs.Write(buffer, 0, buffer.Length);
                    }
                }

                bool isOk = request["ok"] == "1";
                if (!isOk) Finish("1");

                if (File.Exists(path)) File.Move(path, path_ok);
            }
        }

        Finish(GetResponseJSON(request, ""));
    }

    /// <summary>
    /// 获取返回的json字符串
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    private string GetResponseJSON(HttpRequest request, string result)
    {
        string type = request["type"];
        string user = request["user"];
        string name = request["name"];

        //此处返回的JSON字符串为手动拼接,未处理字符串转义等特殊情况,仅作演示
        string json = "\"time\":\"" + DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss") + "\"";
        if (type != null) json += ",\"type\":\"" + type + "\"";
        if (user != null) json += ",\"user\":\"" + user + "\"";
        if (name != null) json += ",\"name\":\"" + name + "\"";

        return "{" + json + result + "}";
    }

    /// <summary>
    /// 完成上传
    /// </summary>
    /// <param name="json">回调函数参数</param>
    private void Finish(string json)
    {
        HttpResponse Response = HttpContext.Current.Response;

        Response.Write(json);
        Response.End();
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}