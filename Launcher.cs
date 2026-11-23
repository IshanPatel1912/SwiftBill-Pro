using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;

namespace SwiftBillPro
{
    static class Program
    {
        private static HttpListener _listener;
        private static string _distDir;
        private static bool _isRunning = true;

        [STAThread]
        static void Main(string[] args)
        {
            // 1. Single Instance Mutex
            bool createdNew;
            using (Mutex mutex = new Mutex(true, "SwiftBillPro_React_App_SingleInstance_Mutex", out createdNew))
            {
                if (!createdNew)
                {
                    // Already running - notify or just exit
                    // Could also open browser if needed
                    return;
                }

                try
                {
                    // 2. Resolve Root and Dist Directories
                    string appDir = AppDomain.CurrentDomain.BaseDirectory;
                    _distDir = FindDistDirectory(appDir);

                    if (string.IsNullOrEmpty(_distDir) || !File.Exists(Path.Combine(_distDir, "index.html")))
                    {
                        MessageBox.Show(
                            "Could not locate React production build (dist/index.html).\nPlease ensure the application is built before running.",
                            "SwiftBill Pro - Startup Error",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error
                        );
                        return;
                    }

                    // 3. Find an available free TCP Port
                    int port = GetFreeTcpPort();
                    string appUrl = string.Format("http://127.0.0.1:{0}/", port);

                    // 4. Start Embedded High-Performance HTTP Server
                    _listener = new HttpListener();
                    _listener.Prefixes.Add(appUrl);
                    _listener.Start();

                    Thread serverThread = new Thread(ListenLoop);
                    serverThread.IsBackground = true;
                    serverThread.Start();

                    // 5. Locate Browser (Edge or Chrome in App Mode)
                    string browserPath = FindModernBrowser();
                    string profileDir = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "SwiftBillPro",
                        "AppProfile"
                    );

                    try
                    {
                        if (!Directory.Exists(profileDir))
                        {
                            Directory.CreateDirectory(profileDir);
                        }
                    }
                    catch { }

                    Process browserProcess = null;

                    if (!string.IsNullOrEmpty(browserPath))
                    {
                        // Dedicated Standalone App Mode:
                        // No URL address bar, no navigation buttons, clean window title with app logo!
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = browserPath;
                        psi.Arguments = string.Format(
                            "--app=\"{0}\" --window-size=1366,820 --user-data-dir=\"{1}\" --disable-extensions --no-first-run",
                            appUrl,
                            profileDir
                        );
                        psi.UseShellExecute = false;
                        browserProcess = Process.Start(psi);
                    }
                    else
                    {
                        // Fallback to default browser
                        Process.Start(appUrl);
                    }

                    // 6. Keep Server Running While App Window is Open
                    if (browserProcess != null)
                    {
                        browserProcess.WaitForExit();
                    }
                    else
                    {
                        // Wait indefinitely until explicitly closed
                        while (_isRunning)
                        {
                            Thread.Sleep(1000);
                        }
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        "An unexpected error occurred during execution:\n" + ex.Message,
                        "SwiftBill Pro",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                }
                finally
                {
                    _isRunning = false;
                    if (_listener != null && _listener.IsListening)
                    {
                        try { _listener.Stop(); } catch { }
                    }
                }
            }
        }

        private static string FindDistDirectory(string baseDir)
        {
            // Candidate paths
            string[] candidates = new string[]
            {
                Path.Combine(baseDir, "react-app", "dist"),
                Path.Combine(baseDir, "dist"),
                Path.Combine(baseDir, "..", "react-app", "dist"),
                Path.Combine(baseDir, "..", "dist")
            };

            foreach (string path in candidates)
            {
                try
                {
                    string fullPath = Path.GetFullPath(path);
                    if (File.Exists(Path.Combine(fullPath, "index.html")))
                    {
                        return fullPath;
                    }
                }
                catch { }
            }

            return null;
        }

        private static int GetFreeTcpPort()
        {
            TcpListener l = new TcpListener(IPAddress.Loopback, 0);
            l.Start();
            int port = ((IPEndPoint)l.LocalEndpoint).Port;
            l.Stop();
            return port;
        }

        private static void ListenLoop()
        {
            while (_isRunning && _listener != null && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcessRequest, context);
                }
                catch
                {
                    if (!_isRunning) break;
                }
            }
        }

        private static void ProcessRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            try
            {
                string rawUrl = context.Request.Url.AbsolutePath;
                if (rawUrl.StartsWith("/")) rawUrl = rawUrl.Substring(1);
                rawUrl = rawUrl.Replace('/', Path.DirectorySeparatorChar);

                if (string.IsNullOrEmpty(rawUrl))
                {
                    rawUrl = "index.html";
                }

                string filePath = Path.Combine(_distDir, rawUrl);

                // If file doesn't exist, check for index.html (SPA Fallback)
                if (!File.Exists(filePath))
                {
                    filePath = Path.Combine(_distDir, "index.html");
                }

                if (File.Exists(filePath))
                {
                    byte[] fileBytes = File.ReadAllBytes(filePath);
                    string ext = Path.GetExtension(filePath).ToLower();

                    context.Response.ContentType = GetMimeType(ext);
                    context.Response.ContentLength64 = fileBytes.Length;
                    context.Response.Headers.Add("Cache-Control", "no-cache");
                    context.Response.StatusCode = (int)HttpStatusCode.OK;

                    context.Response.OutputStream.Write(fileBytes, 0, fileBytes.Length);
                }
                else
                {
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                }
            }
            catch { }
            finally
            {
                try
                {
                    context.Response.OutputStream.Close();
                }
                catch { }
            }
        }

        private static string GetMimeType(string ext)
        {
            switch (ext)
            {
                case ".html":
                case ".htm":
                    return "text/html; charset=utf-8";
                case ".js":
                case ".mjs":
                    return "application/javascript; charset=utf-8";
                case ".css":
                    return "text/css; charset=utf-8";
                case ".svg":
                    return "image/svg+xml";
                case ".png":
                    return "image/png";
                case ".jpg":
                case ".jpeg":
                    return "image/jpeg";
                case ".ico":
                    return "image/x-icon";
                case ".json":
                    return "application/json; charset=utf-8";
                case ".woff":
                    return "font/woff";
                case ".woff2":
                    return "font/woff2";
                case ".ttf":
                    return "font/ttf";
                default:
                    return "application/octet-stream";
            }
        }

        private static string FindModernBrowser()
        {
            string[] possiblePaths = new string[]
            {
                // Edge candidates
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe"),

                // Chrome candidates
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string p in possiblePaths)
            {
                if (File.Exists(p)) return p;
            }

            return null;
        }
    }
}
