// Core rule metadata
export interface RuleMetadata {
  name?: string;
  description?: string;
  author?: string;
  version?: string;
  created?: string;
  modified?: string;
  tags?: string[];
  enabled?: boolean;
}

// Rule scope and applicability
export interface RuleScope {
  languages?: string[];
  frameworks?: string[];
  technologies?: string[];
  tasks?: string[];
  filePatterns?: string[];
  directories?: string[];
  environments?: string[]; // dev, prod, test, etc.
}

// Rule priority and execution context
export interface RuleContext {
  priority?: "low" | "medium" | "high" | "critical";
  category?: "style" | "syntax" | "architecture" | "security" | "performance" | "testing" | "documentation";
  enforcement?: "error" | "warning" | "suggestion" | "info";
  inheritFrom?: string[]; // Rule inheritance/composition
}

// Source-specific metadata (preserves original format info)
export interface SourceMetadata {
  format: "cursor" | "cline" | "continue" | "windsurf" | "copilot" | "unknown";
  originalFormat?: "markdown" | "yaml" | "json" | "mdc" | "text";
  frontmatter?: Record<string, unknown>; // Original frontmatter/metadata
  sections?: Array<{
    title?: string;
    content: string;
    type?: string;
  }>;
}

// Unified rule interface
export interface UnifiedRule {
  // Core identification
  id: string;
  filePath: string;
  
  // Rule metadata
  metadata: RuleMetadata;
  
  // Applicability scope
  scope?: RuleScope;
  
  // Execution context
  context?: RuleContext;
  
  // Source information
  source: SourceMetadata;
  
  // Rule content
  content: string;
  
  // Additional structured data (examples, code samples, etc.)
  examples?: Array<{
    title?: string;
    description?: string;
    code: string;
    language?: string;
    good?: boolean; // true for good examples, false for bad examples
  }>;
  
  // Related rules or references
  references?: Array<{
    type: "rule" | "documentation" | "external";
    url?: string;
    title?: string;
    description?: string;
  }>;
}