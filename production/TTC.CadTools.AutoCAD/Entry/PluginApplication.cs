using System;
using Autodesk.AutoCAD.Runtime;
using TTC.CadTools.AutoCAD.Entry;
using TTC.CadTools.AutoCAD.UI;
using TTC.CadTools.Core.Configuration;
using TTC.CadTools.Core.Logging;
using TTC.CadTools.Infrastructure.Configuration;
using TTC.CadTools.Infrastructure.Logging;

[assembly: ExtensionApplication(typeof(PluginApplication))]
[assembly: CommandClass(typeof(TTC.CadTools.AutoCAD.Commands.InfoCommand))]
[assembly: CommandClass(typeof(TTC.CadTools.AutoCAD.Commands.PaletteCommand))]

namespace TTC.CadTools.AutoCAD.Entry
{
    public class PluginApplication : IExtensionApplication
    {
        private static bool _initialized;
        private static ILogger _logger = new FileLogger();
        private static ISettingsRepository _settingsRepo = new JsonSettingsRepository();

        public static ILogger Logger => _logger;
        public static ISettingsRepository SettingsRepo => _settingsRepo;

        public static bool IsCoreConsole
        {
            get
            {
                try
                {
                    string procName = System.Diagnostics.Process.GetCurrentProcess().ProcessName;
                    return procName.IndexOf("accoreconsole", StringComparison.OrdinalIgnoreCase) >= 0;
                }
                catch
                {
                    return false;
                }
            }
        }

        public void Initialize()
        {
            if (_initialized)
            {
                _logger.Warn("WARN: Initialize() called on already initialized plugin instance.");
                return;
            }

            try
            {
                _logger = new FileLogger();
                _settingsRepo = new JsonSettingsRepository();

                _logger.Info("==================================================");
                _logger.Info("TTC CAD Plugin Initializing (F0 Foundation v1.0.0)");
                string displayLogPath = ((FileLogger)_logger).ActiveLogPath;
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                if (!string.IsNullOrEmpty(appData) && displayLogPath.StartsWith(appData, StringComparison.OrdinalIgnoreCase))
                {
                    displayLogPath = "%APPDATA%" + displayLogPath.Substring(appData.Length);
                }
                _logger.Info($"Active Log File: {displayLogPath}");
                ConfigurationStatusLogger.LogStatus(_logger, _settingsRepo.Status);

                if (!IsCoreConsole)
                {
                    // Initialize Ribbon Shell
                    RibbonHost.Initialize(_logger);

                    // Initialize Palette Shell
                    PaletteHost.Initialize(_logger, _settingsRepo);

                    // Auto-open palette if configured
                    if (_settingsRepo.CurrentSettings.Ui.PaletteAutoOpen)
                    {
                        PaletteHost.EnsureCreated();
                    }
                }
                else
                {
                    _logger.Info("Headless Core Console detected: Ribbon and PaletteSet UI shells deferred.");
                }

                _initialized = true;
                _logger.Info("TTC CAD Plugin Initialized Successfully.");
                _logger.Info("==================================================");
            }
            catch (System.Exception ex)
            {
                try
                {
                    _logger.Error($"FATAL: Unhandled exception during plugin startup: {ex.Message}", ex);
                }
                catch { }
            }
        }

        public void Terminate()
        {
            try
            {
                _logger.Info("TTC CAD Plugin Terminating.");
                if (!IsCoreConsole)
                {
                    RibbonHost.Terminate();
                    PaletteHost.Terminate();
                }
                ((FileLogger)_logger).Flush();
            }
            catch { }
            finally
            {
                _initialized = false;
            }
        }
    }
}
