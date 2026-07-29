# Usamos una imagen ligera de Node.js
FROM node:18-alpine

# Directorio de trabajo en la raíz del contenedor
WORKDIR /app

# Copiamos primero el shared (CRÍTICO para que el backend lo encuentre)
COPY shared ./shared

# Copiamos el backend
COPY backend ./backend

# Nos movemos a la carpeta del backend para instalar y compilar
WORKDIR /app/backend

# Instalamos dependencias y compilamos el proyecto
RUN npm install
RUN npm run build

# Railway inyecta su propio puerto dinámico, pero por convención exponemos el 3000
EXPOSE 3000

# Comando de arranque de producción para NestJS
CMD ["npm", "run", "start:prod"]