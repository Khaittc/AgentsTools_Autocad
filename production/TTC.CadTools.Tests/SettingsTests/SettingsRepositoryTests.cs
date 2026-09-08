using System;
using System.IO;
using TTC.CadTools.Core.Configuration;
using TTC.CadTools.Infrastructure.Configuration;
using Xunit;

namespace TTC.CadTools.Tests.SettingsTests
{
    public class SettingsRepositoryTests : IDisposable
    {
        private readonly string _tempDir;

        public SettingsRepositoryTests()
        {
            _tempDir = Path.Combine(Path.GetTempPath(), "TTC_Test_Settings_" + Guid.NewGuid().ToString("N"));
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

        [Fact]
        public void ValidSettings_DeserializesCleanly_StatusIsValid()
        {
            string userFile = Path.Combine(_tempDir, "user_settings.json");
            File.WriteAllText(userFile, @"{
  ""schemaVersion"": ""1.0"",
  ""environment"": ""Testing"",
  ""logging"": {
    ""logLevel"": ""Debug"",
    ""retentionDays"": 14,
    ""logDirectory"": ""C:\\Logs""
  },
  ""ui"": {
    ""ribbonAutoLoad"": true,
    ""paletteAutoOpen"": true
  }
}");

            var repo = new JsonSettingsRepository(userFile, null);

            Assert.Equal(ConfigurationStatus.Valid, repo.Status.Status);
            Assert.Equal("1.0", repo.CurrentSettings.SchemaVersion);
            Assert.Equal("Testing", repo.CurrentSettings.Environment);
            Assert.Equal("Debug", repo.CurrentSettings.Logging.LogLevel);
            Assert.Equal(14, repo.CurrentSettings.Logging.RetentionDays);
            Assert.True(repo.CurrentSettings.Ui.PaletteAutoOpen);
        }

        [Fact]
        public void MissingSettings_FallsBackToInMemoryDefaults()
        {
            string nonExistentUser = Path.Combine(_tempDir, "no_such_user.json");
            string nonExistentBundle = Path.Combine(_tempDir, "no_such_bundle.json");

            var repo = new JsonSettingsRepository(nonExistentUser, nonExistentBundle);

            Assert.Equal(ConfigurationStatus.FallbackDefault, repo.Status.Status);
            Assert.Equal("1.0", repo.CurrentSettings.SchemaVersion);
            Assert.Equal("Production", repo.CurrentSettings.Environment);
            Assert.Equal("Information", repo.CurrentSettings.Logging.LogLevel);
            Assert.Equal(7, repo.CurrentSettings.Logging.RetentionDays);
        }

        [Fact]
        public void MalformedJson_ReturnsInvalidStatus_AndFallsBackToDefaults()
        {
            string badFile = Path.Combine(_tempDir, "bad.json");
            File.WriteAllText(badFile, "{ broken json {{(");

            var repo = new JsonSettingsRepository(badFile, null);

            Assert.Equal(ConfigurationStatus.Invalid, repo.Status.Status);
            Assert.Contains("Malformed JSON", repo.Status.ErrorMessage);
            Assert.Equal("Production", repo.CurrentSettings.Environment);
            Assert.Equal(7, repo.CurrentSettings.Logging.RetentionDays);
        }

        [Fact]
        public void InvalidLogLevel_ReturnsInvalidStatus()
        {
            string badFile = Path.Combine(_tempDir, "bad_level.json");
            File.WriteAllText(badFile, @"{
  ""schemaVersion"": ""1.0"",
  ""environment"": ""Production"",
  ""logging"": {
    ""logLevel"": ""NonExistentLevel"",
    ""retentionDays"": 7
  }
}");

            var repo = new JsonSettingsRepository(badFile, null);

            Assert.Equal(ConfigurationStatus.Invalid, repo.Status.Status);
            Assert.Contains("Invalid 'logging.logLevel'", repo.Status.ErrorMessage);
            Assert.Equal(7, repo.CurrentSettings.Logging.RetentionDays);
        }

        [Fact]
        public void InvalidRetentionDays_LessThanOne_ReturnsInvalidStatus()
        {
            string badFile = Path.Combine(_tempDir, "bad_retention.json");
            File.WriteAllText(badFile, @"{
  ""schemaVersion"": ""1.0"",
  ""environment"": ""Production"",
  ""logging"": {
    ""logLevel"": ""Information"",
    ""retentionDays"": 0
  }
}");

            var repo = new JsonSettingsRepository(badFile, null);

            Assert.Equal(ConfigurationStatus.Invalid, repo.Status.Status);
            Assert.Contains("Invalid 'logging.retentionDays'", repo.Status.ErrorMessage);
            Assert.Equal(7, repo.CurrentSettings.Logging.RetentionDays);
        }

        [Fact]
        public void ResolutionPrecedence_UserOverridesBundle()
        {
            string bundleFile = Path.Combine(_tempDir, "bundle_settings.json");
            File.WriteAllText(bundleFile, @"{
  ""schemaVersion"": ""1.0"",
  ""environment"": ""BundleEnv"",
  ""logging"": { ""logLevel"": ""Warning"", ""retentionDays"": 3 }
}");

            string userFile = Path.Combine(_tempDir, "user_settings.json");
            File.WriteAllText(userFile, @"{
  ""schemaVersion"": ""1.0"",
  ""environment"": ""UserEnv"",
  ""logging"": { ""logLevel"": ""Debug"", ""retentionDays"": 10 }
}");

            var repo = new JsonSettingsRepository(userFile, bundleFile);

            Assert.Equal(ConfigurationStatus.Valid, repo.Status.Status);
            Assert.Equal("UserEnv", repo.CurrentSettings.Environment);
            Assert.Equal("Debug", repo.CurrentSettings.Logging.LogLevel);
            Assert.Equal(10, repo.CurrentSettings.Logging.RetentionDays);
        }

        [Fact]
        public void ResolutionPrecedence_FallsBackToBundle_WhenUserMissing()
        {
            string bundleFile = Path.Combine(_tempDir, "bundle_settings.json");
            File.WriteAllText(bundleFile, @"{
  ""schemaVersion"": ""1.0"",
  ""environment"": ""BundleEnv"",
  ""logging"": { ""logLevel"": ""Warning"", ""retentionDays"": 3 }
}");

            string missingUser = Path.Combine(_tempDir, "no_user.json");

            var repo = new JsonSettingsRepository(missingUser, bundleFile);

            Assert.Equal(ConfigurationStatus.Valid, repo.Status.Status);
            Assert.Equal("BundleEnv", repo.CurrentSettings.Environment);
            Assert.Equal("Warning", repo.CurrentSettings.Logging.LogLevel);
            Assert.Equal(3, repo.CurrentSettings.Logging.RetentionDays);
        }
    }
}
