using Autodesk.AutoCAD.Runtime;
using TTC.CadTools.AutoCAD.Entry;
using TTC.CadTools.AutoCAD.UI;

namespace TTC.CadTools.AutoCAD.Commands
{
    public class PaletteCommand
    {
        [CommandMethod("TTCPALETTE", CommandFlags.Session | CommandFlags.Modal)]
        public void Execute()
        {
            try
            {
                if (!PluginApplication.IsCoreConsole)
                {
                    PaletteHost.ToggleVisibility();
                }
                else
                {
                    PluginApplication.Logger?.Info("TTCPALETTE invoked in headless core console; PaletteSet deferred.");
                }
            }
            catch (System.Exception ex)
            {
                PluginApplication.Logger?.Error($"Error toggling TTCPALETTE: {ex.Message}", ex);
            }
        }
    }
}
