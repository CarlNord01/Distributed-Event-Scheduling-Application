FROM node:16-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build  # Build the React app

# Use a smaller image for serving the static files
FROM nginx:alpine

# Copy the built React app
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy the custom nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Remove the default nginx configuration, so our custom config is used.
RUN rm /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]