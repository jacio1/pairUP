FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run db:generate && npm run build
ENV NODE_ENV=production
USER node
EXPOSE 4000
CMD ["sh", "-c", "npm run db:migrate && node dist/main.js"]
