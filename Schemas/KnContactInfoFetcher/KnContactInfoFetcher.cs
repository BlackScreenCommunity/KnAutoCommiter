namespace BPMSoft.Configuration
{
    using BPMSoft.Core;

    public static class ContactInfoFetcher 
    {
        public static string GetContactName(UserConnection userConnection)
        {
            return userConnection.CurrentUser.ContactName;
        }

        public static string GetContactEmail(UserConnection userConnection)
        {
            userConnection.CurrentUser.Contact.FetchFromDB(userConnection.CurrentUser.ContactId);

            return userConnection.CurrentUser.Contact.Email; 

        }
    }
}
