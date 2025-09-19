namespace BPMSoft.Configuration
{

	using System;
	using System.ServiceModel;
	using System.ServiceModel.Web;
	using System.ServiceModel.Activation;
	using BPMSoft.Core;
	using BPMSoft.Web.Common;
	using BPMSoft.Core.Entities;
	
	public sealed class GitCliClient : IGitClient
{
    private readonly TimeSpan _timeout;
    private readonly string _gitExe;

    public GitCliClient(TimeSpan? timeout = null, string? gitExe = null)
    {
        _timeout = timeout ?? TimeSpan.FromMinutes(2);
        _gitExe  = gitExe ?? "git";
    }

    public Task CloneAsync(string url, string workdir, CancellationToken ct = default) =>
        RunAsync(null, "clone", new[] { url, workdir }, ct);

    public Task InitAsync(string workdir, CancellationToken ct = default) =>
        RunAsync(workdir, "init", Array.Empty<string>(), ct);

    public async Task<string> GetCurrentBranchAsync(string workdir, CancellationToken ct = default) =>
        (await RunAsync(workdir, "rev-parse", new[] { "--abbrev-ref", "HEAD" }, ct)).Trim();

    public Task<string> StatusAsync(string workdir, CancellationToken ct = default) =>
        RunAsync(workdir, "status", new[] { "--porcelain=v1" }, ct);

    public Task FetchAsync(string workdir, string remote = "origin", CancellationToken ct = default) =>
        RunAsync(workdir, "fetch", new[] { remote, "--prune" }, ct);

    public Task PullAsync(string workdir, string remote = "origin", string branch = "main", CancellationToken ct = default) =>
        RunAsync(workdir, "pull", new[] { remote, branch, "--ff-only" }, ct);

    public async Task AddAllAndCommitAsync(string workdir, string message, string? authorName = null, string? authorEmail = null, CancellationToken ct = default)
    {
        await RunAsync(workdir, "add", new[] { "--all" }, ct);

        var env = new Dictionary<string, string?>
        {
            ["GIT_AUTHOR_NAME"]    = authorName,
            ["GIT_AUTHOR_EMAIL"]   = authorEmail,
            ["GIT_COMMITTER_NAME"] = authorName,
            ["GIT_COMMITTER_EMAIL"]= authorEmail
        };

        await RunAsync(workdir, "commit", new[] { "-m", message }, ct, env, acceptNonZeroExit: true);
        // acceptNonZeroExit: true — чтобы не падать, если нечего коммитить (exit code 1)
    }

    public Task CreateTagAsync(string workdir, string tagName, string? message = null, CancellationToken ct = default)
    {
        var args = message is null ? new[] { tagName } : new[] { "-a", tagName, "-m", message };
        return RunAsync(workdir, "tag", args, ct);
    }

    // =============== helpers ===============

    private async Task<string> RunAsync(
        string? workingDir,
        string cmd,
        IReadOnlyList<string> args,
        CancellationToken ct,
        IDictionary<string, string?>? extraEnv = null,
        bool acceptNonZeroExit = false)
    {
        var psi = new ProcessStartInfo
        {
            FileName = _gitExe,
            WorkingDirectory = workingDir ?? Environment.CurrentDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError  = true,
            RedirectStandardInput  = false,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // Стабильный английский вывод для парсинга
        psi.Environment["LC_ALL"] = "C";
        psi.Environment["LANG"]   = "C";

        if (extraEnv != null)
        {
            foreach (var kv in extraEnv)
            {
                if (kv.Value is null) continue;
                psi.Environment[kv.Key] = kv.Value;
            }
        }

        psi.ArgumentList.Add(cmd);
        foreach (var a in args)
            psi.ArgumentList.Add(a);

        using var p = new Process { StartInfo = psi, EnableRaisingEvents = true };

        var stdout = new StringBuilder();
        var stderr = new StringBuilder();

        p.OutputDataReceived += (_, e) => { if (e.Data != null) stdout.AppendLine(e.Data); };
        p.ErrorDataReceived  += (_, e) => { if (e.Data != null) stderr.AppendLine(e.Data); };

        if (!p.Start())
            throw new InvalidOperationException("Failed to start git process.");

        p.BeginOutputReadLine();
        p.BeginErrorReadLine();

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(_timeout);

        await Task.Run(() => p.WaitForExit(), cts.Token)
                  .ConfigureAwait(false);

        if (p.ExitCode != 0 && !acceptNonZeroExit)
        {
            var details = $"git {cmd} {string.Join(' ', args)}" +
                          $"{Environment.NewLine}STDERR:{Environment.NewLine}{stderr}";
            throw new GitCliException($"git exited with code {p.ExitCode}. {details}");
        }

        return stdout.ToString();
    }
}

public sealed class GitCliException : Exception
{
    public GitCliException(string message) : base(message) { }
}

}