FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY client ./client
COPY server ./server

RUN npm ci
RUN npm run build -w client

FROM nginx:alpine AS runtime

COPY --from=build /app/client/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

