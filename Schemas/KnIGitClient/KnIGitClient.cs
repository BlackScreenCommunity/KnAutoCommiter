 namespace BPMSoft.Configuration
{
    using System;
    using LibGit2Sharp;
    using LibGit2Sharp.Handlers;

	public interface IGitClient
	{
		Task CloneAsync(string url, string workdir, CancellationToken ct = default);
		Task InitAsync(string workdir, CancellationToken ct = default);
		Task<string> GetCurrentBranchAsync(string workdir, CancellationToken ct = default);
		Task<string> StatusAsync(string workdir, CancellationToken ct = default);
		Task FetchAsync(string workdir, string remote = "origin", CancellationToken ct = default);
		Task PullAsync(string workdir, string remote = "origin", string branch = "main", CancellationToken ct = default);
		Task AddAllAndCommitAsync(string workdir, string message, string? authorName = null, string? authorEmail = null, CancellationToken ct = default);
		Task CreateTagAsync(string workdir, string tagName, string? message = null, CancellationToken ct = default);
	}
	 
 }