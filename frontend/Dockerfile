FROM docker.m.daocloud.io/library/node:22-alpine AS build
WORKDIR /app

ARG VITE_DISABLE_PWA=false
ENV VITE_DISABLE_PWA=$VITE_DISABLE_PWA

COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com \
  && npm config set replace-registry-host always \
  && sh -c '\
    for i in 1 2 3; do \
      npm ci --no-audit --no-fund && exit 0; \
      echo "npm ci failed, retry $i/3"; \
      sleep 5; \
    done; \
    exit 1'

COPY . .
RUN npm run build

FROM docker.m.daocloud.io/library/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
