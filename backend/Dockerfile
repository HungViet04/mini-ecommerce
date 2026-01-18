FROM node:lts-alpine
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --production --frozen-lockfile || npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]