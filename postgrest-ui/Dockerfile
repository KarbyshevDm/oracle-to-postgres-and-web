FROM node:latest
ENV API_HOST {API_HOST}
ENV API_PORT {API_PORT}
WORKDIR /app
COPY package.json package.json
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm","run","serve"]