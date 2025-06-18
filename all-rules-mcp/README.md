# All Rules MCP Server

An MCP (Model Context Protocol) server that unifies and manages AI editor rules across different platforms and formats. This server provides semantic search and management capabilities for coding rules from various AI-powered editors including Cursor, Cline, GitHub Copilot, Continue, and Windsurf.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- API key for OpenAI or Google (for embeddings)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd all-rules-mcp
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Configure your embedding provider in `.env`:**
```env
# For OpenAI (recommended)
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Or for Google
EMBEDDING_PROVIDER=google
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_EMBEDDING_MODEL=text-embedding-004
```

4. **Start the server:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `RULES_DIR` | Rules directory | `rules-example` |
| `EMBEDDING_PROVIDER` | Provider (`openai`, `google`) | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_EMBEDDING_MODEL` | OpenAI model | `text-embedding-3-small` |
| `GOOGLE_API_KEY` | Google API key | - |
| `GOOGLE_EMBEDDING_MODEL` | Google model | `text-embedding-004` |

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "all-rules-mcp": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "EMBEDDING_PROVIDER": "openai",
        "OPENAI_API_KEY": "your-key-here",
        "RULES_DIR": "/path/to/your/rules"
      }
    }
  }
}
```

## MCP Usage

### Quick Test

After starting the server, test with curl:

```bash
# List all rules
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "list_ai_rules", "arguments": {}}}'

# Search rules
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "search_ai_rules", "arguments": {"query": "Python naming conventions", "limit": 3}}}'
```

Or use the test client:
```bash
node test-client.js
```

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
      },
      "filePath": "/path/to/rule.mdc"
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

**Example response:**
```json
{
  "query": "Python naming conventions",
  "totalResults": 2,
  "rules": [
    {
      "id": "/path/to/python-rule.mdc",
      "name": "Python Variable Naming",
      "content": "Use snake_case for Python variables...",
      "similarity": 0.95,
      "sourceFormat": "cursor",
      "scope": {
        "languages": ["python"]
      }
    }
  ]
}
```

### Supported Filters

- `language`: Filter by programming language (e.g., "python", "typescript")
- `category`: Filter by rule category (e.g., "style", "security", "performance")
- `priority`: Filter by priority level (e.g., "high", "medium", "low")
- `technology`: Filter by technology (e.g., "react", "node")
- `framework`: Filter by framework (e.g., "express", "fastapi")

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

## Features

### 🔍 **Unified Rule Management**
- **Multi-format Support**: Parse and unify rules from different AI editors:
  - Cursor (.mdc files with frontmatter)
  - Cline (YAML, JSON, and Markdown formats)
  - GitHub Copilot instruction files
  - Generic Markdown and text files
- **Semantic Search**: Vector-based search using LibSQL and AI SDK embeddings
- **Structured Data**: Consistent rule schema with metadata, scope, and context

### 🎯 **Smart Rule Organization**
- **Scoped Rules**: Target specific languages, frameworks, technologies, and tasks
- **Priority System**: Categorize rules by importance (low, medium, high, critical)
- **Context-Aware**: Rules organized by category (style, syntax, architecture, security, performance, testing, documentation)
- **Metadata Filtering**: Filter results by language, category, priority, technology, and framework

### 🚀 **MCP Integration**
- **FastMCP Framework**: Built on the FastMCP library for efficient MCP server implementation
- **Tool-based Interface**: Expose functionality through MCP tools
- **Real-time Search**: Query rules using natural language with filters and limits
- **Similarity Scoring**: Search results include relevance scores

## Architecture

### Vector Storage
- **LibSQL Vector**: Fast, local vector database using Mastra's LibSQL integration
- **Local File Storage**: Database stored as `rules.db` in project root
- **Persistent Storage**: Rules and embeddings persist across server restarts
- **Optimized Search**: Cosine similarity search with metadata filtering

### Embedding Providers
- **OpenAI**: `text-embedding-3-small` (default) or `text-embedding-3-large`
- **Google**: `text-embedding-004` or other Google AI embedding models
- **AI SDK Integration**: Unified API for multiple providers

### Rule Processing
1. **File Discovery**: Scans configured directory for rule files
2. **Format Detection**: Automatically detects and parses different rule formats
3. **Unified Schema**: Converts all rules to consistent UnifiedRule interface
4. **Embedding Generation**: Creates vector embeddings for semantic search
5. **Database Storage**: Stores rules and embeddings in LibSQL vector database

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
│   ├── database.ts        # LibSQL vector database integration
│   ├── embedding.ts       # AI SDK embedding integration
│   ├── types.ts           # TypeScript interfaces
│   └── lib/
│       ├── cursor.ts      # Cursor .mdc parser
│       ├── cline.ts       # Cline rule parser
│       └── github-copilot.ts # GitHub Copilot parser
├── rules-example/         # Sample rule files
│   ├── sample-cursor-rule.mdc
│   ├── cline-yaml-rules.yaml
│   └── cline-json-rules.json
├── test-client.js         # Test client for MCP tools
├── .env.example           # Environment configuration template
├── rules.db              # LibSQL vector database (created automatically)
└── package.json
```

---

## Development Documentation

### Configuration

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `RULES_DIR` | Rules directory | `rules-example` |
| `EMBEDDING_PROVIDER` | Provider (`openai`, `google`) | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_EMBEDDING_MODEL` | OpenAI model | `text-embedding-3-small` |
| `GOOGLE_API_KEY` | Google API key | - |
| `GOOGLE_EMBEDDING_MODEL` | Google model | `text-embedding-004` |

#### Supported File Extensions
The server automatically scans for files with these patterns:
- `.md`, `.mdc`, `.yaml`, `.json`, `.txt`
- Files containing "rules" in the name
- GitHub Copilot instruction files
- Cline configuration files

#### Scripts
```bash
npm run dev      # Start development server with hot reload (tsx)
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
```

#### Dependencies
- **fastmcp**: MCP server framework
- **@mastra/libsql**: Vector database for semantic search
- **@ai-sdk/openai**: OpenAI integration via AI SDK
- **@ai-sdk/google**: Google AI integration via AI SDK
- **ai**: Core AI SDK for embeddings
- **zod**: Runtime type validation

#### Adding New Rule Formats

1. Create a new parser in `src/lib/`
2. Add format detection logic
3. Implement UnifiedRule conversion
4. Update `scanAndIndexRules` in `server.ts`

#### Testing

```bash
# Start server
npm run dev

# Test with curl
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "list_ai_rules", "arguments": {}}}'

# Test with Node.js client
node test-client.js
```

#### Performance

- **Fast Startup**: LibSQL vector database initializes quickly
- **Efficient Search**: Optimized cosine similarity with metadata filtering
- **Local Storage**: No external dependencies for vector search
- **Persistent Cache**: Embeddings cached between server restarts
- **Streaming Support**: FastMCP HTTP streaming for real-time responses

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
- [Mastra](https://mastra.ai/)
- [AI SDK](https://sdk.vercel.ai/)
- [OpenAI API](https://platform.openai.com/)
- [Google AI](https://ai.google.dev/)