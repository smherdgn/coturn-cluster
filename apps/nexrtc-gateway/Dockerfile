# Temel imaj
FROM node:18-alpine

# Çalışma dizini
WORKDIR /app

# Paket dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install --production

# Uygulama dosyalarını kopyala
COPY . .

# Ortam değişkeni
ENV NODE_ENV=production

# Uygulamayı başlat
CMD ["node", "src/server.js"]
