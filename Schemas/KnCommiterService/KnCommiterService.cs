namespace BPMSoft.Configuration
{

	using System;
	using System.ServiceModel;
	using System.ServiceModel.Web;
	using System.ServiceModel.Activation;
	using BPMSoft.Core;
	using BPMSoft.Web.Common;
	using BPMSoft.Core.Entities;
	
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

        [OperationContract]
        [WebInvoke(Method = "GET", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public string CommitChanges()
        {
            try
            {
                var gitOperator = new GitOperator("C:\\Users\\nkuzmin\\git\\demorepository\\", "nickkuzmin1301", "");
                Console.WriteLine("Commiting");
                //gitOperator.StageChanges();
                //gitOperator.CommitChanges();
                //gitOperator.PushChanges();


                return "Done";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public string Ping()
        {
            return "Pong";
        }

        /// <summary>
        /// Тестовый метод для проверки веб-сервиса
        /// </summary>
        /// <returns></returns>
        [OperationContract]
        [WebInvoke(Method = "GET", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
        public string GetPing()
        {
            return "GOT Pong VS Code Build";
        }

    }
}