using System;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using Xunit;

namespace TTC.CadTools.Tests.ManifestTests
{
    public class ManifestValidationTests
    {
        [Fact]
        public void PackageContents_ConformsToAutodeskR242Contract()
        {
            string manifestPath = Path.GetFullPath(Path.Combine(
                AppDomain.CurrentDomain.BaseDirectory,
                "..", "..", "..", "..", "production", "TTC.CadTools.bundle", "PackageContents.xml"));

            Assert.True(File.Exists(manifestPath), $"Manifest not found at {manifestPath}");

            XDocument doc = XDocument.Load(manifestPath);
            XElement root = doc.Root!;
            Assert.NotNull(root);
            Assert.Equal("ApplicationPackage", root.Name.LocalName);
            Assert.Equal("{4A7A779F-9C3D-4A42-A862-2D5392D6D3A0}", root.Attribute("ProductCode")?.Value);

            var runtimeReq = root.Element("Components")?.Element("RuntimeRequirements");
            Assert.NotNull(runtimeReq);
            Assert.Equal("R24.2", runtimeReq.Attribute("SeriesMin")?.Value);
            Assert.Equal("R24.2", runtimeReq.Attribute("SeriesMax")?.Value);

            var componentEntry = root.Element("Components")?.Element("ComponentEntry");
            Assert.NotNull(componentEntry);
            Assert.Equal("./Contents/TTC.CadTools.AutoCAD.dll", componentEntry.Attribute("ModuleName")?.Value);
            Assert.Equal("True", componentEntry.Attribute("LoadOnAutoCADStartup")?.Value);

            var commands = componentEntry.Element("Commands");
            Assert.NotNull(commands);
            Assert.Contains(commands.Elements("Command"), c => c.Attribute("Global")?.Value == "TTCINFO");
            Assert.Contains(commands.Elements("Command"), c => c.Attribute("Global")?.Value == "TTCPALETTE");
        }
    }
}
