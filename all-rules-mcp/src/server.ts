import { FastMCP } from "fastmcp";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getEmbeddingFunction } from "./embedding.js";
import { RulesDatabase } from "./database.js";
import type { UnifiedRule } from "./types.js";
import { parseMdcFile } from "./lib/cursor.js";
import { parseGitHubCopilotFile, isGitHubCopilotFile } from "./lib/github-copilot.js";
import { parseClineFile, isClineFile } from "./lib/cline.js";
import { embed } from "ai";

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : 3001;
const RULES_DIR = process.env.RULES_DIR || path.join(process.cwd(), "rules-example");


let database: RulesDatabase | null = null;
const embeddingModel = getEmbeddingFunction();


async function initializeDatabaseAndLoadRules() {
  if (database) return;

  try {
    console.log("Initializing LibSQL database...");
    database = new RulesDatabase();
    await database.initialize();

    console.log(`Scanning rules directory: ${RULES_DIR}`);
    await scanAndIndexRules(RULES_DIR);
    const ruleCount = await database.getRuleCount();
    console.log(`${ruleCount} rules loaded and indexed in LibSQL database.`);
  } catch (error) {
    console.error("Error initializing database or loading rules:", error);
    database = null;
    throw error;
  }
}

async function scanDirectoryRecursive(dir: string): Promise<string[]> {
  let files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(await scanDirectoryRecursive(fullPath));
      } else {
        if (/\.(md|mdc|yaml|json|txt)$/i.test(entry.name) ||
            entry.name.toLowerCase().includes("rules") ||
            isGitHubCopilotFile(fullPath) ||
            isClineFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === "ENOENT") {
      console.warn(`Rules directory or subdirectory not found: ${dir}. Skipping.`);
    } else {
      throw err;
    }
  }
  return files;
}

async function scanAndIndexRules(rootDir: string) {
  const ruleFilePaths = await scanDirectoryRecursive(rootDir);
  if (ruleFilePaths.length === 0) {
    console.warn(`No rule files found in ${rootDir}.`);
    return;
  }

  const rulesWithEmbeddings: Array<{ rule: UnifiedRule; embedding: number[] }> = [];

  for (const filePath of ruleFilePaths) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const fileExt = path.extname(filePath).toLowerCase();

      let rule: UnifiedRule;

      if (fileExt === '.mdc') {
        rule = parseMdcFile(content, filePath);
      } else if (isGitHubCopilotFile(filePath)) {
        rule = parseGitHubCopilotFile(content, filePath);
      } else if (isClineFile(filePath)) {
        rule = parseClineFile(content, filePath);
      } else {
        rule = {
          id: filePath,
          filePath,
          metadata: {
            name: path.basename(filePath),
            enabled: true
          },
          source: {
            format: "unknown",
            originalFormat: "text"
          },
          content
        };
      }

      // Generate embedding for the rule
      const textToEmbed = `${rule.metadata.name || ""}\n${rule.metadata.description || ""}\n${rule.content}`;
      console.log(`Generating embedding for rule: ${rule.metadata.name || path.basename(filePath)}`);
      
      const { embedding } = await embed({
        model: embeddingModel,
        value: textToEmbed,
      });

      rulesWithEmbeddings.push({ rule, embedding });

    } catch (error) {
      console.error(`Error processing rule file ${filePath}:`, error);
    }
  }

  if (database && rulesWithEmbeddings.length > 0) {
    console.log(`Inserting ${rulesWithEmbeddings.length} rules into database...`);
    await database.insertRules(rulesWithEmbeddings);
  }
}

// Create FastMCP server instance
const server = new FastMCP({
  name: "AI Editor Rules Server",
  version: "1.0.1",
});

// List all AI rules tool
server.addTool({
  name: "list_ai_rules",
  description: "List all available AI editor rules",
  execute: async () => {
    if (!database) {
      throw new Error("Database not initialized or rules not loaded.");
    }

    const allRules = await database.getAllRules();
    return JSON.stringify({
      totalRules: allRules.length,
      rules: allRules.map(rule => ({
        id: rule.id,
        name: rule.metadata.name,
        description: rule.metadata.description,
        sourceFormat: rule.source.format,
        category: rule.context?.category,
        priority: rule.context?.priority,
        scope: rule.scope,
        filePath: rule.filePath
      }))
    }, null, 2);
  },
});

// Search AI rules tool
server.addTool({
  name: "search_ai_rules",
  description: "Search AI editor rules using natural language query with parameters: query (required string), limit (optional number, default 5), filters (optional object)",
  execute: async (args: unknown) => {
    if (!database) {
      throw new Error("Database not initialized or rules not loaded.");
    }

    const argsObj = args as Record<string, unknown>;
    const query = argsObj.query as string;
    const limit = (argsObj.limit as number) || 5;
    const filters = (argsObj.filters as Record<string, string>) || {};

    if (!query) {
      throw new Error("Query parameter is required");
    }

    try {
      // Generate embedding for the query
      const { embedding: queryEmbedding } = await embed({
        model: embeddingModel,
        value: query,
      });

      // Search using the database
      const results = await database.searchRulesByEmbedding(queryEmbedding, limit, filters);

      return JSON.stringify({
        query,
        totalResults: results.length,
        rules: results.map(result => ({
          ...result.rule,
          similarity: result.similarity
        }))
      }, null, 2);
    } catch (error) {
      console.error("Error querying database:", error);
      throw new Error("Failed to query rules from database.");
    }
  },
});

// Server event handlers
server.on("connect", (event: { session: unknown }) => {
  console.log("Client connected:", event.session);
});

server.on("disconnect", (event: { session: unknown }) => {
  console.log("Client disconnected:", event.session);
});

async function startServer() {
  try {
    await initializeDatabaseAndLoadRules();

    // Start the FastMCP server with HTTP streaming
    server.start({
      transportType: "httpStream",
      httpStream: {
        port: PORT,
      },
    });

    console.log(`FastMCP Server listening on port ${PORT}`);
    console.log("MCP endpoint: /mcp");
    console.log(`Serving rules from: ${path.resolve(RULES_DIR)}`);
  } catch (error) {
    console.error("Failed to start FastMCP server:", error);
    process.exit(1);
  }
}

startServer();
