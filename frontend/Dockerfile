FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

FROM nginx:stable
COPY --from=build /app/dist/<nombre-del-proyecto> /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
