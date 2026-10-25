# Vorbi web app + API in one container (Node 22). Build the web bundle, then run only what is needed.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html ./
COPY src ./src
COPY public ./public
RUN npx vite build

FROM node:22-slim
ENV NODE_ENV=production TRUST_PROXY=1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:'+(process.env.PORT||8787)+'/api/status').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "server/index.js"]
