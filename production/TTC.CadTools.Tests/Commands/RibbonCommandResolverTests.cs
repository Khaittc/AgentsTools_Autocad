using System;
using TTC.CadTools.Core.Commands;
using Xunit;

namespace TTC.CadTools.Tests.Commands
{
    public class RibbonCommandResolverTests
    {
        private class DummyRibbonItem
        {
            public object? CommandParameter { get; set; }
            public string? Id { get; set; }
        }

        [Theory]
        [InlineData("TTCINFO", "TTCINFO")]
        [InlineData("TTCINFO ", "TTCINFO")]
        [InlineData(" ttcinfo ", "TTCINFO")]
        [InlineData("TTCPALETTE", "TTCPALETTE")]
        [InlineData("TTCPALETTE ", "TTCPALETTE")]
        [InlineData(" ttcpalette\n", "TTCPALETTE")]
        public void TryResolveCommand_WithDirectValidString_ResolvesSuccessfully(string input, string expected)
        {
            bool success = RibbonCommandResolver.TryResolveCommand(input, out string resolved);

            Assert.True(success);
            Assert.Equal(expected, resolved);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("LINE")]
        [InlineData("QUIT")]
        [InlineData("EXPLODE")]
        [InlineData("ttc")]
        public void TryResolveCommand_WithDirectInvalidString_Fails(string input)
        {
            bool success = RibbonCommandResolver.TryResolveCommand(input, out string resolved);

            Assert.False(success);
            Assert.Equal(string.Empty, resolved);
        }

        [Fact]
        public void TryResolveCommand_WithNull_Fails()
        {
            bool success = RibbonCommandResolver.TryResolveCommand(null, out string resolved);

            Assert.False(success);
            Assert.Equal(string.Empty, resolved);
        }

        [Theory]
        [InlineData(123)]
        [InlineData(45.67)]
        public void TryResolveCommand_WithUnsupportedType_Fails(object input)
        {
            bool success = RibbonCommandResolver.TryResolveCommand(input, out string resolved);

            Assert.False(success);
            Assert.Equal(string.Empty, resolved);
        }

        [Fact]
        public void TryResolveCommand_WithRibbonLikeObjectHavingCommandParameter_ResolvesSuccessfully()
        {
            var item = new DummyRibbonItem { CommandParameter = "TTCINFO " };

            bool success = RibbonCommandResolver.TryResolveCommand(item, out string resolved);

            Assert.True(success);
            Assert.Equal("TTCINFO", resolved);
        }

        [Fact]
        public void TryResolveCommand_WithRibbonLikeObjectHavingIdFallback_ResolvesSuccessfully()
        {
            var item = new DummyRibbonItem { CommandParameter = null, Id = "TTCPALETTE" };

            bool success = RibbonCommandResolver.TryResolveCommand(item, out string resolved);

            Assert.True(success);
            Assert.Equal("TTCPALETTE", resolved);
        }

        [Fact]
        public void TryResolveCommand_WithRibbonLikeObjectHavingInvalidCommand_Fails()
        {
            var item = new DummyRibbonItem { CommandParameter = "UNAPPROVED_COMMAND" };

            bool success = RibbonCommandResolver.TryResolveCommand(item, out string resolved);

            Assert.False(success);
            Assert.Equal(string.Empty, resolved);
        }

        [Theory]
        [InlineData("TTCINFO", true)]
        [InlineData("TTCPALETTE", true)]
        [InlineData("ttcinfo", true)]
        [InlineData("ttcpalette", true)]
        [InlineData("LINE", false)]
        [InlineData("", false)]
        [InlineData(null, false)]
        public void IsAllowedCommand_ValidatesCorrectly(string? commandName, bool expected)
        {
            bool result = RibbonCommandResolver.IsAllowedCommand(commandName);
            Assert.Equal(expected, result);
        }
    }
}
