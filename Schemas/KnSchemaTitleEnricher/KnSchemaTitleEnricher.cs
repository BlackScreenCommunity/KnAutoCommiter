 namespace BPMSoft.Configuration
{
    using BPMSoft.Core.DB;
    using BPMSoft.Core;


    public static class KnSchemaTitleEnricher
    {
        public static void Enrich (UserConnection userConnection, Schema schema)
        {

            var titleQuery = new Select(userConnection)
                .Top(1)
                .Column("Caption")
                .From("SysSchema")
                .Where("Name")
                    .IsEqual(Column.Const(schema.Name))
                .OrderByAsc("CreatedOn") as Select;

            var caption = titleQuery.ExecuteScalar<string>();

            schema.Caption = caption;
        }

    }
}
