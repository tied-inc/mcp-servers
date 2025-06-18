# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo workspace containing MCP (Model Context Protocol) servers. The main project is `all-rules-mcp`, which provides an AI editor rules server that indexes and searches coding rules using ChromaDB and local embeddings via Ollama.

## Development Commands

### All Rules MCP Server (all-rules-mcp/)
- `npm run dev` - Start development server with hot reload using ts-node-dev
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run start` - Run compiled server from dist/

### Root Level
- Uses npm workspaces to manage the all-rules-mcp package

## Architecture

The all-rules-mcp server is built as an Express.js application that serves MCP resources:

**Core Components:**
- `src/server.ts` - Main Express server with MCP endpoint at `/mcp`
- `src/embedding.ts` - Ollama integration for generating embeddings
- ChromaDB in-memory collection for vector search of rules

**Key Flows:**
1. Server startup scans RULES_DIR (default: `rules-example/`) for rule files
2. Rules are parsed into UnifiedRule format and indexed in ChromaDB
3. MCP clients can query rules via `get_ai_rules` resource with natural language
4. Supports filtering by metadata (language, task, etc.)

**Rule Format:**
Rules are stored as files (.md, .yaml, .json, .txt) and converted to UnifiedRule objects with:
- Unified format supporting multiple AI editor rule types (Cursor, Cline, Continue, etc.)
- Metadata for language/task/technology filtering
- Vector embeddings for semantic search

**Configuration:**
- PORT: Server port (default 3001)
- RULES_DIR: Directory containing rule files
- EMBEDDING_PROVIDER: Embedding provider ("openai", "google", "ollama", default "openai")

**OpenAI Configuration:**
- OPENAI_API_KEY: OpenAI API key (required for OpenAI provider)
- OPENAI_EMBEDDING_MODEL: OpenAI embedding model (default "text-embedding-3-small")

**Google Configuration:**
- GOOGLE_API_KEY: Google API key (required for Google provider)
- GOOGLE_EMBEDDING_MODEL: Google embedding model (default "text-embedding-004")

**Ollama Configuration (Legacy):**
- OLLAMA_EMBEDDING_MODEL: Embedding model (default "mxbai-embed-large")
- OLLAMA_HOST: Ollama server URL (default "http://127.0.0.1:11434")

## External Dependencies

- Uses AI SDK for OpenAI and Google embeddings
- ChromaDB runs in-memory (no persistence)
- Designed to work with MCP-compatible AI editors
- Requires API keys for cloud providers (OpenAI/Google)