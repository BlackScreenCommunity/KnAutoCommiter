namespace BPMSoft.Configuration
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;

    public interface IGitClient
    {
        Task CloneAsync(string url, string directoryPath, CancellationToken ct = default(CancellationToken));
        Task InitAsync(string directoryPath, CancellationToken ct = default(CancellationToken));
        Task<string> GetCurrentBranchAsync(string directoryPath, CancellationToken ct = default(CancellationToken));
        Task<string> StatusPorcelainAsync(string directoryPath, CancellationToken ct = default(CancellationToken));
        Task FetchAsync(string directoryPath, string remote, CancellationToken ct = default(CancellationToken));
        Task PullFastForwardAsync(string directoryPath, string remote, string branch, CancellationToken ct = default(CancellationToken));
        Task AddAllAndCommitAsync(string directoryPath, string message, string authorName, string authorEmail, CancellationToken ct = default(CancellationToken));
        Task AddAsync(string directoryPath, IEnumerable<string> paths, CancellationToken ct = default(CancellationToken));
        Task CommitAsync(string directoryPath, string message, string authorName, string authorEmail, CancellationToken ct = default(CancellationToken));
        Task PushAsync(string directoryPath, string remote, string branch, CancellationToken ct = default(CancellationToken));
        Task<IReadOnlyList<RemoteInfo>> GetRemotesAsync(string workdir, CancellationToken ct = default(CancellationToken));
        Task<TrackingInfo> GetUpstreamAsync(string workdir, CancellationToken ct = default(CancellationToken));
        Task<TrackingInfo> GetPushRemoteAsync(string workdir, CancellationToken ct = default(CancellationToken));
    }
}