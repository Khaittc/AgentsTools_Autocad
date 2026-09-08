using System;
using System.IO;
using System.Text;
using System.Threading;
using TTC.CadTools.Core.Logging;

namespace TTC.CadTools.Infrastructure.Logging
{
    public class FileLogger : ILogger, IDisposable
    {
        private readonly object _lock = new object();
        private readonly string _primaryDir;
        private readonly string _fallbackDir;
        private string _activeDir = string.Empty;
        private string _activeFilePath = string.Empty;
        private bool _isFallback;
        private bool _isFailed;

        public string ActiveLogPath => _activeFilePath;
        public string ActiveDirectory => _activeDir;
        public bool IsFallback => _isFallback;
        public bool IsFailed => _isFailed;

        public FileLogger() : this(
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "TTC_CadTools", "Logs"),
            Path.Combine(Path.GetTempPath(), "TTC_CadTools", "Logs"))
        {
        }

        public FileLogger(string primaryDir, string fallbackDir)
        {
            _primaryDir = primaryDir;
            _fallbackDir = fallbackDir;
            InitializeDirectory();
        }

        private void InitializeDirectory()
        {
            try
            {
                if (!Directory.Exists(_primaryDir))
                {
                    Directory.CreateDirectory(_primaryDir);
                }
                _activeDir = _primaryDir;
                _isFallback = false;
            }
            catch
            {
                try
                {
                    if (!Directory.Exists(_fallbackDir))
                    {
                        Directory.CreateDirectory(_fallbackDir);
                    }
                    _activeDir = _fallbackDir;
                    _isFallback = true;
                }
                catch
                {
                    _isFailed = true;
                    _activeDir = string.Empty;
                }
            }

            UpdateActiveFilePath();
        }

        private void UpdateActiveFilePath()
        {
            if (string.IsNullOrEmpty(_activeDir))
            {
                _activeFilePath = string.Empty;
                return;
            }

            string dateStr = DateTime.Now.ToString("yyyyMMdd");
            string fileName = $"ttc_cad_{dateStr}.log";
            _activeFilePath = Path.Combine(_activeDir, fileName);
        }

        public void Debug(string message) => Log(LogLevel.Debug, message, null);
        public void Info(string message) => Log(LogLevel.Information, message, null);
        public void Warn(string message) => Log(LogLevel.Warning, message, null);
        public void Error(string message, Exception? ex = null) => Log(LogLevel.Error, message, ex);

        private void Log(LogLevel level, string message, Exception? ex)
        {
            if (_isFailed)
                return;

            lock (_lock)
            {
                try
                {
                    UpdateActiveFilePath();
                    string levelStr = level switch
                    {
                        LogLevel.Debug => "DEBUG",
                        LogLevel.Information => "INFO ",
                        LogLevel.Warning => "WARN ",
                        LogLevel.Error => "ERROR",
                        _ => "INFO "
                    };

                    int threadId = Thread.CurrentThread.ManagedThreadId;
                    string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
                    string exDetails = ex != null ? $" Exception: {ex.GetType().FullName}: {ex.Message} {ex.StackTrace}" : string.Empty;
                    string line = $"[{timestamp}] [{levelStr}] [{threadId:D2}] {message}{exDetails}";

                    WriteWithFallback(line);
                }
                catch
                {
                    // Fail-safe: never throw from logger
                }
            }
        }

        private void WriteWithFallback(string line)
        {
            try
            {
                File.AppendAllText(_activeFilePath, line + Environment.NewLine, Encoding.UTF8);
            }
            catch
            {
                if (!_isFallback)
                {
                    try
                    {
                        if (!Directory.Exists(_fallbackDir))
                        {
                            Directory.CreateDirectory(_fallbackDir);
                        }
                        _activeDir = _fallbackDir;
                        _isFallback = true;
                        UpdateActiveFilePath();
                        File.AppendAllText(_activeFilePath, line + Environment.NewLine, Encoding.UTF8);
                        return;
                    }
                    catch
                    {
                        _isFailed = true;
                    }
                }
                else
                {
                    _isFailed = true;
                }
            }
        }

        public void Flush()
        {
            // File.AppendAllText flushes automatically on close
        }

        public void Dispose()
        {
            Flush();
        }
    }
}
