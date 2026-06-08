# Guide de déploiement — BEM Dakar Goodies (Next.js 16)

> Front-end Next.js 16 / React 19 / Tailwind CSS v4.  
> Deux modes couverts : **déploiement natif** et **déploiement Dockerisé** sur un VPS Ubuntu 22.04+.

---

## Table des matières

1. [Prérequis VPS](#1-prérequis-vps)
2. [Variables d'environnement](#2-variables-denvironnement)
3. [Déploiement natif (sans Docker)](#3-déploiement-natif-sans-docker)
4. [Déploiement Dockerisé](#4-déploiement-dockerisé)
5. [Reverse proxy Nginx + HTTPS](#5-reverse-proxy-nginx--https)
6. [Mise à jour du projet](#6-mise-à-jour-du-projet)
7. [Surveillance & logs](#7-surveillance--logs)

---

## 1. Prérequis VPS

### Système

| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| OS        | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU       | 1 vCPU  | 2 vCPU     |
| RAM       | 1 Go    | 2 Go       |
| Disque    | 20 Go   | 40 Go SSD  |

### Ports à ouvrir dans le firewall

```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

---

## 2. Variables d'environnement

Créer un fichier `.env.production` à la racine du projet (ne jamais commiter ce fichier) :

```env
# ── URL de l'API backend (utilisée côté serveur Next.js)
API_URL=https://api.votre-domaine.com

# ── URL de l'API backend (exposée au navigateur)
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com

# ── URL du backend pour OAuth Google (redirect)
NEXT_PUBLIC_BACKEND_URL=https://api.votre-domaine.com

# ── NextAuth
NEXTAUTH_SECRET=une_chaine_aleatoire_longue_et_secrete   # openssl rand -base64 32
NEXTAUTH_URL=https://votre-domaine.com

# ── SMTP (notifications e-mail admin)
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=587
SMTP_SECURE=false        # true pour le port 465
SMTP_USER=votre@email.com
SMTP_PASS=mot_de_passe_smtp
ADMIN_EMAIL=admin@votre-domaine.com
```

> **Astuce** : générer `NEXTAUTH_SECRET` avec `openssl rand -base64 32`.

---

## 3. Déploiement natif (sans Docker)

### 3.1 Installer Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # doit afficher v20.x.x
```

### 3.2 Installer pnpm (ou npm, au choix)

```bash
npm install -g pnpm
```

### 3.3 Cloner le dépôt

```bash
sudo mkdir -p /var/www/bem-web
sudo chown $USER:$USER /var/www/bem-web
git clone https://github.com/<org>/bem-web.git /var/www/bem-web
cd /var/www/bem-web
```

### 3.4 Installer les dépendances et builder

```bash
cp .env.production .env.local    # Next.js charge .env.local en prod
pnpm install --frozen-lockfile
pnpm build                       # génère le dossier .next/
```

> `next build` nécessite que toutes les variables d'environnement soient présentes au moment du build (notamment `NEXT_PUBLIC_*`).

### 3.5 Lancer avec PM2

```bash
npm install -g pm2

pm2 start "pnpm start" --name bem-web --cwd /var/www/bem-web
pm2 save
pm2 startup    # suivre les instructions affichées pour activer au démarrage
```

Vérifier que le process tourne :

```bash
pm2 status
pm2 logs bem-web
```

L'application écoute sur `http://localhost:3001` (port Next.js par défaut : 3000, configurable via `PORT=3001 pnpm start`).

---

## 4. Déploiement Dockerisé

### 4.1 Installer Docker & Docker Compose

```bash
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
newgrp docker          # recharger le groupe sans logout

# Docker Compose plugin (v2)
sudo apt install -y docker-compose-plugin
docker compose version
```

### 4.2 Dockerfile

Créer `Dockerfile` à la racine du projet :

```dockerfile
# ── Étape 1 : dépendances
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# ── Étape 2 : build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Les variables NEXT_PUBLIC_* doivent être passées au build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
RUN corepack enable pnpm && pnpm build

# ── Étape 3 : runner (image finale minimale)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copier uniquement ce qui est nécessaire à l'exécution
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
```

> Ce Dockerfile utilise le mode **standalone** de Next.js. Activer l'option dans `next.config.js` :
>
> ```js
> // next.config.js
> /** @type {import('next').NextConfig} */
> const nextConfig = {
>   output: 'standalone',
> };
> module.exports = nextConfig;
> ```

### 4.3 docker-compose.yml

```yaml
services:
  bem-web:
    build:
      context: .
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
        NEXT_PUBLIC_BACKEND_URL: ${NEXT_PUBLIC_BACKEND_URL}
    image: bem-web:latest
    container_name: bem-web
    restart: unless-stopped
    ports:
      - "3001:3001"
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
      PORT: 3001
```

### 4.4 Builder et démarrer

```bash
# Copier les variables d'env
cp .env.production .env.production   # déjà fait

# Builder l'image
docker compose build

# Lancer en arrière-plan
docker compose up -d

# Vérifier
docker compose ps
docker compose logs -f bem-web
```

---

## 5. Reverse proxy Nginx + HTTPS

### 5.1 Installer Nginx & Certbot

```bash
sudo apt install -y nginx
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 5.2 Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/bem-web
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Redirection HTTPS gérée par Certbot (ajoutée automatiquement)

    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bem-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 Certificat SSL Let's Encrypt

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Certbot modifie automatiquement le bloc Nginx pour le HTTPS et configure le renouvellement automatique.

---

## 6. Mise à jour du projet

### Mode natif

```bash
cd /var/www/bem-web
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 reload bem-web
```

### Mode Docker

```bash
cd /var/www/bem-web
git pull origin main
docker compose build --no-cache
docker compose up -d
```

---

## 7. Surveillance & logs

### Logs applicatifs

```bash
# PM2
pm2 logs bem-web --lines 200

# Docker
docker compose logs -f bem-web
```

### Monitoring système (optionnel)

```bash
# Netdata (monitoring temps réel léger)
wget -O /tmp/netdata-kickstart.sh https://get.netdata.cloud/kickstart.sh
bash /tmp/netdata-kickstart.sh
```

### Renouvellement SSL (automatique)

```bash
sudo certbot renew --dry-run    # tester le renouvellement
```

---

## Récapitulatif des dépendances à installer sur le VPS

| Outil | Mode natif | Mode Docker |
|-------|-----------|-------------|
| Node.js 20 LTS | Oui | Non (dans l'image) |
| pnpm | Oui | Non (dans l'image) |
| PM2 | Oui | Non |
| Docker + Compose | Non | Oui |
| Nginx | Oui | Oui |
| Certbot | Oui | Oui |
| Git | Oui | Oui |
