namespace BPMSoft.Configuration
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Логически группирует измененные файлы по "Схемам BPMSoft"
    /// На вход принимает пути до файлов, которые были изменены
    /// На выход возвращает название "Схемы" и набор файлов, которые 
    /// ассоциированы с этой схемой
    /// </summary>
    public static class SchemaGrouper
    {
        private static readonly HashSet<string> PackageFolders =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { "Schemas", "Resources", "Data", "SqlScripts" };

        private static readonly Regex ResourcesNameNormalizer =
            new Regex(@"^(?<base>[^.]+)\.(Process|ClientUnit|Entity|SourceCode)$",
                      RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public static IReadOnlyList<Schema> Group(IEnumerable<string> changedPaths)
        {
            var schemaWithFiles = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            foreach (var filePath in changedPaths ?? Enumerable.Empty<string>())
            {
                if (string.IsNullOrWhiteSpace(filePath))
                {
                    continue;
                }

                string groupName = ExtractSchemaName(filePath);
                AddFilePathToGroup(schemaWithFiles, filePath, groupName);
            }

            List<Schema> result = CreateSchemaGroups(schemaWithFiles);

            return result;
        }

        /// <summary>
        /// Извлекает название схемы из названия файла
        /// </summary>
        /// <param name="rawPath">Путь до измененного файла пакета</param>
        /// <returns>Название схемы</returns>
        private static string ExtractSchemaName(string rawPath)
        {
            var normalizedPath = rawPath.Replace('\\', Path.DirectorySeparatorChar)
                                        .Replace('/', Path.DirectorySeparatorChar);

            var segments = normalizedPath.Split(new[] { Path.DirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries);

            var packageFolderInfo = FindPackageFolder(segments);
            string schemaName;

            if (packageFolderInfo.idx < 0 || packageFolderInfo.idx + 1 >= segments.Length)
            {
                schemaName = "Other";
            }
            else
            {
                var schemaFolder = segments[packageFolderInfo.idx + 1];
                schemaName = ExtractSchemaNameForResources(packageFolderInfo.packageFolder, schemaFolder);
            }

            return schemaName;
        }

        /// <summary>
        /// Группирует файлы по схемам
        /// </summary>
        /// <param name="schemaWithFiles">Справочник Схема и набор файлов</param>
        /// <returns></returns>
        private static List<Schema> CreateSchemaGroups(Dictionary<string, List<string>> schemaWithFiles)
        {
            foreach (var group in schemaWithFiles)
            {
                group.Value.Sort(StringComparer.OrdinalIgnoreCase);
            }

            var result = schemaWithFiles
                .OrderBy(kv => kv.Key.Equals("Other", StringComparison.OrdinalIgnoreCase) ? "zzz" : kv.Key,
                         StringComparer.OrdinalIgnoreCase)
                .Select(kv => new Schema(kv.Key, kv.Value))
                .ToList();
            return result;
        }

        /// <summary>
        /// Добавляет файл в схему
        /// </summary>
        /// <param name="schemaWithFiles">Справочник схем с файлами</param>
        /// <param name="filePath">Путь до файла</param>
        /// <param name="schemaName"></param>
        private static void AddFilePathToGroup(Dictionary<string, List<string>> schemaWithFiles, string filePath, string schemaName)
        {
            List<string> files;
            if (!schemaWithFiles.TryGetValue(schemaName, out files))
            {
                files = new List<string>();
                schemaWithFiles[schemaName] = files;
            }

            if (!files.Any(f => string.Equals(f, filePath, StringComparison.OrdinalIgnoreCase)))
            {
                files.Add(filePath);
            }
        }

        /// <summary>
        /// Изввлекает путь до базовых каталогов пакета
        /// </summary>
        /// <param name="segments">Путь до файла, разделенный по каталогам</param>
        /// <returns>Индекс каталога и его название</returns>
        private static (int idx, string packageFolder) FindPackageFolder(string[] segments)
        {
            for (int i = 0; i < segments.Length; i++)
            {
                if (PackageFolders.Contains(segments[i]))
                    return (i, segments[i]);
            }
            return (-1, null);
        }

        private static string ExtractSchemaNameForResources(string packageFolder, string artifactFolder)
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

    public sealed class Schema
    {
        public string Name { get; private set; }
        public IReadOnlyList<string> Files { get; private set; }

        public Schema(string name, IReadOnlyList<string> files)
        {
            Name = name;
            Files = files ?? new List<string>();
        }
    }
}
