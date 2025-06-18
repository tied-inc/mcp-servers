# All Rules MCP Server

An MCP (Model Context Protocol) server that unifies and manages AI editor rules across different platforms and formats. This server provides semantic search and management capabilities for coding rules from various AI-powered editors including Cursor, Cline, GitHub Copilot, Continue, and Windsurf.

## Features

### 🔍 **Unified Rule Management**
- **Multi-format Support**: Parse and unify rules from different AI editors:
  - Cursor (.mdc files with frontmatter)
  - Cline (YAML, JSON, and Markdown formats)
  - GitHub Copilot instruction files
  - Generic Markdown and text files
- **Semantic Search**: Vector-based search using ChromaDB and Ollama embeddings
- **Structured Data**: Consistent rule schema with metadata, scope, and context

### 🎯 **Smart Rule Organization**
- **Scoped Rules**: Target specific languages, frameworks, technologies, and tasks
- **Priority System**: Categorize rules by importance (low, medium, high, critical)
- **Context-Aware**: Rules organized by category (style, syntax, architecture, security, performance, testing, documentation)
- **Inheritance**: Support for rule composition and inheritance

### 🚀 **MCP Integration**
- **FastMCP Framework**: Built on the FastMCP library for efficient MCP server implementation
- **Tool-based Interface**: Expose functionality through MCP tools
- **Real-time Search**: Query rules using natural language with filters and limits

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Ollama (for embeddings) - [Install Ollama](https://ollama.ai/)

### Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd all-rules-mcp
npm install
```

2. **Start Ollama service:**
```bash
ollama serve
```

3. **Pull required embedding model:**
```bash
ollama pull nomic-embed-text
```

4. **Configure environment (optional):**
```bash
export PORT=3001
export RULES_DIR=/path/to/your/rules
```

5. **Start the server:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Usage

### MCP Tools

The server exposes two main MCP tools:

#### 1. `list_ai_rules`
Lists all available AI editor rules with metadata.

**Example response:**
```json
{
  "totalRules": 15,
  "rules": [
    {
      "id": "/path/to/rule.mdc",
      "name": "Python naming convention",
      "description": "Use snake_case for all variables in Python",
      "sourceFormat": "cursor",
      "category": "style",
      "priority": "medium",
      "scope": {
        "languages": ["python"],
        "tasks": ["coding"]
      }
    }
  ]
}
```

#### 2. `search_ai_rules`
Search rules using natural language queries with optional filters.

**Parameters:**
- `query` (required): Natural language search query
- `limit` (optional): Maximum number of results (default: 5)
- `filters` (optional): Filter criteria object

**Example:**
```json
{
  "query": "Python naming conventions",
  "limit": 3,
  "filters": {
    "language": "python",
    "category": "style"
  }
}
```

### Rule Formats

#### Cursor Rules (.mdc)
```markdown
tags: ["python", "style", "naming"]
---

# Python Variable Naming

Use snake_case for all Python variables:
- Variables: `user_name`
- Classes: `UserManager`
- Constants: `MAX_RETRY_COUNT`
```

#### Cline Rules (YAML)
```yaml
- name: Python naming convention
  description: Use snake_case for all variables in Python
  appliesTo:
    - "**/*.py"
  enabled: true
```

#### Cline Rules (JSON)
```json
{
  "rules": [
    {
      "name": "TypeScript strict mode",
      "description": "Enforce strict type checking",
      "appliesTo": ["**/*.ts", "**/*.tsx"],
      "enabled": true
    }
  ]
}
```

## Rule Schema

### UnifiedRule Interface
```typescript
interface UnifiedRule {
  id: string;
  filePath: string;
  metadata: {
    name?: string;
    description?: string;
    author?: string;
    version?: string;
    tags?: string[];
    enabled?: boolean;
  };
  scope?: {
    languages?: string[];
    frameworks?: string[];
    technologies?: string[];
    tasks?: string[];
    filePatterns?: string[];
  };
  context?: {
    priority?: "low" | "medium" | "high" | "critical";
    category?: "style" | "syntax" | "architecture" | "security" | "performance" | "testing" | "documentation";
    enforcement?: "error" | "warning" | "suggestion" | "info";
  };
  source: {
    format: "cursor" | "cline" | "continue" | "windsurf" | "copilot" | "unknown";
    originalFormat?: "markdown" | "yaml" | "json" | "mdc" | "text";
  };
  content: string;
  examples?: Array<{
    title?: string;
    code: string;
    language?: string;
    good?: boolean;
  }>;
}
```

## Directory Structure

```
all-rules-mcp/
├── src/
│   ├── server.ts          # Main MCP server
│   ├── types.ts           # TypeScript interfaces
│   ├── embedding.ts       # Ollama embedding integration
│   └── lib/
│       ├── cursor.ts      # Cursor .mdc parser
│       ├── cline.ts       # Cline rule parser
│       └── github-copilot.ts # GitHub Copilot parser
├── test-data/             # Sample rule files
│   ├── sample-cursor-rule.mdc
│   ├── cline-yaml-rules.yaml
│   └── cline-json-rules.json
└── package.json
```

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3001)
- `RULES_DIR`: Directory containing rule files (default: ./rules-example)

### Supported File Extensions
The server automatically scans for files with these patterns:
- `.md`, `.mdc`, `.yaml`, `.json`, `.txt`
- Files containing "rules" in the name
- GitHub Copilot instruction files
- Cline configuration files

## Development

### Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
```

### Dependencies
- **fastmcp**: MCP server framework
- **chromadb**: Vector database for semantic search
- **ollama**: Local LLM and embedding models
- **zod**: Runtime type validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

ISC License

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [FastMCP](https://github.com/jlowin/fastmcp)
- [ChromaDB](https://www.trychroma.com/)
- [Ollama](https://ollama.ai/)