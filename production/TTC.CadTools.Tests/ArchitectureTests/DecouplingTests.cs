using System;
using System.Linq;
using System.Reflection;
using TTC.CadTools.Core.Logging;
using TTC.CadTools.Infrastructure.Logging;
using Xunit;

namespace TTC.CadTools.Tests.ArchitectureTests
{
    public class DecouplingTests
    {
        [Fact]
        public void CoreAssembly_HasZeroAutoCADReferences()
        {
            Assembly coreAssembly = typeof(ILogger).Assembly;
            AssemblyName[] referencedAssemblies = coreAssembly.GetReferencedAssemblies();

            string[] forbiddenPrefixes = new[]
            {
                "accoremgd",
                "acdbmgd",
                "acmgd",
                "adwindows",
                "accui",
                "autodesk.autocad",
                "autodesk.windows"
            };

            foreach (var refName in referencedAssemblies)
            {
                string nameLower = refName.Name.ToLowerInvariant();
                bool isForbidden = forbiddenPrefixes.Any(p => nameLower.Contains(p));
                Assert.False(isForbidden, $"Core assembly leaks CAD reference: {refName.FullName}");
            }
        }

        [Fact]
        public void InfrastructureAssembly_HasZeroAutoCADReferences()
        {
            Assembly infraAssembly = typeof(FileLogger).Assembly;
            AssemblyName[] referencedAssemblies = infraAssembly.GetReferencedAssemblies();

            string[] forbiddenPrefixes = new[]
            {
                "accoremgd",
                "acdbmgd",
                "acmgd",
                "adwindows",
                "accui",
                "autodesk.autocad",
                "autodesk.windows"
            };

            foreach (var refName in referencedAssemblies)
            {
                string nameLower = refName.Name.ToLowerInvariant();
                bool isForbidden = forbiddenPrefixes.Any(p => nameLower.Contains(p));
                Assert.False(isForbidden, $"Infrastructure assembly leaks CAD reference: {refName.FullName}");
            }
        }
    }
}
