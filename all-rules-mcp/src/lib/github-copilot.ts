import path from "node:path";
import type { UnifiedRule } from "../types";

export interface GitHubCopilotInstructions {
  content: string;
  sections?: {
    title?: string;
    content: string;
  }[];
}

export function parseGitHubCopilotFile(content: string, filePath: string): UnifiedRule {
  // GitHub Copilot instructions are plain Markdown without frontmatter
  // We'll extract some basic information from the content structure
  
  const lines = content.split('\n');
  let description: string | undefined;
  let name: string | undefined;
  
  // Try to extract a description from the first heading or paragraph
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check for H1 heading
    if (trimmedLine.startsWith('# ')) {
      name = trimmedLine.substring(2).trim();
      continue;
    }
    
    // Check for H2-H6 headings that might contain descriptions
    if (trimmedLine.match(/^#{2,6}\s+/)) {
      if (!description) {
        description = trimmedLine.replace(/^#{2,6}\s+/, '').trim();
      }
      continue;
    }
    
    // First non-heading line as potential description
    if (!description && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('- ') && !trimmedLine.startsWith('* ')) {
      description = trimmedLine.length > 100 ? `${trimmedLine.substring(0, 97)}...` : trimmedLine;
      break;
    }
  }
  
  // Extract technologies and languages from content
  const technologies: string[] = [];
  const languages: string[] = [];
  
  const contentLower = content.toLowerCase();
  
  // Technology detection
  const techKeywords = [
    'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'express', 
    'fastapi', 'django', 'spring', 'rails', 'typescript', 'javascript',
    'python', 'java', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
    'dart', 'csharp', 'cpp', 'node', 'nodejs', 'jest', 'vitest',
    'cypress', 'playwright', 'axios', 'fetch', 'prisma', 'sequelize'
  ];
  
  for (const tech of techKeywords) {
    if (contentLower.includes(tech) && !technologies.includes(tech)) {
      technologies.push(tech);
    }
  }
  
  // Language detection from common patterns
  const langPatterns = [
    { pattern: /typescript|\.ts[x]?/i, lang: 'typescript' },
    { pattern: /javascript|\.js[x]?/i, lang: 'javascript' },
    { pattern: /python|\.py/i, lang: 'python' },
    { pattern: /java(?!script)|\.java/i, lang: 'java' },
    { pattern: /golang|go lang|\.go/i, lang: 'go' },
    { pattern: /rust|\.rs/i, lang: 'rust' },
    { pattern: /php|\.php/i, lang: 'php' },
    { pattern: /ruby|\.rb/i, lang: 'ruby' },
    { pattern: /swift|\.swift/i, lang: 'swift' },
    { pattern: /kotlin|\.kt/i, lang: 'kotlin' },
    { pattern: /dart|\.dart/i, lang: 'dart' },
    { pattern: /c#|csharp|\.cs/i, lang: 'csharp' },
    { pattern: /c\+\+|cpp|\.cpp|\.cc/i, lang: 'cpp' }
  ];
  
  for (const { pattern, lang } of langPatterns) {
    if (pattern.test(content) && !languages.includes(lang)) {
      languages.push(lang);
    }
  }
  
  // Remove languages from technologies if they're duplicated
  const filteredTechnologies = technologies.filter(tech => !languages.includes(tech));
  
  // Extract file patterns from content (looking for common patterns)
  const filePathPatterns: string[] = [];
  const globPatterns = content.match(/\*\*\/?\*\.\w+|\*\.\w+/g);
  if (globPatterns) {
    filePathPatterns.push(...globPatterns);
  }
  
  // Look for specific file extensions mentioned in the content
  const extensionMatches = content.match(/\.\w{2,4}(?:\s|$|,|;)/g);
  if (extensionMatches) {
    const extensions = extensionMatches.map(match => 
      `**/*${match.trim().replace(/[,;]$/, '')}`
    );
    filePathPatterns.push(...extensions);
  }
  
  return {
    id: filePath,
    filePath,
    metadata: {
      name: name || path.basename(filePath, path.extname(filePath)),
      description: description || "GitHub Copilot custom instructions",
      enabled: true
    },
    scope: {
      languages: languages.length > 0 ? languages : undefined,
      technologies: filteredTechnologies.length > 0 ? filteredTechnologies : undefined,
      filePatterns: filePathPatterns.length > 0 ? filePathPatterns : undefined
    },
    context: {
      category: "style",
      priority: "medium"
    },
    source: {
      format: "copilot",
      originalFormat: "markdown"
    },
    content: content.trim()
  };
}

export function isGitHubCopilotFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return normalizedPath.includes('.github/copilot-instructions.md') ||
         normalizedPath.endsWith('copilot-instructions.md');
}