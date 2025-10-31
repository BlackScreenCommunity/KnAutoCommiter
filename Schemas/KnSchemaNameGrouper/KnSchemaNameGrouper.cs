namespace BPMSoft.Configuration
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text.RegularExpressions;

    public static class ChangeGrouper
    {
        private static readonly HashSet<string> PackageFolders =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { "Schemas", "Resources", "Data", "SqlScripts" };

        private static readonly Regex ResourcesNameNormalizer =
            new Regex(@"^(?<base>[^.]+)\.(Process|ClientUnit|Entity|SourceCode)$",
                      RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public static IReadOnlyList<GroupedFiles> GroupUnified(IEnumerable<string> changedPaths)
        {
            var byName = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            foreach (var raw in changedPaths ?? Enumerable.Empty<string>())
            {
                if (string.IsNullOrWhiteSpace(raw)) continue;

                var norm = raw.Replace('\\', Path.DirectorySeparatorChar)
                              .Replace('/', Path.DirectorySeparatorChar);

                var segments = norm.Split(new[] { Path.DirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries);

                var packageFolderInfo = FindPackageFolder(segments);
                string name;

                if (packageFolderInfo.idx < 0 || packageFolderInfo.idx + 1 >= segments.Length)
                {
                    name = "Other";
                }
                else
                {
                    var schemaFolder = segments[packageFolderInfo.idx + 1];
                    name = Canonicalize(packageFolderInfo.packageFolder, schemaFolder);
                }

                List<string> files;
                if (!byName.TryGetValue(name, out files))
                {
                    files = new List<string>();
                    byName[name] = files;
                }

                if (!files.Any(f => string.Equals(f, raw, StringComparison.OrdinalIgnoreCase)))
                {
                    files.Add(raw);
                }
            }

            foreach (var kv in byName)
                kv.Value.Sort(StringComparer.OrdinalIgnoreCase);

            var result = byName
                .OrderBy(kv => kv.Key.Equals("Other", StringComparison.OrdinalIgnoreCase) ? "zzz" : kv.Key,
                         StringComparer.OrdinalIgnoreCase)
                .Select(kv => new GroupedFiles(kv.Key, kv.Value))
                .ToList();

            return result;
        }

        private static (int idx, string packageFolder) FindPackageFolder(string[] segments)
        {
            for (int i = 0; i < segments.Length; i++)
            {
                if (PackageFolders.Contains(segments[i]))
                    return (i, segments[i]);
            }
            return (-1, null);
        }

        private static string Canonicalize(string packageFolder, string artifactFolder)
        {
            var name = (artifactFolder ?? string.Empty).Trim();

            if (!string.IsNullOrEmpty(packageFolder) &&
                packageFolder.Equals("Resources", StringComparison.OrdinalIgnoreCase))
            {
                var m = ResourcesNameNormalizer.Match(name);
                if (m.Success) name = m.Groups["base"].Value;
            }

            return name;
        }
    }

    public sealed class GroupedFiles
    {
        public string Name { get; private set; }
        public IReadOnlyList<string> Files { get; private set; }

        public GroupedFiles(string name, IReadOnlyList<string> files)
        {
            Name = name;
            Files = files ?? new List<string>();
        }
    }
}
