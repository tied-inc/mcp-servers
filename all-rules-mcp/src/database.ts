import { LibSQLVector } from "@mastra/libsql";
import path from "node:path";
import type { UnifiedRule } from "./types.js";

export interface RuleMetadata {
  id: string;
  filePath: string;
  name?: string;
  description?: string;
  content: string;
  sourceFormat: string;
  category?: string;
  priority?: string;
  language?: string;
  task?: string;
  technology?: string;
  framework?: string;
}

export class RulesDatabase {
  private store: LibSQLVector;
  private indexName = "ai_rules";
  private dimension: number;

  constructor(dbPath?: string, dimension?: number) {
    const dbFile = dbPath || path.join(process.cwd(), "rules.db");
    this.dimension = dimension || 1536;

    this.store = new LibSQLVector({
      connectionUrl: `file:${dbFile}`
    });
  }

  async initialize(): Promise<void> {
    const dbFile = path.join(process.cwd(), "rules.db");
    console.log(`Initializing LibSQL vector database at: ${dbFile}`);

    try {
      // Create vector index if it doesn't exist
      await this.store.createIndex({
        indexName: this.indexName,
        dimension: this.dimension
      });
      console.log(`Vector index "${this.indexName}" created/verified with dimension ${this.dimension}`);
    } catch (error) {
      // Index might already exist, that's okay
      console.log(`Vector index "${this.indexName}" already exists or created successfully`);
    }
  }

  async insertRule(rule: UnifiedRule, embedding: number[]): Promise<void> {
    const metadata: RuleMetadata = {
      id: rule.id,
      filePath: rule.filePath,
      name: rule.metadata.name,
      description: rule.metadata.description,
      content: rule.content,
      sourceFormat: rule.source.format,
      category: rule.context?.category,
      priority: rule.context?.priority,
      language: rule.scope?.languages?.join(","),
      task: rule.scope?.tasks?.join(","),
      technology: rule.scope?.technologies?.join(","),
      framework: rule.scope?.frameworks?.join(",")
    };

    await this.store.upsert({
      indexName: this.indexName,
      vectors: [embedding],
      metadata: [metadata]
    });
  }

  async insertRules(rulesWithEmbeddings: Array<{ rule: UnifiedRule; embedding: number[] }>): Promise<void> {
    const vectors = rulesWithEmbeddings.map(({ embedding }) => embedding);
    const metadata = rulesWithEmbeddings.map(({ rule }) => {
      const meta: RuleMetadata = {
        id: rule.id,
        filePath: rule.filePath,
        name: rule.metadata.name,
        description: rule.metadata.description,
        content: rule.content,
        sourceFormat: rule.source.format,
        category: rule.context?.category,
        priority: rule.context?.priority,
        language: rule.scope?.languages?.join(","),
        task: rule.scope?.tasks?.join(","),
        technology: rule.scope?.technologies?.join(","),
        framework: rule.scope?.frameworks?.join(",")
      };
      return meta;
    });

    await this.store.upsert({
      indexName: this.indexName,
      vectors,
      metadata
    });
  }

  async searchRulesByEmbedding(
    queryEmbedding: number[],
    limit: number = 5,
    filters?: Record<string, string>
  ): Promise<Array<{ rule: UnifiedRule; similarity: number }>> {

    // Build metadata filter using Mastra's filter format
    let filter: Record<string, any> | undefined;
    if (filters && Object.keys(filters).length > 0) {
      const conditions: Record<string, any>[] = [];

      for (const [key, value] of Object.entries(filters)) {
        switch (key) {
          case "language":
            conditions.push({ language: { "$contains": value } });
            break;
          case "category":
            conditions.push({ category: { "$eq": value } });
            break;
          case "priority":
            conditions.push({ priority: { "$eq": value } });
            break;
          case "technology":
            conditions.push({ technology: { "$contains": value } });
            break;
          case "framework":
            conditions.push({ framework: { "$contains": value } });
            break;
        }
      }

      if (conditions.length > 0) {
        filter = conditions.length === 1 ? conditions[0] : { "$and": conditions };
      }
    }

    const results = await this.store.query({
      indexName: this.indexName,
      queryVector: queryEmbedding,
      topK: limit,
      filter
    });

    return results.map(result => ({
      rule: this.metadataToUnifiedRule(result.metadata as RuleMetadata),
      similarity: result.score || 0
    }));
  }

  async getAllRules(): Promise<UnifiedRule[]> {
    // Get all vectors (this might not be the most efficient for large datasets)
    const results = await this.store.query({
      indexName: this.indexName,
      queryVector: new Array(this.dimension).fill(0), // Zero vector to get all results
      topK: 10000 // Large number to get all
    });

    return results.map(result => this.metadataToUnifiedRule(result.metadata as RuleMetadata));
  }

  async getRuleCount(): Promise<number> {
    // LibSQL Vector doesn't have a direct count method, so we query all and count
    const results = await this.store.query({
      indexName: this.indexName,
      queryVector: new Array(this.dimension).fill(0),
      topK: 10000
    });

    return results.length;
  }

  private metadataToUnifiedRule(metadata: RuleMetadata): UnifiedRule {
    const languages = metadata.language ? metadata.language.split(",") : undefined;
    const tasks = metadata.task ? metadata.task.split(",") : undefined;
    const technologies = metadata.technology ? metadata.technology.split(",") : undefined;
    const frameworks = metadata.framework ? metadata.framework.split(",") : undefined;

    const validPriority = metadata.priority && ["low", "medium", "high", "critical"].includes(metadata.priority)
      ? metadata.priority as "low" | "medium" | "high" | "critical"
      : undefined;

    const validSourceFormat = ["cursor", "cline", "continue", "windsurf", "copilot", "unknown"].includes(metadata.sourceFormat)
      ? metadata.sourceFormat as "cursor" | "cline" | "continue" | "windsurf" | "copilot" | "unknown"
      : "unknown";

    const validCategory = metadata.category && ["style", "syntax", "architecture", "security", "performance", "testing", "documentation"].includes(metadata.category)
      ? metadata.category as "style" | "syntax" | "architecture" | "security" | "performance" | "testing" | "documentation"
      : undefined;

    return {
      id: metadata.id,
      filePath: metadata.filePath,
      metadata: {
        name: metadata.name,
        description: metadata.description,
        enabled: true
      },
      scope: (languages || tasks || technologies || frameworks) ? {
        languages,
        tasks,
        technologies,
        frameworks
      } : undefined,
      context: (validCategory || validPriority) ? {
        category: validCategory,
        priority: validPriority
      } : undefined,
      source: {
        format: validSourceFormat,
        originalFormat: "text"
      },
      content: metadata.content
    };
  }
}