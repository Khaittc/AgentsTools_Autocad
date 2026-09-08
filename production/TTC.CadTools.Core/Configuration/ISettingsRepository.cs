namespace TTC.CadTools.Core.Configuration
{
    public interface ISettingsRepository
    {
        Settings CurrentSettings { get; }
        ConfigurationResult Status { get; }
        void Reload();
    }
}
