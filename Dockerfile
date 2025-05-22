# ========================
# STAGE 1: Build
# ========================
FROM node:20-alpine AS builder

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Crear directorio de trabajo
WORKDIR /app

# Copiar dependencias y lockfile para instalar solo lo necesario
COPY package.json pnpm-lock.yaml ./


# Instalar dependencias sin devDependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copiar el resto del código fuente
COPY . .
COPY ./tsconfig.json .

RUN echo "Listing /app directory:" && ls -la /app


# Compilar TypeScript (asumiendo que usas tsconfig.json)
RUN pnpm build

# ========================
# STAGE 2: Runtime
# ========================
FROM node:20-alpine AS runtime

# Crear usuario sin privilegios
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Crear directorio de trabajo
WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Usar el usuario seguro
# USER appuser

# Exponer el puerto (ajústalo según tu app)
EXPOSE 3000

# Comando de ejecución
CMD ["npm","start"]

