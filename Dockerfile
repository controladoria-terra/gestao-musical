# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup Express server
FROM node:20-alpine
WORKDIR /app
COPY server/package.json ./server/
RUN cd server && npm install --production
COPY server/ ./server/
COPY --from=frontend-builder /app/client/dist ./client/dist
ENV PORT=3000
ENV MONGODB_URI=mongodb://host.docker.internal:32768/gestao-musical
EXPOSE 3000
WORKDIR /app/server
CMD ["node", "index.js"]
