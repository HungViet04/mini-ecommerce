# Build stage
FROM node:lts-alpine AS build
WORKDIR /app

# Accept build arguments
ARG VITE_API_BASE=http://localhost:3000/api/v1
ENV VITE_API_BASE=$VITE_API_BASE

COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --frozen-lockfile || npm install
COPY . .
RUN yarn build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]