# frontend/Dockerfile
# Multi-stage build: builder -> build -> production (nginx)

# === BUILDER STAGE ===
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# === BUILD STAGE ===
FROM builder AS build

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# === PRODUCTION STAGE (nginx) ===
FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
