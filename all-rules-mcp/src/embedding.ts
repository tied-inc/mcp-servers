// Embedding function interface for compatibility
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import type { EmbeddingModel } from "ai"

// Provider types
export type EmbeddingProvider = "openai" | "google"

// Main function to get embedding function based on environment variables
export function getEmbeddingFunction(): EmbeddingModel<string> {
  const provider = (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) || "openai"

  switch (provider) {
    case "openai": {
      const openaiModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
      return openai.embedding(openaiModel)
    }

    case "google": {
      const googleModel = process.env.GOOGLE_EMBEDDING_MODEL || "text-embedding-004"
      return google.textEmbeddingModel(googleModel)
    }

    default:
      throw new Error(`Unsupported embedding provider: ${provider}`)
  }
}
