using System;
using System.IO;
using System.Net;
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
        private static volatile bool _isRunning = true;
        private static DateTime _lastHeartbeat = DateTime.MinValue;
        private static volatile bool _receivedHeartbeat = false;
        private static string _logFile;
        private static readonly object _logLock = new object();

        [STAThread]
        static void Main(string[] args)
        {
            string appDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "SwiftBillPro"
            );
            string portFile = Path.Combine(appDataDir, "active_port.txt");
            _logFile = Path.Combine(appDataDir, "launcher.log");

            try
            {
                if (!Directory.Exists(appDataDir)) Directory.CreateDirectory(appDataDir);
            }
            catch { }

            Log("==========================================");
            Log("=== Starting SwiftBill Pro Launcher ===");
            Log("==========================================");

            // 1. Single Instance Check (Local Mutex avoids elevation issues)
            Mutex appMutex = null;
            bool createdNew = false;
            try
            {
                appMutex = new Mutex(true, "Local\\SwiftBillPro_App_SingleInstance_Mutex_v3", out createdNew);
            }
            catch
            {
                createdNew = true; // Fallback to allowing startup if mutex creation fails
            }

            if (!createdNew)
            {
                Log("Another instance is already running.");
                try
                {
                    if (File.Exists(portFile))
                    {
                        string pStr = File.ReadAllText(portFile).Trim();
                        int p;
                        if (int.TryParse(pStr, out p) && p > 0)
                        {
                            string existingUrl = string.Format("http://127.0.0.1:{0}/", p);
                            Log("Focusing existing instance at: " + existingUrl);
                            LaunchBrowser(existingUrl, appDataDir);
                            return;
                        }
                    }
                }
                catch { }

                LaunchBrowser("http://127.0.0.1:5888/", appDataDir);
                return;
            }

            try
            {
                // 2. Resolve Dist Directory
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                Log("BaseDir: " + baseDir);
                _distDir = FindDistDirectory(baseDir);
                Log("Resolved DistDir: " + (_distDir ?? "NULL"));

                if (string.IsNullOrEmpty(_distDir) || !File.Exists(Path.Combine(_distDir, "index.html")))
                {
                    Log("ERROR: Could not locate application files (index.html)!");
                    MessageBox.Show(
                        "Could not locate SwiftBill Pro application files (index.html).\nPlease reinstall or verify installation directory.",
                        "SwiftBill Pro",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                // 3. Bind to an Available Local Port
                int port = 5888;
                bool bound = false;

                for (int p = 5888; p < 5999; p++)
                {
                    try
                    {
                        _listener = new HttpListener();
                        string prefix127 = string.Format("http://127.0.0.1:{0}/", p);
                        _listener.Prefixes.Add(prefix127);
                        _listener.Start();
                        port = p;
                        bound = true;
                        Log("Server bound successfully to " + prefix127);
                        break;
                    }
                    catch (Exception ex)
                    {
                        Log(string.Format("Port {0} failed: {1}", p, ex.Message));
                        try { _listener.Close(); } catch { }
                    }
                }

                if (!bound)
                {
                    Log("ERROR: Failed to bind to any port in range 5888-5999.");
                    MessageBox.Show(
                        "Failed to start local application server. Ports 5888-5999 are unavailable.",
                        "SwiftBill Pro Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                string appUrl = string.Format("http://127.0.0.1:{0}/", port);

                try
                {
                    File.WriteAllText(portFile, port.ToString());
                }
                catch { }

                // 4. Start Server Listener Thread
                Thread serverThread = new Thread(ListenLoop);
                serverThread.IsBackground = true;
                serverThread.Start();
                Log("Server background thread started.");

                // 5. Launch Dedicated App Window
                Log("Launching application window at: " + appUrl);
                LaunchBrowser(appUrl, appDataDir);

                // 6. Resilient Lifecycle Monitoring Loop
                DateTime startTime = DateTime.UtcNow;
                Log("Entering lifecycle monitoring loop...");

                while (_isRunning)
                {
                    Thread.Sleep(1000);

                    if (_receivedHeartbeat)
                    {
                        // When window is closed, heartbeats stop.
                        // Allow 15 seconds grace period before shutting down.
                        double gap = (DateTime.UtcNow - _lastHeartbeat).TotalSeconds;
                        if (gap > 15)
                        {
                            Log(string.Format("Heartbeat stopped for {0:F1}s (> 15s). Closing application.", gap));
                            break;
                        }
                    }
                    else
                    {
                        // Startup grace period: wait up to 45 seconds for browser to open and first ping to arrive
                        double elapsed = (DateTime.UtcNow - startTime).TotalSeconds;
                        if (elapsed > 45)
                        {
                            Log(string.Format("Initial heartbeat timeout after {0:F1}s. Closing application.", elapsed));
                            break;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log("FATAL EXCEPTION: " + ex.ToString());
                MessageBox.Show(
                    "Error running SwiftBill Pro:\n" + ex.Message,
                    "SwiftBill Pro",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
            finally
            {
                _isRunning = false;
                try
                {
                    if (File.Exists(portFile)) File.Delete(portFile);
                }
                catch { }

                if (_listener != null && _listener.IsListening)
                {
                    try { _listener.Stop(); } catch { }
                    try { _listener.Close(); } catch { }
                }

                if (appMutex != null)
                {
                    try { appMutex.ReleaseMutex(); } catch { }
                    try { appMutex.Close(); } catch { }
                }

                Log("=== Server stopped. Launcher terminated cleanly. ===");
            }
        }

        private static void LaunchBrowser(string appUrl, string appDataDir)
        {
            string browserPath = FindModernBrowser();
            Log("Modern browser path: " + (browserPath ?? "DEFAULT"));

            string userDataDir = Path.Combine(appDataDir, "BrowserData");
            try
            {
                if (!Directory.Exists(userDataDir)) Directory.CreateDirectory(userDataDir);
            }
            catch { }

            if (!string.IsNullOrEmpty(browserPath))
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = browserPath;
                    // CRITICAL: --user-data-dir gives SwiftBill Pro its own isolated profile,
                    // completely avoiding Error 32 ProcessSingleton lock collisions with Edge/Chrome background processes!
                    psi.Arguments = string.Format(
                        "--user-data-dir=\"{0}\" --app=\"{1}\" --window-size=1366,820 --no-first-run --no-default-browser-check",
                        userDataDir,
                        appUrl
                    );
                    psi.UseShellExecute = false;
                    Log("Starting browser with arguments: " + psi.Arguments);
                    Process.Start(psi);
                    return;
                }
                catch (Exception ex)
                {
                    Log("Failed launching browser in --app mode: " + ex.Message);
                }
            }

            // Fallback to default system browser
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = appUrl;
                psi.UseShellExecute = true;
                Log("Launching default browser with URL: " + appUrl);
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                Log("Failed launching default browser: " + ex.Message);
            }
        }

        private static string FindDistDirectory(string baseDir)
        {
            string[] candidates = new string[]
            {
                Path.Combine(baseDir, "react-app", "dist"),
                Path.Combine(baseDir, "dist"),
                baseDir,
                Path.Combine(baseDir, "..", "react-app", "dist"),
                Path.Combine(baseDir, "..", "dist"),
                @"C:\Billing_system\react-app\dist",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\SwiftBill Pro\react-app\dist"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\SwiftBill Pro\dist")
            };

            foreach (string path in candidates)
            {
                try
                {
                    if (string.IsNullOrEmpty(path)) continue;
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

                // Handle heartbeat ping
                if (rawUrl.IndexOf("__heartbeat", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    if (!_receivedHeartbeat)
                    {
                        _receivedHeartbeat = true;
                        Log("First UI heartbeat received! Application is active and running.");
                    }
                    _lastHeartbeat = DateTime.UtcNow;
                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                    byte[] empty = new byte[0];
                    context.Response.ContentLength64 = 0;
                    context.Response.OutputStream.Write(empty, 0, 0);
                    return;
                }

                if (rawUrl.StartsWith("/")) rawUrl = rawUrl.Substring(1);
                rawUrl = rawUrl.Replace('/', Path.DirectorySeparatorChar);

                if (string.IsNullOrEmpty(rawUrl))
                {
                    rawUrl = "index.html";
                }

                string filePath = Path.Combine(_distDir, rawUrl);

                // SPA Fallback: If requested route does not exist on disk, serve index.html
                if (!File.Exists(filePath))
                {
                    filePath = Path.Combine(_distDir, "index.html");
                }

                if (File.Exists(filePath))
                {
                    string ext = Path.GetExtension(filePath).ToLower();

                    // If serving index.html, ensure heartbeat script is included
                    if (filePath.EndsWith("index.html", StringComparison.OrdinalIgnoreCase))
                    {
                        string html = File.ReadAllText(filePath, Encoding.UTF8);
                        if (!html.Contains("__heartbeat"))
                        {
                            string inject = "<script>(function(){function p(){try{var x=new XMLHttpRequest();x.open('GET','/__heartbeat?t='+Date.now(),true);x.send();}catch(e){}}p();setInterval(p,1500);})();</script>";
                            int bIdx = html.IndexOf("</body>", StringComparison.OrdinalIgnoreCase);
                            if (bIdx >= 0) html = html.Insert(bIdx, inject);
                            else html = html + inject;
                        }

                        byte[] htmlBytes = Encoding.UTF8.GetBytes(html);
                        context.Response.ContentType = "text/html; charset=utf-8";
                        context.Response.ContentLength64 = htmlBytes.Length;
                        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                        context.Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                        context.Response.StatusCode = (int)HttpStatusCode.OK;
                        context.Response.OutputStream.Write(htmlBytes, 0, htmlBytes.Length);
                    }
                    else
                    {
                        byte[] fileBytes = File.ReadAllBytes(filePath);
                        context.Response.ContentType = GetMimeType(ext);
                        context.Response.ContentLength64 = fileBytes.Length;
                        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                        context.Response.Headers.Add("Cache-Control", "public, max-age=86400");
                        context.Response.StatusCode = (int)HttpStatusCode.OK;
                        context.Response.OutputStream.Write(fileBytes, 0, fileBytes.Length);
                    }
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
                try
                {
                    if (File.Exists(p)) return p;
                }
                catch { }
            }

            return null;
        }

        private static void Log(string msg)
        {
            try
            {
                if (string.IsNullOrEmpty(_logFile)) return;
                lock (_logLock)
                {
                    File.AppendAllText(_logFile, string.Format("[{0:HH:mm:ss.fff}] {1}\r\n", DateTime.Now, msg));
                }
            }
            catch { }
        }
    }
}
