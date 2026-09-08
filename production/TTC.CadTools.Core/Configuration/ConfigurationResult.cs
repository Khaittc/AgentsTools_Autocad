namespace TTC.CadTools.Core.Configuration
{
    public class ConfigurationResult
    {
        public ConfigurationStatus Status { get; set; }
        public string Source { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }

        public override string ToString()
        {
            if (Status == ConfigurationStatus.Valid)
                return $"VALID (Source: {Source})";
            if (Status == ConfigurationStatus.FallbackDefault)
                return $"FALLBACK_DEFAULT (Source: {Source})";
            return $"INVALID (Source: {Source}, Error: {ErrorMessage})";
        }
    }
}
