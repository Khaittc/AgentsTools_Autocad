using System;

namespace TTC.CadTools.Core.Configuration
{
    public class Settings
    {
        public string SchemaVersion { get; set; } = "1.0";
        public string Environment { get; set; } = "Production";
        public LoggingSettings Logging { get; set; } = new LoggingSettings();
        public UiSettings Ui { get; set; } = new UiSettings();

        public static Settings CreateDefault()
        {
            return new Settings
            {
                SchemaVersion = "1.0",
                Environment = "Production",
                Logging = new LoggingSettings
                {
                    LogLevel = "Information",
                    RetentionDays = 7,
                    LogDirectory = ""
                },
                Ui = new UiSettings
                {
                    RibbonAutoLoad = true,
                    PaletteAutoOpen = false
                }
            };
        }
    }

    public class LoggingSettings
    {
        public string LogLevel { get; set; } = "Information";
        public int RetentionDays { get; set; } = 7;
        public string LogDirectory { get; set; } = "";
    }

    public class UiSettings
    {
        public bool RibbonAutoLoad { get; set; } = true;
        public bool PaletteAutoOpen { get; set; } = false;
    }
}
