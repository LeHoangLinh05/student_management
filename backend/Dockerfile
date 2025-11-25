FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

FROM node:18

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/server.js"]
