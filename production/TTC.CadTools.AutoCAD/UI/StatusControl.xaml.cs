using System.Windows.Controls;

namespace TTC.CadTools.AutoCAD.UI
{
    public partial class StatusControl : UserControl
    {
        public StatusControl()
        {
            InitializeComponent();
        }

        public void SetDocumentStatus(string docName)
        {
            Dispatcher.Invoke(() =>
            {
                TxtDocument.Text = string.IsNullOrEmpty(docName) ? "[No Active Document]" : docName;
            });
        }

        public void SetDiagnostics(string configStatus, string logPath, string version)
        {
            Dispatcher.Invoke(() =>
            {
                TxtConfiguration.Text = configStatus;
                TxtLogPath.Text = logPath;
                TxtVersion.Text = $"Version: {version}";
            });
        }
    }
}
