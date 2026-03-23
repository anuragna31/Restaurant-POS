FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY client ./client
COPY server ./server

RUN npm ci
RUN npm run build -w server

FROM node:20-alpine AS runtime

WORKDIR /app/server
ENV NODE_ENV=production

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/server/package.json /app/server/package.json
COPY --from=build /app/server/dist /app/server/dist
COPY --from=build /app/server/src /app/server/src
COPY --from=build /app/server/tsconfig.json /app/server/tsconfig.json

EXPOSE 4000
CMD ["node", "dist/server.js"]

