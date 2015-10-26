<%@ WebHandler Language="C#" Class="upload" %>

using System;
using System.Web;

public class upload : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        HttpRequest request = context.Request;

        int c = context.Request.Files.Count;

        //接收上传的数据并保存到服务器
        for (int i = 0; i < c; i++)
        {
            HttpPostedFile file = context.Request.Files[i];

            string fileName = request["fileName"];
            if (string.IsNullOrEmpty(fileName)) fileName = System.IO.Path.GetFileName(file.FileName);

            string path = context.Server.MapPath("~/upload/" + fileName);
            file.SaveAs(path);
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