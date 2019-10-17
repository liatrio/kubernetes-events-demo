FROM node:10-alpine

COPY package*.json .
RUN npm install --prod

COPY . .

ENTRYPOINT ["npm", "start"]
