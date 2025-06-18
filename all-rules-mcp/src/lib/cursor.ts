import path from "node:path";
import type { UnifiedRule } from "../types";

export interface MdcFrontmatter {
  description?: string;
  globs?: string[];
  author?: string;
  date?: string;
  tags?: string[];
  [key: string]: string | string[] | undefined;
}

export function parseMdcFile(content: string, filePath: string): UnifiedRule {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  const frontmatter: MdcFrontmatter = {};
  let markdownContent = content;

  if (match) {
    try {
      // Parse YAML frontmatter
      const yamlContent = match[1];
      const lines = yamlContent.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;

        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex === -1) continue;

        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();

        if (value.startsWith('[') && value.endsWith(']')) {
          // Parse array
          const arrayContent = value.slice(1, -1);
          frontmatter[key] = arrayContent.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
        } else {
          // Parse string (remove quotes if present)
          frontmatter[key] = value.replace(/^["']|["']$/g, '');
        }
      }

      markdownContent = match[2];
    } catch (error) {
      console.warn(`Failed to parse frontmatter in ${filePath}:`, error);
    }
  }

  // Extract languages from globs patterns
  const languages: string[] = [];
  const technologies: string[] = [];

  if (frontmatter.globs) {
    for (const glob of frontmatter.globs) {
      // Extract file extensions to determine languages
      const extMatch = glob.match(/\*\*?\/?\*\.(\w+)$/);
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        const langMap: Record<string, string> = {
          'py': 'python',
          'js': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'jsx': 'javascript',
          'java': 'java',
          'cpp': 'cpp',
          'c': 'c',
          'rb': 'ruby',
          'go': 'go',
          'rs': 'rust',
          'php': 'php',
          'cs': 'csharp',
          'swift': 'swift',
          'kt': 'kotlin',
          'dart': 'dart',
          'vue': 'vue',
          'svelte': 'svelte'
        };

        if (langMap[ext] && !languages.includes(langMap[ext])) {
          languages.push(langMap[ext]);
        }
      }
    }
  }

  // Extract technologies from tags
  if (frontmatter.tags) {
    const techKeywords = ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'express', 'fastapi', 'django', 'spring', 'rails'];
    for (const tag of frontmatter.tags) {
      const tagLower = tag.toLowerCase();
      if (techKeywords.includes(tagLower) && !technologies.includes(tagLower)) {
        technologies.push(tagLower);
      }
    }
  }

  // Determine source format from file path
  let sourceFormat: UnifiedRule['source']['format'] = 'unknown';
  if (filePath.includes('.cursor') || filePath.includes('cursor')) {
    sourceFormat = 'cursor';
  } else if (filePath.includes('cline')) {
    sourceFormat = 'cline';
  } else if (filePath.includes('continue')) {
    sourceFormat = 'continue';
  } else if (filePath.includes('windsurf')) {
    sourceFormat = 'windsurf';
  } else if (filePath.includes('copilot')) {
    sourceFormat = 'copilot';
  }

  return {
    id: filePath,
    filePath,
    metadata: {
      name: frontmatter.description || path.basename(filePath, path.extname(filePath)),
      description: frontmatter.description,
      author: frontmatter.author,
      created: frontmatter.date,
      tags: frontmatter.tags,
      enabled: true
    },
    scope: {
      languages: languages.length > 0 ? languages : undefined,
      technologies: technologies.length > 0 ? technologies : undefined,
      filePatterns: frontmatter.globs
    },
    context: {
      category: "style", // Default for cursor rules
      priority: "medium"
    },
    source: {
      format: sourceFormat,
      originalFormat: "mdc",
      frontmatter: frontmatter as Record<string, unknown>
    },
    content: markdownContent.trim()
  };
}