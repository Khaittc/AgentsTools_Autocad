using System;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.Windows;
using TTC.CadTools.Core.Commands;
using TTC.CadTools.Core.Logging;

namespace TTC.CadTools.AutoCAD.UI
{
    public static class RibbonHost
    {
        private static ILogger? _logger;
        private static bool _ribbonCreated;
        private const string TabId = "TTC_CAD_TAB";
        private const string TabTitle = "TTC CAD";
        private const string PanelId = "TTC_GENERAL_PANEL";
        private const string PanelTitle = "General";

        public static bool IsRibbonCreated => _ribbonCreated;

        public static void Initialize(ILogger logger)
        {
            _logger = logger;

            try
            {
                if (ComponentManager.Ribbon != null)
                {
                    CreateRibbonShell();
                }
                else
                {
                    _logger?.Info("Ribbon not ready at startup; deferring to ComponentManager.ItemInitialized.");
                    ComponentManager.ItemInitialized += ComponentManager_ItemInitialized;
                }

                // Hook workspace change to restore tab if needed
                Application.SystemVariableChanged += Application_SystemVariableChanged;
            }
            catch (Exception ex)
            {
                _logger?.Warn($"RibbonHost initialization deferred/skipped: {ex.Message}");
            }
        }

        private static void ComponentManager_ItemInitialized(object? sender, RibbonItemEventArgs e)
        {
            if (ComponentManager.Ribbon != null)
            {
                ComponentManager.ItemInitialized -= ComponentManager_ItemInitialized;
                CreateRibbonShell();
            }
        }

        private static void Application_SystemVariableChanged(object sender, SystemVariableChangedEventArgs e)
        {
            if (string.Equals(e.Name, "WSCURRENT", StringComparison.OrdinalIgnoreCase))
            {
                _logger?.Info("Workspace changed; verifying TTC CAD ribbon shell.");
                CreateRibbonShell();
            }
        }

        public static void CreateRibbonShell()
        {
            var ribbon = ComponentManager.Ribbon;
            if (ribbon == null)
                return;

            try
            {
                // Check if tab already exists
                RibbonTab? tab = null;
                foreach (var t in ribbon.Tabs)
                {
                    if (t.Id == TabId || t.Title == TabTitle)
                    {
                        tab = t;
                        break;
                    }
                }

                if (tab == null)
                {
                    tab = new RibbonTab
                    {
                        Title = TabTitle,
                        Id = TabId
                    };
                    ribbon.Tabs.Add(tab);
                }

                // Check if panel already exists
                RibbonPanel? panel = null;
                foreach (var p in tab.Panels)
                {
                    if (p.Source != null && (p.Source.Id == PanelId || p.Source.Title == PanelTitle))
                    {
                        panel = p;
                        break;
                    }
                }

                if (panel == null)
                {
                    var panelSource = new RibbonPanelSource
                    {
                        Title = PanelTitle,
                        Id = PanelId
                    };

                    // Button 1: TTCINFO
                    var btnInfo = new RibbonButton
                    {
                        Text = "TTCINFO\nDiagnostics",
                        ShowText = true,
                        ShowImage = false,
                        Size = RibbonItemSize.Large,
                        Orientation = System.Windows.Controls.Orientation.Vertical,
                        CommandParameter = "TTCINFO ",
                        CommandHandler = new RibbonCommandHandler()
                    };

                    // Button 2: TTCPALETTE
                    var btnPalette = new RibbonButton
                    {
                        Text = "TTCPALETTE\nShow/Hide",
                        ShowText = true,
                        ShowImage = false,
                        Size = RibbonItemSize.Large,
                        Orientation = System.Windows.Controls.Orientation.Vertical,
                        CommandParameter = "TTCPALETTE ",
                        CommandHandler = new RibbonCommandHandler()
                    };

                    panelSource.Items.Add(btnInfo);
                    panelSource.Items.Add(btnPalette);

                    panel = new RibbonPanel { Source = panelSource };
                    tab.Panels.Add(panel);
                }

                _ribbonCreated = true;
                _logger?.Info("Ribbon shell created: Tab 'TTC CAD', Panel 'General'.");
            }
            catch (Exception ex)
            {
                _logger?.Warn($"Failed to create ribbon shell: {ex.Message}");
            }
        }

        public static void Terminate()
        {
            try
            {
                ComponentManager.ItemInitialized -= ComponentManager_ItemInitialized;
                Application.SystemVariableChanged -= Application_SystemVariableChanged;
            }
            catch { }
            _ribbonCreated = false;
        }

        private class RibbonCommandHandler : System.Windows.Input.ICommand
        {
            public bool CanExecute(object? parameter) => true;
            public event EventHandler? CanExecuteChanged { add { } remove { } }

            public void Execute(object? parameter)
            {
                string? candidate = null;
                string paramTypeName = parameter?.GetType().FullName ?? "null";

                if (parameter is RibbonCommandItem ribbonItem)
                {
                    candidate = ribbonItem.CommandParameter as string;
                    if (string.IsNullOrWhiteSpace(candidate))
                    {
                        candidate = ribbonItem.Id;
                    }
                }
                else if (parameter is string directString)
                {
                    candidate = directString;
                }

                if (!RibbonCommandResolver.TryResolveCommand(candidate ?? parameter, out string command))
                {
                    _logger?.Warn($"Ribbon command dispatch rejected: parameter type '{paramTypeName}', candidate '{candidate}'. Supported commands: TTCINFO, TTCPALETTE.");
                    return;
                }

                _logger?.Info($"Ribbon command requested: '{command}' (source type: {paramTypeName}).");

                try
                {
                    var doc = Application.DocumentManager.MdiActiveDocument;
                    if (doc != null)
                    {
                        _logger?.Info($"Dispatching '{command}' to active document context.");
                        doc.SendStringToExecute(command + " ", true, false, false);
                    }
                    else
                    {
                        _logger?.Info($"Dispatching '{command}' to zero-document application context.");
                        if (string.Equals(command, RibbonCommandResolver.TtcInfo, StringComparison.OrdinalIgnoreCase))
                        {
                            Commands.InfoCommand.ExecuteApplicationContextInfo();
                        }
                        else if (string.Equals(command, RibbonCommandResolver.TtcPalette, StringComparison.OrdinalIgnoreCase))
                        {
                            PaletteHost.ToggleVisibility();
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger?.Error($"Exception dispatching ribbon command '{command}': {ex.Message}", ex);
                }
            }
        }
    }
}
