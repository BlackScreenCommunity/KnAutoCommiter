 namespace BPMSoft.Configuration
{
    using System.Threading;
    using System.Threading.Tasks;

    public interface IGitClient
    {
        Task CloneAsync(string url, string workdir, CancellationToken ct = default(CancellationToken));
        Task InitAsync(string workdir, CancellationToken ct = default(CancellationToken));
        Task<string> GetCurrentBranchAsync(string workdir, CancellationToken ct = default(CancellationToken));
        Task<string> StatusPorcelainAsync(string workdir, CancellationToken ct = default(CancellationToken));
        Task FetchAsync(string workdir, string remote, CancellationToken ct = default(CancellationToken));
        Task PullFastForwardAsync(string workdir, string remote, string branch, CancellationToken ct = default(CancellationToken));
        Task AddAllAndCommitAsync(string workdir, string message, string authorName, string authorEmail, CancellationToken ct = default(CancellationToken));
        Task CreateTagAsync(string workdir, string tagName, string message, CancellationToken ct = default(CancellationToken));
    }
}