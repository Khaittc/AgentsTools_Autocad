using System;
using System.Reflection;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;
using TTC.CadTools.AutoCAD.Entry;
using TTC.CadTools.AutoCAD.UI;
using TTC.CadTools.Infrastructure.Logging;

namespace TTC.CadTools.AutoCAD.Commands
{
    public class InfoCommand
    {
        [CommandMethod("TTCINFO", CommandFlags.Session | CommandFlags.Modal)]
        public void Execute()
        {
            var logger = PluginApplication.Logger;
            var settingsRepo = PluginApplication.SettingsRepo;

            try
            {
                string report = BuildDiagnosticReport(settingsRepo, logger ?? new FileLogger());

                var doc = Application.DocumentManager.MdiActiveDocument;
                if (doc != null)
                {
                    Editor ed = doc.Editor;
                    ed.WriteMessage("\n" + report + "\n");
                    logger?.Info("TTCINFO executed in active document context.");
                }
                else
                {
                    ExecuteApplicationContextInfo(report);
                }
            }
            catch (System.Exception ex)
            {
                logger?.Error($"Error executing TTCINFO: {ex.Message}", ex);
            }
        }

        public static void ExecuteApplicationContextInfo()
        {
            string report = BuildDiagnosticReport(PluginApplication.SettingsRepo, PluginApplication.Logger);
            ExecuteApplicationContextInfo(report);
        }

        public static void ExecuteApplicationContextInfo(string report)
        {
            var logger = PluginApplication.Logger;
            logger?.Info("INFO: TTCINFO executed in application context; zero documents open");
            logger?.Info(report);

            try
            {
                if (!PluginApplication.IsCoreConsole && System.Environment.UserInteractive)
                {
                    Application.ShowAlertDialog(report);
                }
            }
            catch (System.Exception ex)
            {
                logger?.Warn($"ShowAlertDialog unavailable: {ex.Message}");
            }
        }

        public static string BuildDiagnosticReport(Core.Configuration.ISettingsRepository settingsRepo, Core.Logging.ILogger logger)
        {
            string acadVersion = PluginApplication.IsCoreConsole
                ? "24.2.53.0 (AutoCAD 2023 Core Engine)"
                : GetAcadVersion();

            string asmVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0.0";
            string clrVersion = Environment.Version.ToString();
            string configStatus = settingsRepo?.Status.ToString() ?? "Unknown";
            string logPath = logger is FileLogger fl ? fl.ActiveLogPath : "Active";

            string paletteStatus = PluginApplication.IsCoreConsole
                ? "Deferred (Headless Core Console)"
                : GetPaletteStatus();

            string ribbonStatus = PluginApplication.IsCoreConsole
                ? "Deferred (Headless Core Console)"
                : GetRibbonStatus();

            return @"
================== TTC CAD INFO ==================
  AutoCAD Host Version:  " + acadVersion + @"
  Plugin Assembly:       " + asmVersion + @" (F0 Foundation)
  CLR Runtime:           " + clrVersion + @" (.NET 4.8)
  Configuration Status:  " + configStatus + @"
  Active Log File:       " + logPath + @"
  PaletteSet Shell:      " + paletteStatus + @"
  Ribbon Shell:          " + ribbonStatus + @"
  Repository Status:     ISettingsRepository [READY]
                         IComponentRepository [DEFERRED TO P1]
                         ICabinetRepository [DEFERRED TO P1]
==================================================";
        }

        [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
        private static string GetAcadVersion()
        {
            try
            {
                return Application.Version.ToString() + " (AutoCAD 2023)";
            }
            catch
            {
                return "24.2 (AutoCAD 2023)";
            }
        }

        [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
        private static string GetPaletteStatus()
        {
            try
            {
                return PaletteHost.IsInitialized
                    ? (PaletteHost.IsVisible ? "Active (Visible)" : "Initialized (Hidden)")
                    : "Not Initialized";
            }
            catch (System.Exception ex)
            {
                return $"Unavailable ({ex.Message})";
            }
        }

        [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
        private static string GetRibbonStatus()
        {
            try
            {
                return RibbonHost.IsRibbonCreated
                    ? "Active (Tab: TTC CAD)"
                    : "Deferred / Not Created";
            }
            catch (System.Exception ex)
            {
                return $"Unavailable ({ex.Message})";
            }
        }
    }
}
