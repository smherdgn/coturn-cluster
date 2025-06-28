# ----- Aşama 1: Build Aşaması -----
# Node.js'in olduğu bir imajı temel alarak başla
FROM node:18-alpine AS builder

# Çalışma dizinini ayarla
WORKDIR /app

# Sadece package.json dosyalarını kopyala. Bu, Docker'ın katman önbelleklemesini (layer caching) optimize eder.
# Bağımlılıklar değişmediği sürece `npm install` tekrar çalıştırılmaz.
COPY package.json package-lock.json* ./

# Proje bağımlılıklarını kur
RUN npm install

# Tüm proje kaynak kodunu kopyala
COPY . .

# React uygulamasını build et (dist klasörünü oluştur)
RUN npm run build


# ----- Aşama 2: Production Aşaması -----
# Hafif bir Nginx web sunucusu imajını temel al
FROM nginx:1.25-alpine

# Build aşamasından sadece build edilmiş statik dosyaları (/app/dist içindekileri) kopyala
# Nginx'in HTML dosyalarını sunduğu varsayılan klasöre (/usr/share/nginx/html) yapıştır
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA (Tek Sayfalı Uygulama) yönlendirmesi için Nginx'i yapılandır.
# Bu, /nodes, /users gibi direkt URL'lere gidildiğinde 404 hatası almak yerine index.html'in sunulmasını sağlar.
# Aşağıdaki satır, default.conf dosyasını siler. Onun yerine kendi konfigürasyonumuzu ekleyeceğiz.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# Nginx'in 80 portunu dışarıya aç
EXPOSE 80

# Nginx sunucusunu başlat
CMD ["nginx", "-g", "daemon off;"]