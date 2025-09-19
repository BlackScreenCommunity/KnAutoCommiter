namespace BPMSoft.Configuration
{
    ﻿using System;

    /// <summary>
    /// Performs Git-repository operations
    /// </summary>
    class GitOperator
    {
        string repoPath;
        string username;
        string password;
        string commitMessage;

        /// <summary>
        /// Path to folder with repository
        /// </summary>
        public string RepoPath { get => repoPath; set => repoPath = value; }
        /// <summary>
        /// VCS Username
        /// </summary>
        public string UserName { get => username; set => username = value; }
        /// <summary>
        /// VCS Password
        /// </summary>
        public string Password { get => password; set => password = value; }
        /// <summary>
        /// Default part of tme message.
        /// The message is formed according to the following template: "YYYY-MM-DD {CommitMessage}"
        /// </summary>
        public string CommitMessage { get => commitMessage; set => commitMessage = value; }

        /// <summary>
        /// Basic constructor
        /// </summary>
        /// <param name="repoPath">Path to folder with repository</param>
        /// <param name="username">VCS Username</param>
        /// <param name="password">VCS Password</param>
        /// <param name="commitMessage">Commit message</param>
        public GitOperator(string repoPath, string username, string password, string commitMessage = "Commit")
        {
            RepoPath = repoPath;
            UserName = username;
            Password = password;
            CommitMessage = commitMessage;
        }
        
        /// <summary>
        /// Stage all the Changes/Untracked/Deleted files
        /// </summary>
        //public void StageChanges()
        //{
        //    try
        //    {
        //        using (var repo = new Repository(RepoPath))
        //        {
        //            Commands.Stage(repo, "*");
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine("StageChanges " + ex.Message);
        //    }
        //}

        /// <summary>
        /// Perform commit
        /// </summary>
        //public void CommitChanges(string additionalCommitMessage = default)
        //{
        //    try
        //    {
        //        using (var repo = new Repository(RepoPath))
        //       {
        //            var currentBranchName = GetCurrentBranchName(repo);
        //            repo.Commit($"{DateTime.Now.ToString("yyyy-MM-dd HH:mm")} {CommitMessage} {additionalCommitMessage}", new Signature(UserName, currentBranchName, DateTimeOffset.Now),
        //            new Signature(UserName, currentBranchName, DateTimeOffset.Now));
        //        }

        //    }
        //    catch (Exception e)
        //    {
        //        Console.WriteLine("CommitChanges " + e.Message);
        //    }
        //}

        /// <summary>
        /// Push changes to Remote repo
        /// </summary>
        //public void PushChanges()
        //{
        //    try
        //    {
        //        using (var repo = new Repository(RepoPath))
        //        {
        //            PushOptions options = new PushOptions();
        //            options.CredentialsProvider = new CredentialsHandler(
        //                (url, usernameFromUrl, types) =>
        //                    new UsernamePasswordCredentials()
        //                    {
        //                        Username = UserName,
        //                        Password = Password 
        //                    });
        //            repo.Network.Push(repo.Branches[GetCurrentBranchName(repo)], options);
        //        }
        //    }
        //    catch (Exception e)
        //    {
        //        Console.WriteLine("Error when pushing changes " + e.Message);
        //        throw new Exception("Ошибка выполнения PUSH в репозиторий", e);
        //    }
        //}
        /// <summary>
        /// Gets repository branch name for commit creation
        /// </summary>
        //private string GetCurrentBranchName(Repository repo) {
        //    return repo.Head.FriendlyName;
        //}
    }
}