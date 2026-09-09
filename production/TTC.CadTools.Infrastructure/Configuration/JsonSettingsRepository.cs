using System;
using System.IO;
using System.Reflection;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TTC.CadTools.Core.Configuration;
using TTC.CadTools.Core.Logging;

namespace TTC.CadTools.Infrastructure.Configuration
{
    public class JsonSettingsRepository : ISettingsRepository
    {
        private readonly string? _customUserFilePath;
        private readonly string? _customBundleFilePath;
        private Settings _currentSettings = Settings.CreateDefault();
        private ConfigurationResult _status = new ConfigurationResult
        {
            Status = ConfigurationStatus.FallbackDefault,
            Source = "Default In-Memory"
        };

        public Settings CurrentSettings => _currentSettings;
        public ConfigurationResult Status => _status;

        public JsonSettingsRepository() : this(null, null)
        {
        }

        public JsonSettingsRepository(string? customUserFilePath, string? customBundleFilePath)
        {
            _customUserFilePath = customUserFilePath;
            _customBundleFilePath = customBundleFilePath;
            Reload();
        }

        public void Reload()
        {
            // 1. Resolve user path
            string userPath = _customUserFilePath ?? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "TTC_CadTools",
                "settings.json");

            if (File.Exists(userPath))
            {
                if (TryLoadFromFile(userPath, "AppData", out Settings? userSettings, out string? error))
                {
                    _currentSettings = userSettings!;
                    _status = new ConfigurationResult
                    {
                        Status = ConfigurationStatus.Valid,
                        Source = "AppData"
                    };
                    return;
                }
                else
                {
                    _currentSettings = Settings.CreateDefault();
                    _status = new ConfigurationResult
                    {
                        Status = ConfigurationStatus.Invalid,
                        Source = $"AppData ({SanitizePath(userPath)})",
                        ErrorMessage = error
                    };
                    return;
                }
            }

            // 2. Resolve bundle path
            string? bundlePath = _customBundleFilePath ?? ResolveBundleSettingsPath();
            if (!string.IsNullOrEmpty(bundlePath) && File.Exists(bundlePath))
            {
                if (TryLoadFromFile(bundlePath!, "Bundle", out Settings? bundleSettings, out string? error))
                {
                    _currentSettings = bundleSettings!;
                    _status = new ConfigurationResult
                    {
                        Status = ConfigurationStatus.Valid,
                        Source = "Bundle"
                    };
                    return;
                }
                else
                {
                    _currentSettings = Settings.CreateDefault();
                    _status = new ConfigurationResult
                    {
                        Status = ConfigurationStatus.Invalid,
                        Source = $"Bundle ({SanitizePath(bundlePath)})",
                        ErrorMessage = error
                    };
                    return;
                }
            }

            // 3. Fallback to in-memory defaults
            _currentSettings = Settings.CreateDefault();
            _status = new ConfigurationResult
            {
                Status = ConfigurationStatus.FallbackDefault,
                Source = "In-Memory Defaults",
                ErrorMessage = "settings.json not found on disk."
            };
        }

        private static string? ResolveBundleSettingsPath()
        {
            try
            {
                string asmLocation = Assembly.GetExecutingAssembly().Location;
                if (string.IsNullOrEmpty(asmLocation))
                    return null;

                string asmDir = Path.GetDirectoryName(asmLocation) ?? string.Empty;

                // Direct relative check: Contents\Resources\settings.json
                string candidate1 = Path.Combine(asmDir, "Resources", "settings.json");
                if (File.Exists(candidate1)) return candidate1;

                // Parent bundle check: ..\Resources\settings.json
                string candidate2 = Path.Combine(asmDir, "..", "Resources", "settings.json");
                if (File.Exists(candidate2)) return Path.GetFullPath(candidate2);

                return null;
            }
            catch
            {
                return null;
            }
        }

        private static bool TryLoadFromFile(string filePath, string sourceName, out Settings? settings, out string? error)
        {
            settings = null;
            error = null;

            try
            {
                string json = File.ReadAllText(filePath);
                if (string.IsNullOrWhiteSpace(json))
                {
                    error = "File is empty.";
                    return false;
                }

                // Check JSON structure & required fields via JObject
                JObject jObj = JObject.Parse(json);

                var schemaVerToken = jObj["schemaVersion"];
                if (schemaVerToken == null || string.IsNullOrWhiteSpace(schemaVerToken.ToString()))
                {
                    error = "Missing or empty 'schemaVersion'.";
                    return false;
                }

                var loggingToken = jObj["logging"];
                if (loggingToken == null || !(loggingToken is JObject logObj))
                {
                    error = "Missing 'logging' section.";
                    return false;
                }

                var logLevelToken = logObj["logLevel"];
                if (logLevelToken == null || !Enum.TryParse<LogLevel>(logLevelToken.ToString(), true, out _))
                {
                    error = $"Invalid 'logging.logLevel': {logLevelToken?.ToString()}";
                    return false;
                }

                var retentionToken = logObj["retentionDays"];
                if (retentionToken == null || !int.TryParse(retentionToken.ToString(), out int retention) || retention < 1)
                {
                    error = $"Invalid 'logging.retentionDays' (must be >= 1): {retentionToken?.ToString()}";
                    return false;
                }

                settings = JsonConvert.DeserializeObject<Settings>(json);
                if (settings == null)
                {
                    error = "Deserialization returned null.";
                    return false;
                }

                return true;
            }
            catch (JsonException jEx)
            {
                error = $"Malformed JSON: {jEx.Message}";
                return false;
            }
            catch (Exception ex)
            {
                error = $"IO/General error: {ex.Message}";
                return false;
            }
        }

        private static string SanitizePath(string? path)
        {
            if (string.IsNullOrEmpty(path)) return string.Empty;
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            if (!string.IsNullOrEmpty(appData) && path != null && path.StartsWith(appData, StringComparison.OrdinalIgnoreCase))
            {
                return "%APPDATA%" + path.Substring(appData.Length);
            }
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            if (!string.IsNullOrEmpty(userProfile) && path != null && path.StartsWith(userProfile, StringComparison.OrdinalIgnoreCase))
            {
                return "%USERPROFILE%" + path.Substring(userProfile.Length);
            }
            return path ?? string.Empty;
        }
    }
}
