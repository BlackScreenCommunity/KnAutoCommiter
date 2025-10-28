 namespace BPMSoft.Configuration
{
    using BPMSoft.Core;
    using BPMSoft.Core.Packages;
    using System.Reflection;

    public class BpmsoftConfigurationOperator {

        private UserConnection _userConnection;

        private UserConnection UserConnection
        {
            get
            {
                return _userConnection;
            }
        }


        public BpmsoftConfigurationOperator(UserConnection userConnection)
        {
            _userConnection = userConnection;
        }


        public bool DownloadChangesToFileSystem()
        {
            var instance = new PackageInstallUtilities(UserConnection);
            var type = typeof(PackageInstallUtilities);
            var method = type.GetMethod(
                "LoadPackagesToFileSystem",
                BindingFlags.NonPublic | BindingFlags.Instance
                );

            var result = method.Invoke(instance, new object[] { null, true });

            var resultType = result.GetType();
            var status = resultType.GetProperty("HasChanges", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                                   ?.GetValue(result);

            return (bool)status;
        }
    }	
 }