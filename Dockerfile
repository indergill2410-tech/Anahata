FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY . .
RUN cd client && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY server ./server
COPY package*.json ./
EXPOSE 3001
CMD ["node", "server/index.js"]
