using System;


namespace KnAutoCommiterRunner
{
    class Program
    {
        static void Main(string[] args)
        {
            var service = new BPMSoft.Configuration.KnCommiterService();
            Console.WriteLine(service.GetPing());
        }
    }
}
