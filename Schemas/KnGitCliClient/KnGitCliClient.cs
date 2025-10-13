namespace BPMSoft.Configuration
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    public sealed class GitCliClient : IGitClient
    {
        private readonly ProcessExecutor _executor;

        public GitCliClient(string gitExe, TimeSpan timeout)
        {
            _executor = new ProcessExecutor(
                string.IsNullOrWhiteSpace(gitExe) ? "git" : gitExe,
                timeout <= TimeSpan.Zero ? TimeSpan.FromMinutes(2) : timeout
            );
        }

        public GitCliClient() : this("git", TimeSpan.FromMinutes(2)) { }

        /// <summary>
        /// Выполняет клонирование репозитория
        /// </summary>
        /// <param name="url">Адрес репозитория</param>
        /// <param name="directoryPath">Путь до каталога, куда выполняется клонирование</param>
        /// <param name="ct">Токен отмены</param>
        /// <returns></returns>
        public Task CloneAsync(string url, string directoryPath, CancellationToken ct = default(CancellationToken))
        {
            return _executor.RunAsync(null, "clone " + EscapeString(url) + " " + EscapeString(directoryPath), null, ct, false);
        }

        /// <summary>
        /// Инициирует репозиторий по указанному пути
        /// </summary>
        /// <param name="directoryPath">Путь до каталога</param>
        /// <param name="ct">Токен отмены</param>
        /// <returns></returns>
        public Task InitAsync(string directoryPath, CancellationToken ct = default(CancellationToken))
        {
            return _executor.RunAsync(directoryPath, "init", null, ct, false);
        }

        /// <summary>
        /// Возвращает имя текущей ветки
        /// </summary>
        /// <param name="directoryPath">Путь до каталога</param>
        /// <param name="ct">Токен отмены</param>
        /// <returns></returns>
        public async Task<string> GetCurrentBranchAsync(string directoryPath, CancellationToken ct = default(CancellationToken))
        {
            var output = await _executor.RunAsync(directoryPath, "rev-parse --abbrev-ref HEAD", null, ct, false).ConfigureAwait(false);
            return output.Trim();
        }

        /// <summary>
        /// Возвращает список измененных и добавленных файлов
        /// </summary>
        /// <param name="directoryPath">Путь до каталога</param>
        /// <param name="ct">Токен отмены</param>
        /// <returns></returns>
        public Task<string> StatusPorcelainAsync(string directoryPath, CancellationToken ct = default(CancellationToken))
        {
            return _executor.RunAsync(directoryPath, "status --porcelain=v1", null, ct, false);
        }

        /// <summary>
        /// Выполняет скачивание изменений из удаленного репозитория
        /// </summary>
        /// <param name="directoryPath">Путь до каталога</param>
        /// <param name="remote">Имя удаленного репозитория</param>
        /// <param name="ct">Токен отмены</param>
        /// <returns></returns>
        public Task FetchAsync(string directoryPath, string remote, CancellationToken ct = default(CancellationToken))
        {
            var r = string.IsNullOrEmpty(remote) ? "origin" : remote;
            return _executor.RunAsync(directoryPath, "fetch " + EscapeString(r) + " --prune", null, ct, false);
        }

        /// <summary>
        /// Выполняет скачивание изменений из удаленного репозитория и объединяет ее с текущей веткой
        /// при условии, что в текущей ветке нет коммитов
        /// </summary>
        /// <param name="directoryPath">Путь до каталога</param>
        /// <param name="remote">Имя удаленного репозитория</param>
        /// <param name="branch">Имя ветки</param>
        /// <param name="ct">Токен отмены</param>
        /// <returns></returns>
        public Task PullFastForwardAsync(string directoryPath, string remote, string branch, CancellationToken ct = default(CancellationToken))
        {
            var r = string.IsNullOrEmpty(remote) ? "origin" : remote;
            var b = string.IsNullOrEmpty(branch) ? "main" : branch;
            return _executor.RunAsync(directoryPath, "pull " + EscapeString(r) + " " + EscapeString(b) + " --ff-only", null, ct, false);
        }

        /// <summary>
        /// Зафиксировать все изменения и создать коммит
        /// </summary>
        /// <param name="directoryPath">Путь до каталога</param>
        /// <param name="message">Сообщение коммита</param>
        /// <param name="authorName">Автор</param>
        /// <param name="authorEmail">Email автора</param>
        /// <param name="ct">Токен отмены</param>
        public async Task AddAllAndCommitAsync(string directoryPath, string message, string authorName, string authorEmail, CancellationToken ct = default(CancellationToken))
        {
            await _executor.RunAsync(directoryPath, "add --all", null, ct, false).ConfigureAwait(false);
            await CommitAsync(directoryPath, message, authorName, authorEmail, ct).ConfigureAwait(false);
        }

        /// <summary>
        /// Создает коммит
        /// </summary>
        /// <param name="directoryPath">Путь до каталога</param>
        /// <param name="message">Сообщение коммита</param>
        /// <param name="authorName">Автор</param>
        /// <param name="authorEmail">Email автора</param>
        /// <param name="ct">Токен отмены</param>
        /// <returns></returns>
        public async Task CommitAsync(string directoryPath, string message, string authorName, string authorEmail, CancellationToken ct = default(CancellationToken))
        {
            var env = new Dictionary<string, string>();
            if (!string.IsNullOrEmpty(authorName)) env["GIT_AUTHOR_NAME"] = authorName;
            if (!string.IsNullOrEmpty(authorEmail)) env["GIT_AUTHOR_EMAIL"] = authorEmail;
            if (!string.IsNullOrEmpty(authorName)) env["GIT_COMMITTER_NAME"] = authorName;
            if (!string.IsNullOrEmpty(authorEmail)) env["GIT_COMMITTER_EMAIL"] = authorEmail;

            await _executor.RunAsync(directoryPath, "commit -m " + EscapeString(message), env, ct, /*acceptNonZeroExit*/ true)
                .ConfigureAwait(false);
        }

        /// <summary>
        /// Добавить в индекс (stage) переданные файлы/папки.
        /// Пути могут быть относительными (к directoryPath) или абсолютными (внутри репозитория).
        /// </summary>
        public async Task AddAsync(string directoryPath, IEnumerable<string> paths, CancellationToken ct = default(CancellationToken))
        {
            if (paths == null) return;

            var list = new List<string>();
            foreach (var p in paths)
            {
                if (string.IsNullOrWhiteSpace(p)) continue;
                list.Add(p.Trim());
            }
            if (list.Count == 0) return;

            var repoRoot = Path.GetFullPath(directoryPath);
            var prepared = new List<string>(list.Count);
            var seen = new HashSet<string>(StringComparer.Ordinal);

            for (int i = 0; i < list.Count; i++)
            {
                var raw = list[i];

                string rel;
                if (Path.IsPathRooted(raw))
                {
                    var full = Path.GetFullPath(raw);
                    if (IsUnderRoot(full, repoRoot))
                        rel = MakeRelative(repoRoot, full);
                    else
                        rel = full;
                }
                else
                {
                    rel = raw.Replace('\\', '/'); 
                }

                if (rel.StartsWith("./", StringComparison.Ordinal)) rel = rel.Substring(2);

                if (!string.IsNullOrWhiteSpace(rel) && seen.Add(rel))
                    prepared.Add(rel);
            }

            if (prepared.Count == 0) return;

            const int batchSize = 100;
            for (int i = 0; i < prepared.Count; i += batchSize)
            {
                var chunk = prepared.Skip(i).Take(batchSize).ToArray();
                var args = "add -- " + string.Join(" ", chunk.Select(EscapeString));
                await _executor.RunAsync(directoryPath, args, null, ct, /*acceptNonZeroExit*/ false).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Фиксирует коммит в удаленном репозитории
        /// </summary>
        /// <param name="directoryPath"></param>
        /// <param name="remote">Имя удаленного репозитория</param>
        /// <param name="branch">Имя ветки</param>
        /// <param name="ct">Токен отмены</param>
        /// <returns></returns>
        public Task PushAsync(string directoryPath, string remote, string branch, CancellationToken ct = default(CancellationToken))
        {
            var r = string.IsNullOrEmpty(remote) ? "origin" : remote;
            var b = string.IsNullOrEmpty(branch) ? "main" : branch;

            var args = "push " + EscapeString(r) + " " + EscapeString(b);

            return _executor.RunAsync(directoryPath, args, null, ct, false);
        }


        public Task<IReadOnlyList<RemoteInfo>> GetRemotesAsync(string workdir, CancellationToken ct = default(CancellationToken))
        {
            return Task.Run(async () =>
            {
                var list = new List<RemoteInfo>();
                var output = await _executor.RunAsync(workdir, "config --get-regexp ^remote\\..*\\.url", null, ct, /*acceptNonZeroExit*/ true).ConfigureAwait(false);

                if (string.IsNullOrWhiteSpace(output))
                    return (IReadOnlyList<RemoteInfo>)list;

                var lines = output.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                for (int i = 0; i < lines.Length; i++)
                {
                    var line = lines[i].Trim();
                    int sp = line.IndexOf(' ');
                    if (sp <= 0) continue;

                    var left = line.Substring(0, sp);
                    var url = line.Substring(sp + 1).Trim();

                    var name = ExtractRemoteName(left); 
                    if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(url))
                        list.Add(new RemoteInfo(name, url));
                }
                return (IReadOnlyList<RemoteInfo>)DeduplicateRemotes(list);
            });
        }

        private static string ExtractRemoteName(string left)
        {
            const string prefix = "remote.";
            const string suffix = ".url";
            if (!left.StartsWith(prefix, StringComparison.Ordinal)) return null;
            if (!left.EndsWith(suffix, StringComparison.Ordinal)) return null;

            var core = left.Substring(prefix.Length, left.Length - prefix.Length - suffix.Length);
            return core;
        }

        private static IReadOnlyList<RemoteInfo> DeduplicateRemotes(List<RemoteInfo> list)
        {
            var set = new HashSet<string>(StringComparer.Ordinal);
            var result = new List<RemoteInfo>();
            for (int i = 0; i < list.Count; i++)
            {
                var key = list[i].Name + "\u001f" + list[i].Url;
                if (set.Add(key))
                    result.Add(list[i]);
            }
            return result;
        }

        public async Task<TrackingInfo> GetUpstreamAsync(string workdir, CancellationToken ct = default(CancellationToken))
        {
            var output = await _executor.RunAsync(workdir, "rev-parse --abbrev-ref --symbolic-full-name @{u}", null, ct, /*acceptNonZeroExit*/ true)
                .ConfigureAwait(false);

            var token = (output ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(token) || token == "@{u}")
                return new TrackingInfo(null, null);

            var slash = token.IndexOf('/');
            if (slash > 0)
            {
                var remote = token.Substring(0, slash);
                var branch = token.Substring(slash + 1);
                return new TrackingInfo(remote, branch);
            }
            return new TrackingInfo(null, null);
        }

        public async Task<TrackingInfo> GetPushRemoteAsync(string workdir, CancellationToken ct = default(CancellationToken))
        {
            var output = await _executor.RunAsync(workdir, "rev-parse --abbrev-ref --symbolic-full-name @{push}", null, ct, /*acceptNonZeroExit*/ true)
                .ConfigureAwait(false);

            var token = (output ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(token) || token == "@{push}")
                return new TrackingInfo(null, null);

            var slash = token.IndexOf('/');
            if (slash > 0)
            {
                var remote = token.Substring(0, slash);
                var branch = token.Substring(slash + 1);
                return new TrackingInfo(remote, branch);
            }
            return new TrackingInfo(null, null);
        }


        private static string EscapeString(string s)
        {
            if (string.IsNullOrEmpty(s)) return "\"\"";
            var sb = new StringBuilder();
            sb.Append('"');
            for (int i = 0; i < s.Length; i++)
            {
                var ch = s[i];
                if (ch == '\\' || ch == '"')
                {
                    sb.Append('\\');
                }
                sb.Append(ch);
            }
            sb.Append('"');
            return sb.ToString();
        }

        private static bool IsUnderRoot(string fullPath, string root)
        {
            var r = root;
            if (!r.EndsWith(Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal) &&
                !r.EndsWith(Path.AltDirectorySeparatorChar.ToString(), StringComparison.Ordinal))
                r += Path.DirectorySeparatorChar;

            return fullPath.StartsWith(r, StringComparison.OrdinalIgnoreCase);
        }

        private static string MakeRelative(string baseDir, string fullPath)
        {
            var baseUri = new Uri(AppendSlash(baseDir));
            var fileUri = new Uri(fullPath);
            var rel = Uri.UnescapeDataString(baseUri.MakeRelativeUri(fileUri).ToString());
            return rel.Replace('\\', '/');
        }

        private static string AppendSlash(string path)
        {
            if (string.IsNullOrEmpty(path)) return path;
            if (path.EndsWith("/", StringComparison.Ordinal) || path.EndsWith("\\", StringComparison.Ordinal)) return path;
            return path + Path.DirectorySeparatorChar;
        }
    }


    public class ProcessExecutor
    {
        public ProcessExecutor()
        {
            GitExecutable = "git";
            TimeOut = TimeSpan.FromMinutes(2);
        }

        public ProcessExecutor(string gitExecutable)
        {
            GitExecutable = gitExecutable;
        }
        public ProcessExecutor(string gitExecutable, TimeSpan timeOut) : this(gitExecutable)
        {
            TimeOut = timeOut;
        }

        private string GitExecutable { get; }
        private TimeSpan TimeOut { get; }

        public Task<string> RunAsync(
          string workingDir,
          string arguments,
          IDictionary<string, string> extraEnv,
          CancellationToken ct,
          bool acceptNonZeroExit)
        {
            var tcs = new TaskCompletionSource<string>();
            var p = InitProcess(workingDir, arguments, extraEnv, acceptNonZeroExit, tcs);

            try
            {
                if (!p.Start())
                {
                    tcs.TrySetException(new InvalidOperationException("Failed to start git process."));
                }
                else
                {
                    DoProcessComand(ct, p, tcs);
                }
            }
            catch (Exception ex)
            {
                tcs.TrySetException(ex);
            }

            return tcs.Task;
        }

        private void DoProcessComand(CancellationToken ct, Process p, TaskCompletionSource<string> tcs)
        {
            p.BeginOutputReadLine();
            p.BeginErrorReadLine();

            // Таймаут + отмена
            var timeoutCts = new CancellationTokenSource();
            timeoutCts.CancelAfter(TimeOut);

            CancellationTokenRegistration r1 = default(CancellationTokenRegistration);
            CancellationTokenRegistration r2 = default(CancellationTokenRegistration);

            Action cancelAction = () => HandleProcessKill(p);

            r1 = ct.Register(cancelAction);
            r2 = timeoutCts.Token.Register(cancelAction);

            tcs.Task.ContinueWith(t =>
            {
                r1.Dispose();
                r2.Dispose();
                timeoutCts.Dispose();
            }, timeoutCts.Token);
        }

        private Process InitProcess(string workingDir, string arguments, IDictionary<string, string> extraEnv, bool acceptNonZeroExit,
            TaskCompletionSource<string> tcs)
        {
            var psi = new ProcessStartInfo
            {
                FileName = GitExecutable,
                Arguments = arguments,
                WorkingDirectory = string.IsNullOrEmpty(workingDir) ? Environment.CurrentDirectory : workingDir,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            SetEnvVariables(extraEnv, psi);

            var stdout = new StringBuilder();
            var stderr = new StringBuilder();

            var p = new Process();
            p.StartInfo = psi;
            p.EnableRaisingEvents = true;

            p.OutputDataReceived += (s, e) =>
            {
                if (e.Data != null) stdout.AppendLine(e.Data);
            };
            p.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null) stderr.AppendLine(e.Data);
            };
            p.Exited += (s, e) => HandleProcessExit(arguments, acceptNonZeroExit, p, stderr, tcs, stdout);
            return p;
        }

        private static void HandleProcessKill(Process p)
        {
            try
            {
                if (!p.HasExited)
                {
                    try { p.Kill(); }
                    catch { /* ignore */ }
                }
            }
            catch { /* ignore */ }
        }

        private static void HandleProcessExit(string arguments, bool acceptNonZeroExit, Process p, StringBuilder stderr,
            TaskCompletionSource<string> tcs, StringBuilder stdout)
        {
            try
            {
                // Гарантируем, что все буферы дочитаны
                p.WaitForExit();
                var exitCode = p.ExitCode;
                p.Dispose();

                if (exitCode != 0 && !acceptNonZeroExit)
                {
                    var msg = "git " + arguments + Environment.NewLine +
                              "ExitCode: " + exitCode + Environment.NewLine +
                              "STDERR:" + Environment.NewLine + stderr;
                    tcs.TrySetException(new GitCliException(msg));
                }
                else
                {
                    tcs.TrySetResult(stdout.ToString());
                }
            }
            catch (Exception ex)
            {
                tcs.TrySetException(ex);
            }
        }

        private static void SetEnvVariables(IDictionary<string, string> extraEnv, ProcessStartInfo psi)
        {
            TrySetEnv(psi, "LC_ALL", "C");
            TrySetEnv(psi, "LANG", "C");

            if (extraEnv != null)
            {
                foreach (var kv in extraEnv)
                {
                    TrySetEnv(psi, kv.Key, kv.Value);
                }
            }
        }

        private static void TrySetEnv(ProcessStartInfo psi, string key, string value)
        {
            try
            {
                psi.EnvironmentVariables[key] = value;
            }
            catch
            {
                // В редких окружениях может бросить — игнорируем
            }
        }

    }

    public sealed class RemoteInfo
    {
        public string Name { get; private set; }
        public string Url { get; private set; }

        public RemoteInfo(string name, string url)
        {
            Name = name;
            Url = url;
        }

        public override string ToString()
        {
            return Name + " => " + Url;
        }
    }

    public sealed class TrackingInfo
    {
        // Пример: Remote="origin", Branch="main"
        public string Remote { get; private set; }
        public string Branch { get; private set; }

        public TrackingInfo(string remote, string branch)
        {
            Remote = remote;
            Branch = branch;
        }

        public bool IsEmpty()
        {
            return string.IsNullOrEmpty(Remote) || string.IsNullOrEmpty(Branch);
        }

        public override string ToString()
        {
            return string.IsNullOrEmpty(Remote) || string.IsNullOrEmpty(Branch)
                ? "<no-tracking>"
                : (Remote + "/" + Branch);
        }
    }

    public sealed class GitCliException : Exception
    {
        public GitCliException(string message) : base(message) { }
    }


}