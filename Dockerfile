# Etapa 1: Construcción (Build)
# Usamos una imagen de Node ligera para instalar dependencias y "compilar" el proyecto
FROM node:18-alpine as builder

WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json package-lock.json ./

# Instalamos dependencias (npm ci es más rápido y limpio para CI/CD)
RUN npm ci

# Copiamos todo el código fuente
COPY . .

# Definimos los argumentos que recibiremos desde EasyPanel
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Las convertimos en variables de entorno disponibles para el comando 'npm run build'
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Construimos la aplicación (ahora sí tendrá acceso a las variables)
RUN npm run build

# Etapa 2: Servidor Web (Producción)
# Usamos Nginx Alpine que es muy ligero (menos de 50MB) para servir los archivos estáticos
FROM nginx:alpine

# Copiamos nuestra configuración de Nginx personalizada (para que funcione el React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados de la etapa 'builder' al directorio público de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
