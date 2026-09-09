using System;
using TTC.CadTools.Core.Logging;

namespace TTC.CadTools.Core.Configuration
{
    public static class ConfigurationStatusLogger
    {
        public static void LogStatus(ILogger logger, ConfigurationResult result)
        {
            if (logger == null || result == null) return;

            switch (result.Status)
            {
                case ConfigurationStatus.Valid:
                    logger.Info($"Configuration loaded successfully (Source: {result.Source}).");
                    break;
                case ConfigurationStatus.Invalid:
                    logger.Warn($"WARN: Configuration invalid; using safe defaults. Source: {result.Source}, Error: {result.ErrorMessage}");
                    break;
                case ConfigurationStatus.FallbackDefault:
                    logger.Warn($"WARN: settings.json not found; using in-memory defaults. Source: {result.Source}");
                    break;
            }
        }
    }
}
