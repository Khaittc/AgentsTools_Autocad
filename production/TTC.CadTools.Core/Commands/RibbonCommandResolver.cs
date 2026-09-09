using System;
using System.Linq;
using System.Reflection;

namespace TTC.CadTools.Core.Commands
{
    /// <summary>
    /// Pure, host-decoupled command resolver for Ribbon and UI command dispatch.
    /// Free of any Autodesk/AutoCAD references to enable full automated unit testing.
    /// </summary>
    public static class RibbonCommandResolver
    {
        public const string TtcInfo = "TTCINFO";
        public const string TtcPalette = "TTCPALETTE";

        public static readonly string[] AllowedCommands = new[]
        {
            TtcInfo,
            TtcPalette
        };

        /// <summary>
        /// Attempts to extract and normalize an allowed command name from a callback parameter.
        /// Supports direct strings, objects with a CommandParameter property (e.g. RibbonCommandItem),
        /// or objects with an Id property.
        /// </summary>
        public static bool TryResolveCommand(object? parameter, out string resolvedCommand)
        {
            resolvedCommand = string.Empty;
            if (parameter == null)
                return false;

            string? candidate = null;

            if (parameter is string directString)
            {
                candidate = directString;
            }
            else
            {
                // Inspect CommandParameter property via reflection (avoids referencing Autodesk.Windows in Core)
                PropertyInfo? cmdParamProp = parameter.GetType().GetProperty("CommandParameter");
                if (cmdParamProp != null)
                {
                    candidate = cmdParamProp.GetValue(parameter)?.ToString();
                }

                if (string.IsNullOrWhiteSpace(candidate))
                {
                    PropertyInfo? idProp = parameter.GetType().GetProperty("Id");
                    if (idProp != null)
                    {
                        candidate = idProp.GetValue(parameter)?.ToString();
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(candidate))
                return false;

            string trimmed = candidate!.Trim();

            // Match against allowed whitelist (case-insensitive)
            foreach (var allowed in AllowedCommands)
            {
                if (string.Equals(trimmed, allowed, StringComparison.OrdinalIgnoreCase))
                {
                    resolvedCommand = allowed;
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Validates whether a command name is an allowed F0 command.
        /// </summary>
        public static bool IsAllowedCommand(string? commandName)
        {
            if (string.IsNullOrWhiteSpace(commandName))
                return false;

            string trimmed = commandName!.Trim();
            return AllowedCommands.Any(a => string.Equals(trimmed, a, StringComparison.OrdinalIgnoreCase));
        }
    }
}
