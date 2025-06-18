FROM node:22.12-alpine AS builder

# Copy project files
COPY package*.json tsconfig.json ./
COPY src ./src
COPY rules-example ./rules-example

WORKDIR /

# Install dependencies with npm cache
RUN --mount=type=cache,target=/root/.npm npm install

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies
RUN npm ci --ignore-scripts --omit-dev

FROM node:22-alpine AS release

# Copy built artifacts and package files
COPY --from=builder /dist /app/dist
COPY --from=builder /package*.json /app/
COPY --from=builder /rules-example /app/rules-example
COPY --from=builder /node_modules /app/node_modules

ENV NODE_ENV=production
ENV PORT=3001
ENV RULES_DIR=/app/rules-example

WORKDIR /app

# Create volume mount point for custom rules
VOLUME ["/app/rules"]

EXPOSE 3001

ENTRYPOINT ["node", "dist/server.js"]