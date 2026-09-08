using System;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.Windows;
using TTC.CadTools.Core.Configuration;
using TTC.CadTools.Core.Logging;

namespace TTC.CadTools.AutoCAD.UI
{
    public static class PaletteHost
    {
        private static readonly Guid PaletteGuid = new Guid("4A7A779F-9C3D-4A42-A862-2D5392D6D3A0");
        private static PaletteSet? _paletteSet;
        private static StatusControl? _statusControl;
        private static ILogger? _logger;
        private static ISettingsRepository? _settingsRepo;
        private static readonly object _lock = new object();

        public static bool IsInitialized => _paletteSet != null;
        public static bool IsVisible => _paletteSet != null && _paletteSet.Visible;

        public static void Initialize(ILogger logger, ISettingsRepository settingsRepo)
        {
            _logger = logger;
            _settingsRepo = settingsRepo;

            // Subscribe document manager events for zero-document safety
            try
            {
                var dm = Application.DocumentManager;
                dm.DocumentActivated += OnDocumentActivated;
                dm.DocumentDestroyed += OnDocumentDestroyed;
                dm.DocumentCreated += OnDocumentCreated;
                dm.DocumentToBeDeactivated += OnDocumentToBeDeactivated;
            }
            catch (Exception ex)
            {
                _logger?.Warn($"Failed to hook DocumentManager events: {ex.Message}");
            }
        }

        public static void EnsureCreated()
        {
            if (_paletteSet != null)
                return;

            lock (_lock)
            {
                if (_paletteSet != null)
                    return;

                _paletteSet = new PaletteSet("TTC CAD Tools", PaletteGuid);
                _paletteSet.Style = PaletteSetStyles.ShowAutoHideButton |
                                    PaletteSetStyles.ShowCloseButton |
                                    PaletteSetStyles.Snappable;
                _paletteSet.MinimumSize = new System.Drawing.Size(250, 200);

                _statusControl = new StatusControl();
                // 3-parameter overload with automatic resizing
                _paletteSet.AddVisual("Status", _statusControl, true);

                UpdateStatusView();
                _logger?.Info("PaletteSet shell created with GUID 4A7A779F-9C3D-4A42-A862-2D5392D6D3A0");
            }
        }

        public static void ToggleVisibility()
        {
            EnsureCreated();
            if (_paletteSet == null)
                return;

            _paletteSet.Visible = !_paletteSet.Visible;
            if (_paletteSet.Visible)
            {
                UpdateStatusView();
            }
            _logger?.Info($"TTCPALETTE toggled visibility: {(_paletteSet.Visible ? "Visible" : "Hidden")}");
        }

        public static void UpdateStatusView()
        {
            if (_statusControl == null)
                return;

            string docName = Application.DocumentManager.MdiActiveDocument?.Name ?? string.Empty;
            _statusControl.SetDocumentStatus(docName);

            string configStatus = _settingsRepo?.Status.ToString() ?? "Unknown";
            string logPath = _logger is Infrastructure.Logging.FileLogger fl ? fl.ActiveLogPath : "Active";
            string version = "1.0.0.0 (F0 Foundation)";

            _statusControl.SetDiagnostics(configStatus, logPath, version);
        }

        private static void OnDocumentActivated(object sender, DocumentCollectionEventArgs e)
        {
            try
            {
                string name = e.Document?.Name ?? string.Empty;
                _statusControl?.SetDocumentStatus(name);
                _logger?.Debug($"Document activated: {name}");
            }
            catch (Exception ex)
            {
                _logger?.Warn($"Error in OnDocumentActivated: {ex.Message}");
            }
        }

        private static void OnDocumentCreated(object sender, DocumentCollectionEventArgs e)
        {
            try
            {
                string name = e.Document?.Name ?? string.Empty;
                _statusControl?.SetDocumentStatus(name);
            }
            catch { }
        }

        private static void OnDocumentToBeDeactivated(object sender, DocumentCollectionEventArgs e)
        {
            // Safeguard: do not touch active drawing database during switch
        }

        private static void OnDocumentDestroyed(object sender, DocumentDestroyedEventArgs e)
        {
            try
            {
                // Check if any document remains
                if (Application.DocumentManager.MdiActiveDocument == null || Application.DocumentManager.Count <= 1)
                {
                    _statusControl?.SetDocumentStatus(string.Empty);
                    _logger?.Info("Last document closed; PaletteSet transitioned to zero-document state.");
                }
            }
            catch (Exception ex)
            {
                _logger?.Warn($"Error in OnDocumentDestroyed: {ex.Message}");
            }
        }

        public static void Terminate()
        {
            try
            {
                var dm = Application.DocumentManager;
                dm.DocumentActivated -= OnDocumentActivated;
                dm.DocumentDestroyed -= OnDocumentDestroyed;
                dm.DocumentCreated -= OnDocumentCreated;
                dm.DocumentToBeDeactivated -= OnDocumentToBeDeactivated;
            }
            catch { }

            if (_paletteSet != null)
            {
                try
                {
                    _paletteSet.Visible = false;
                    _paletteSet.Dispose();
                }
                catch { }
                _paletteSet = null;
                _statusControl = null;
            }
        }
    }
}
