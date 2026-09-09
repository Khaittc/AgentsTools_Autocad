using System;
using System.Collections.Generic;
using System.IO;
using TTC.CadTools.Core.Configuration;
using TTC.CadTools.Core.Logging;
using TTC.CadTools.Infrastructure.Configuration;
using Xunit;

namespace TTC.CadTools.Tests.SettingsTests
{
    public class ConfigurationWarningTests : IDisposable
    {
        private readonly string _tempDir;

        public ConfigurationWarningTests()
        {
            _tempDir = Path.Combine(Path.GetTempPath(), "TTC_Test_ConfigWarn_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_tempDir);
        }

        public void Dispose()
        {
            try
            {
                if (Directory.Exists(_tempDir))
                    Directory.Delete(_tempDir, true);
            }
            catch { }
        }

        private class TestLogger : ILogger
        {
            public List<string> InfoMessages { get; } = new List<string>();
            public List<string> WarnMessages { get; } = new List<string>();
            public List<string> ErrorMessages { get; } = new List<string>();

            public void Debug(string message) { }
            public void Info(string message) => InfoMessages.Add(message);
            public void Warn(string message) => WarnMessages.Add(message);
            public void Error(string message, Exception? ex = null) => ErrorMessages.Add(message);
        }

        [Fact]
        public void ValidConfiguration_LogsInfo_NoStructuredWarning()
        {
            string validFile = Path.Combine(_tempDir, "valid_settings.json");
            File.WriteAllText(validFile, @"{
  ""schemaVersion"": ""1.0"",
  ""environment"": ""Production"",
  ""logging"": { ""logLevel"": ""Information"", ""retentionDays"": 7 },
  ""ui"": { ""ribbonAutoLoad"": true, ""paletteAutoOpen"": false }
}");

            var repo = new JsonSettingsRepository(validFile, null);
            var logger = new TestLogger();

            ConfigurationStatusLogger.LogStatus(logger, repo.Status);

            Assert.Equal(ConfigurationStatus.Valid, repo.Status.Status);
            Assert.Single(logger.InfoMessages);
            Assert.Contains("Configuration loaded successfully", logger.InfoMessages[0]);
            Assert.Empty(logger.WarnMessages);
            Assert.Empty(logger.ErrorMessages);
            Assert.NotNull(repo.CurrentSettings);
        }

        [Fact]
        public void MalformedConfiguration_EmitsStructuredWarning_AndFallbackDefaultSettings()
        {
            string malformedFile = Path.Combine(_tempDir, "corrupted_settings.json");
            File.WriteAllText(malformedFile, "{ broken: json not valid }");

            var repo = new JsonSettingsRepository(malformedFile, null);
            var logger = new TestLogger();

            ConfigurationStatusLogger.LogStatus(logger, repo.Status);

            Assert.Equal(ConfigurationStatus.Invalid, repo.Status.Status);
            Assert.Single(logger.WarnMessages);
            Assert.StartsWith("WARN: Configuration invalid; using safe defaults.", logger.WarnMessages[0]);
            Assert.Contains("Error:", logger.WarnMessages[0]);
            Assert.Empty(logger.ErrorMessages);
            Assert.NotNull(repo.CurrentSettings);
            Assert.Equal(7, repo.CurrentSettings.Logging.RetentionDays);
            Assert.Equal("Production", repo.CurrentSettings.Environment);
        }

        [Fact]
        public void MissingConfiguration_EmitsStructuredWarning_AndFallbackDefaultSettings()
        {
            string missingUser = Path.Combine(_tempDir, "non_existent_user.json");
            string missingBundle = Path.Combine(_tempDir, "non_existent_bundle.json");

            var repo = new JsonSettingsRepository(missingUser, missingBundle);
            var logger = new TestLogger();

            ConfigurationStatusLogger.LogStatus(logger, repo.Status);

            Assert.Equal(ConfigurationStatus.FallbackDefault, repo.Status.Status);
            Assert.Single(logger.WarnMessages);
            Assert.StartsWith("WARN: settings.json not found; using in-memory defaults.", logger.WarnMessages[0]);
            Assert.Empty(logger.ErrorMessages);
            Assert.NotNull(repo.CurrentSettings);
            Assert.Equal(7, repo.CurrentSettings.Logging.RetentionDays);
        }

        [Fact]
        public void NullLoggerOrResult_DoesNotThrowUnhandledException()
        {
            var exception1 = Record.Exception(() => ConfigurationStatusLogger.LogStatus(null!, new ConfigurationResult()));
            Assert.Null(exception1);

            var exception2 = Record.Exception(() => ConfigurationStatusLogger.LogStatus(new TestLogger(), null!));
            Assert.Null(exception2);
        }
    }
}
