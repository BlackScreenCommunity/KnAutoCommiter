namespace BPMSoft.Configuration
{
    using System;
    using System.ServiceModel;
    using System.ServiceModel.Web;
    using System.ServiceModel.Activation;
    using BPMSoft.Core;
    using BPMSoft.Web.Common;
    using System.Threading.Tasks;
    using BPMSoft.Core.DB;
    using BPMSoft.Common;

    [ServiceContract]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class KnCommiterService : BaseService
    {
        // Ссылка на экземпляр UserConnection, требуемый для обращения к базе данных.
        private SystemUserConnection _systemUserConnection;
        private SystemUserConnection SystemUserConnection
        {
            get
            {
                return _systemUserConnection ?? (_systemUserConnection = (SystemUserConnection)AppConnection.SystemUserConnection);
            }
        }

        /// <summary>
        /// Тестовый метод для проверки веб-сервиса
        /// </summary>
        /// <returns></returns>
        [OperationContract]
        [WebInvoke(Method = "GET", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public string Ping()
        {
            return "Pong";
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public async Task<string> CommitAndPushAllChangesAsync()
        {
            try
            {
                await DoFullGitSyncIteration();

                return "Done";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        private async Task DoFullGitSyncIteration()
        {
            IGitClient client = new GitCliClient();

            string repositoryPath = GetSysSettingsValue("KnAutocommiterRepoPath");
            string authorName = GetSysSettingsValue("KnAutocommiterAuthorName");
            string authorEmail = GetSysSettingsValue("KnAutocommiterAuthorEmail");
            string defaultCommitMessage = GetSysSettingsValue("KnAutocommiterDefaultCommitMessage");

            await client.AddAllAndCommitAsync(repositoryPath, defaultCommitMessage, authorName, authorEmail);

            string branchName = await client.GetCurrentBranchAsync(repositoryPath);
            var upstream = await client.GetUpstreamAsync(repositoryPath);

            if (branchName.IsNotNullOrEmpty() && upstream is object && upstream.Remote.IsNotNullOrEmpty())
            {
                await client.PushAsync(repositoryPath, upstream.Remote, branchName);
            }
        }

        private string GetSysSettingsValue(string sysSettingsCode)
        {

            var sysSettingsId = GetSysSettingsId(sysSettingsCode);

            return (
                    new Select(SystemUserConnection)
                    .Column("TextValue")
                    .From("SysSettingsValue")
                    .Where("SysSettingsId")
                        .IsEqual(Column.Const(sysSettingsId))
                        .And("SysAdminUnitId")
                            .IsEqual(Column.Const("a29a3ba5-4b0d-de11-9a51-005056c00008")) as Select)
                    .ExecuteScalar<string>();
        }


        /**
         * Получает идентификатор системной настройки по ее коду
         */
        internal Guid GetSysSettingsId(string sysSettingCode)
        {
            return (
                    new Select(SystemUserConnection)
                    .Column("Id")
                    .From("SysSettings")
                    .Where("Code")
                        .IsEqual(Column.Const(sysSettingCode)) as Select)
                    .ExecuteScalar<Guid>();
        }
    }
}