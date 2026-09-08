using System;
using System.IO;
using System.Linq;
using System.Reflection;
using TTC.CadTools.Core.Configuration;
using TTC.CadTools.Infrastructure.Configuration;
using Xunit;

namespace TTC.CadTools.Tests.ScopeTests
{
    public class ScopeContainmentTests
    {
        [Fact]
        public void CoreAndInfrastructure_ContainNoDownstreamEngineeringTypes()
        {
            var assemblies = new[]
            {
                typeof(Settings).Assembly,
                typeof(JsonSettingsRepository).Assembly
            };

            string[] forbiddenSubstrings = new[]
            {
                "Component",
                "Cabinet",
                "Rail",
                "Duct",
                "PanelCheck",
                "PanelSize",
                "PanelPlace",
                "Tray",
                "Eplan",
                "Collision",
                "IComponentRepository",
                "ICabinetRepository",
                "ITrayRepository"
            };

            foreach (var asm in assemblies)
            {
                Type[] types = asm.GetExportedTypes();
                foreach (var t in types)
                {
                    string typeName = t.Name;
                    bool isForbidden = forbiddenSubstrings.Any(s => typeName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0);
                    Assert.False(isForbidden, $"Assembly {asm.GetName().Name} contains prohibited type: {typeName}");
                }
            }
        }

        [Fact]
        public void SourceTree_ContainsNoDownstreamDomainClasses()
        {
            string prodDir = Path.GetFullPath(Path.Combine(
                AppDomain.CurrentDomain.BaseDirectory,
                "..", "..", "..", "..", "production"));

            var csFiles = Directory.GetFiles(prodDir, "*.cs", SearchOption.AllDirectories)
                .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("TTC.CadTools.Tests"))
                .ToList();

            string[] forbiddenTokens = new[]
            {
                "class Component",
                "interface IComponentRepository",
                "interface ICabinetRepository",
                "interface ITrayRepository",
                "class Rail",
                "class Duct",
                "class PanelCheck",
                "class PanelSize",
                "class PanelPlace",
                "class CableTray",
                "TTCPANELPLACE",
                "TTCPANELCHECK",
                "TTCPANELSIZE",
                "TTCRAIL",
                "TTCDUCT"
            };

            foreach (var file in csFiles)
            {
                string text = File.ReadAllText(file);
                foreach (var token in forbiddenTokens)
                {
                    bool found = text.IndexOf(token, StringComparison.OrdinalIgnoreCase) >= 0;
                    Assert.False(found, $"File {Path.GetFileName(file)} contains prohibited downstream token: {token}");
                }
            }
        }
    }
}
