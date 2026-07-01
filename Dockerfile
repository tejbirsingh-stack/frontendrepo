FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --ignore-scripts
COPY . .
RUN node -e "const fs=require('fs');let c=fs.readFileSync('vite.config.ts','utf8');c=c.replace(/target:\s*'http:\/\/localhost:3000'/g,\"target:'http://noah-backend:3000'\");c=c.replace(/target:\s*'ws:\/\/localhost:3000'/g,\"target:'ws://noah-backend:3000'\");fs.writeFileSync('vite.config.ts',c);console.log('Proxy updated');"
EXPOSE 3002
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3002"]
