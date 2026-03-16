FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Crear directorio para la base de datos
RUN mkdir -p data

EXPOSE 3000

CMD ["npm", "start"]
