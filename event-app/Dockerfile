# Build Stage: Build the React application
FROM node:16-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build # Build the React app

# Serve Stage: Serve the static files with NGINX
FROM nginx:alpine

# Copy the built React app from the build stage
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy the NGINX configuration file
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
