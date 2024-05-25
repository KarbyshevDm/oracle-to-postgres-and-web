FROM node:latest

# Define build arguments for environment variables
ARG VITE_BACKEND_URL


# Set environment variables during the build process
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL


WORKDIR /app
COPY package.json package.json
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm","run","serve"]