using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TTC.CadTools.Infrastructure.Logging;
using Xunit;

namespace TTC.CadTools.Tests.LoggingTests
{
    public class FileLoggerTests : IDisposable
    {
        private readonly string _tempPrimary;
        private readonly string _tempFallback;

        public FileLoggerTests()
        {
            _tempPrimary = Path.Combine(Path.GetTempPath(), "TTC_LogTest_P_" + Guid.NewGuid().ToString("N"));
            _tempFallback = Path.Combine(Path.GetTempPath(), "TTC_LogTest_F_" + Guid.NewGuid().ToString("N"));
        }

        public void Dispose()
        {
            try
            {
                if (Directory.Exists(_tempPrimary)) Directory.Delete(_tempPrimary, true);
                if (Directory.Exists(_tempFallback)) Directory.Delete(_tempFallback, true);
            }
            catch { }
        }

        [Fact]
        public void DailyFileName_MatchesPattern()
        {
            using var logger = new FileLogger(_tempPrimary, _tempFallback);
            string expectedFileName = $"ttc_cad_{DateTime.Now:yyyyMMdd}.log";

            Assert.EndsWith(expectedFileName, logger.ActiveLogPath);
        }

        [Fact]
        public void LogOutput_ContainsFormattedLine_AndLevel()
        {
            using var logger = new FileLogger(_tempPrimary, _tempFallback);
            logger.Info("Test info message");
            logger.Warn("Test warn message");
            logger.Error("Test error message", new InvalidOperationException("Test ex message"));

            Assert.True(File.Exists(logger.ActiveLogPath));
            string content = File.ReadAllText(logger.ActiveLogPath);

            Assert.Contains("[INFO ]", content);
            Assert.Contains("Test info message", content);
            Assert.Contains("[WARN ]", content);
            Assert.Contains("Test warn message", content);
            Assert.Contains("[ERROR]", content);
            Assert.Contains("Test error message", content);
            Assert.Contains("InvalidOperationException: Test ex message", content);
        }

        [Fact]
        public void ConcurrentWrites_DoNotThrowExceptions()
        {
            using var logger = new FileLogger(_tempPrimary, _tempFallback);

            Parallel.For(0, 50, i =>
            {
                logger.Info($"Concurrent message {i}");
            });

            Assert.True(File.Exists(logger.ActiveLogPath));
            string[] lines = File.ReadAllLines(logger.ActiveLogPath);
            Assert.Equal(50, lines.Length);
        }

        [Fact]
        public void FallbackDirectory_UsedWhenPrimaryInaccessible()
        {
            // Create a file where directory is expected, so Directory.CreateDirectory fails
            string blockedPrimary = Path.Combine(Path.GetTempPath(), "TTC_BlockedFile_" + Guid.NewGuid().ToString("N"));
            File.WriteAllText(blockedPrimary, "blocking file");

            try
            {
                using var logger = new FileLogger(blockedPrimary, _tempFallback);
                logger.Info("Fallback test message");

                Assert.True(logger.IsFallback);
                Assert.True(File.Exists(logger.ActiveLogPath));
                Assert.StartsWith(_tempFallback, logger.ActiveLogPath);
                string content = File.ReadAllText(logger.ActiveLogPath);
                Assert.Contains("Fallback test message", content);
            }
            finally
            {
                try { if (File.Exists(blockedPrimary)) File.Delete(blockedPrimary); } catch { }
            }
        }
    }
}
