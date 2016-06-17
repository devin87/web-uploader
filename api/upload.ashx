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
                if (string.IsNullOrEmpty(fileName)) fileName = System.IO.Path.GetFileName(file.FileName);

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
                if (File.Exists(path_ok)) Finish("ok");
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

        string type = request["type"];
        string user = request["user"];
        string name = request["name"];

        //此处返回的JSON字符串为手动拼接,未处理字符串转义等特殊情况,仅作演示
        string json = "\"time\":\"" + DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss") + "\"";
        if (type != null) json += ",\"type\":\"" + type + "\"";
        if (user != null) json += ",\"user\":\"" + user + "\"";
        if (name != null) json += ",\"name\":\"" + name + "\"";

        Finish("{" + json + "}");
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