import path from "node:path";
import type { UnifiedRule } from "../types";

export interface ClineRule {
  name?: string;
  description?: string;
  appliesTo?: string[];
  content?: string;
  enabled?: boolean;
}

export interface ClineRuleFile {
  rules: ClineRule[];
  format: "markdown" | "yaml" | "json";
}

export function parseClineFile(content: string, filePath: string): UnifiedRule {
  const trimmedContent = content.trim();
  let rules: ClineRule[] = [];
  let format: "markdown" | "yaml" | "json" = "markdown";
  
  // Detect file format
  if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
    // JSON array format
    try {
      const jsonRules = JSON.parse(trimmedContent) as ClineRule[];
      if (Array.isArray(jsonRules)) {
        rules = jsonRules;
        format = "json";
      }
    } catch (error) {
      console.warn(`Failed to parse JSON in ${filePath}:`, error);
    }
  } else if (trimmedContent.startsWith('- name:') || trimmedContent.includes('\n- name:')) {
    // YAML array format
    try {
      rules = parseYamlRules(trimmedContent);
      format = "yaml";
    } catch (error) {
      console.warn(`Failed to parse YAML in ${filePath}:`, error);
    }
  }
  
  // If structured parsing failed or content is plain text/markdown, treat as single rule
  if (rules.length === 0) {
    rules = [{
      name: extractTitleFromMarkdown(content),
      description: extractDescriptionFromMarkdown(content),
      content: content,
      enabled: true
    }];
    format = "markdown";
  }
  
  // Extract technologies and languages from all rules
  const technologies: string[] = [];
  const languages: string[] = [];
  const allContent = rules.map(rule => 
    `${rule.name || ''} ${rule.description || ''} ${rule.content || ''}`
  ).join(' ').toLowerCase();
  
  // Technology detection
  const techKeywords = [
    'tdd', 'test-driven', 'typescript', 'react', 'vue', 'angular', 'svelte', 
    'next', 'nuxt', 'express', 'fastapi', 'django', 'spring', 'rails',
    'jest', 'vitest', 'cypress', 'playwright', 'docker', 'kubernetes',
    'prisma', 'sequelize', 'mongodb', 'postgresql', 'mysql', 'redis'
  ];
  
  for (const tech of techKeywords) {
    if (allContent.includes(tech) && !technologies.includes(tech)) {
      technologies.push(tech);
    }
  }
  
  // Language detection
  const langPatterns = [
    { pattern: /typescript|\.ts[x]?/i, lang: 'typescript' },
    { pattern: /javascript|\.js[x]?/i, lang: 'javascript' },
    { pattern: /python|\.py|snake_case/i, lang: 'python' },
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
  
  // Extract file patterns
  const filePathPatterns: string[] = [];
  if (rules.some(rule => rule.appliesTo && rule.appliesTo.length > 0)) {
    for (const rule of rules) {
      if (rule.appliesTo) {
        filePathPatterns.push(...rule.appliesTo);
      }
    }
  }
  
  // Look for file patterns in content
  const globPatterns = content.match(/\*\*\/?\*\.\w+|\*\.\w+/g);
  if (globPatterns) {
    filePathPatterns.push(...globPatterns);
  }
  
  // Get primary rule for name and description
  const primaryRule = rules[0] || {};
  const combinedContent = rules.map(rule => rule.content || rule.description || '').join('\n\n').trim();
  
  return {
    id: filePath,
    filePath,
    metadata: {
      name: primaryRule.name || extractTitleFromMarkdown(content) || path.basename(filePath, path.extname(filePath)),
      description: primaryRule.description || extractDescriptionFromMarkdown(content) || "Cline project rules",
      enabled: primaryRule.enabled !== false
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
      format: "cline",
      originalFormat: format
    },
    content: combinedContent || content.trim()
  };
}

function parseYamlRules(yamlContent: string): ClineRule[] {
  const rules: ClineRule[] = [];
  const lines = yamlContent.split('\n');
  let currentRule: Partial<ClineRule> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    if (trimmedLine.startsWith('- name:')) {
      // Save previous rule and start new one
      if (currentRule.name || currentRule.description) {
        rules.push(currentRule as ClineRule);
      }
      currentRule = { name: trimmedLine.substring(7).trim().replace(/^["']|["']$/g, '') };
    } else if (trimmedLine.startsWith('name:')) {
      currentRule.name = trimmedLine.substring(5).trim().replace(/^["']|["']$/g, '');
    } else if (trimmedLine.startsWith('description:')) {
      currentRule.description = trimmedLine.substring(12).trim().replace(/^["']|["']$/g, '');
    } else if (trimmedLine.startsWith('content:')) {
      currentRule.content = trimmedLine.substring(8).trim().replace(/^["']|["']$/g, '');
    } else if (trimmedLine.startsWith('enabled:')) {
      currentRule.enabled = trimmedLine.substring(8).trim() === 'true';
    } else if (trimmedLine.startsWith('appliesTo:')) {
      currentRule.appliesTo = [];
    } else if (trimmedLine.startsWith('- ') && currentRule.appliesTo) {
      currentRule.appliesTo.push(trimmedLine.substring(2).trim().replace(/^["']|["']$/g, ''));
    }
  }
  
  // Save last rule
  if (currentRule.name || currentRule.description) {
    rules.push(currentRule as ClineRule);
  }
  
  return rules;
}

function extractTitleFromMarkdown(content: string): string | undefined {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('# ')) {
      return trimmedLine.substring(2).trim();
    }
  }
  return undefined;
}

function extractDescriptionFromMarkdown(content: string): string | undefined {
  const lines = content.split('\n');
  let foundTitle = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    if (trimmedLine.startsWith('# ')) {
      foundTitle = true;
      continue;
    }
    
    // First non-empty line after title, or first non-title line
    if ((foundTitle || !trimmedLine.startsWith('#')) && 
        !trimmedLine.startsWith('- ') && 
        !trimmedLine.startsWith('* ') &&
        !trimmedLine.startsWith('```')) {
      return trimmedLine.length > 100 ? `${trimmedLine.substring(0, 97)}...` : trimmedLine;
    }
  }
  
  return undefined;
}

export function isClineFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = path.basename(normalizedPath);
  
  return fileName === '.clinerules' || 
         normalizedPath.includes('.clinerules/') ||
         fileName.includes('clinerules');
}