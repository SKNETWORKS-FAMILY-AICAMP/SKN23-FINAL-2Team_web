FROM node:20

WORKDIR /app

COPY . .

RUN npm install

WORKDIR /app/frontend/admin

RUN npm install

EXPOSE 3001

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]