FROM node:19.9.0-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

CMD ["npm", "start"]

EXPOSE 5051