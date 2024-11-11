# Menggunakan Node.js versi 16 sebagai base image
FROM node:16

# Menetapkan direktori kerja di dalam kontainer
WORKDIR /app

# Menyalin file package.json dan package-lock.json untuk instalasi dependencies
COPY package*.json ./

# Menginstall dependencies
RUN npm install

# Menyalin seluruh kode aplikasi ke dalam kontainer
COPY . .

# Menetapkan variabel lingkungan di Docker
ENV APP_ENV=production
ENV APP_PORT=8080
ENV MODEL_URL="file:///app/model/model.json"
ENV PROJECT_ID="your_project_id"

# Menjalankan aplikasi
CMD [ "npm", "start" ]

# Mengekspos port yang akan digunakan aplikasi
EXPOSE 8080
