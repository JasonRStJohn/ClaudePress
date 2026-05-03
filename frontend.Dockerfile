# Standalone runner for the ClaudePress layer.
# Lets you `docker compose up` from this repo without a consuming site.
# Consuming sites use their own Dockerfile and extend this layer in nuxt.config.

FROM node:20-alpine AS build
WORKDIR /app

# Install deps first for better cache hits
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the layer
COPY . .

ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output /app/.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
