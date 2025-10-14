namespace BPMSoft.Configuration
{
    using BPMSoft.Common;
    using BPMSoft.Core;
    using BPMSoft.Core.DB;
    using BPMSoft.Web.Common;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Runtime.Serialization;
    using System.ServiceModel;
    using System.ServiceModel.Activation;
    using System.ServiceModel.Web;
    using System.Threading.Tasks;

    [ServiceContract]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class KnCommiterService : BaseService
    {
        private SystemUserConnection _systemUserConnection;
        private string _repositoryPath;
        private string _authorName;
        private string _authorEmail;
        private string _defaultCommitMessage;
        private IGitClient _gitCliClient;

        private SystemUserConnection SystemUserConnection
        {
            get
            {
                return _systemUserConnection ?? (_systemUserConnection = (SystemUserConnection)AppConnection.SystemUserConnection);
            }
        }

        private string RepositoryPath
        {
            get
            {
                if (string.IsNullOrEmpty(_repositoryPath))
                {
                    _repositoryPath = GetSysSettingsValue("KnAutocommiterRepoPath");
                }
                return _repositoryPath;
            }
        }

        private string AuthorName
        {
            get
            {
                if (string.IsNullOrEmpty(_authorName))
                {
                    _authorName = GetSysSettingsValue("KnAutocommiterAuthorName");
                }
                return _authorName;
            }
        }
        private string AuthorEmail
        {
            get
            {
                if (string.IsNullOrEmpty(_authorEmail))
                {
                    _authorEmail = GetSysSettingsValue("KnAutocommiterAuthorEmail");
                }
                return _authorEmail;
            }
        }
        private string DefaultCommitMessage
        {
            get
            {
                if (string.IsNullOrEmpty(_defaultCommitMessage))
                {
                    _defaultCommitMessage = GetSysSettingsValue("KnAutocommiterDefaultCommitMessage");
                }
                return _defaultCommitMessage;
            }
        }

        public IGitClient GitCliClient { get => _gitCliClient; set => _gitCliClient = value; }

        public KnCommiterService() : base()
        {
            GitCliClient = new GitCliClient();
        }

        /// <summary>
        /// Тестовый метод для проверки веб-сервиса
        /// </summary>
        /// <returns></returns>
        [OperationContract]
        [WebInvoke(Method = "GET", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public string Ping()
        {
            return "Pong 2025/10/08/v01";
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public async Task<string> CommitAndPushAllChangesAsync()
        {
            try
            {
                string result = await DoFullGitSyncIteration();
                return result;
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public async Task<StatusDTO> GetRepoStatus()
        {
            try
            {
                string status = await GitCliClient.StatusPorcelainAsync(RepositoryPath);
                var log = await GitCliClient.GetLog(RepositoryPath);
                Console.WriteLine(string.Join("# ", log.ToArray()));
                return new StatusDTO()
                {
                    Status = status,
                    Log = log.ToArray()
                };
            }
            catch (Exception ex)
            {
                return new StatusDTO();
            }
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public async Task<string[]> GetLog()
        {
            try
            {
                var result = await GitCliClient.GetLog(RepositoryPath);

                return result.ToArray();
            }
            catch (Exception ex)
            {
                return new string [] { ex.Message };
            }
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public async Task<string> AddAndCommitChanges(string message, List<string> changes)
        {
            try
            {
                await GitCliClient.AddAsync(RepositoryPath, changes);
                await GitCliClient.CommitAsync(RepositoryPath, message, AuthorName, AuthorEmail);
                return "ok";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        private async Task<string> DoFullGitSyncIteration()
        {
            var gitStatus = await GitCliClient.StatusPorcelainAsync(RepositoryPath);

            await GitCliClient.AddAllAndCommitAsync(RepositoryPath, DefaultCommitMessage, AuthorName, AuthorEmail);

            string branchName = await GitCliClient.GetCurrentBranchAsync(RepositoryPath);
            var upstream = await GitCliClient.GetUpstreamAsync(RepositoryPath);

            if (branchName.IsNotNullOrEmpty() && upstream is object && upstream.Remote.IsNotNullOrEmpty())
            {
                await GitCliClient.PushAsync(RepositoryPath, upstream.Remote, branchName);
            }

            return gitStatus;
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

    [DataContract]
    public class StatusDTO
    {
        [DataMember]
        public string Status;

        [DataMember]
        public string[] Log;
    }
}
