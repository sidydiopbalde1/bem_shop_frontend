cd /home/sdbalde/apps/bem-web/bem_shop_frontend

# Récupérer les changements
git pull origin main

# Installer si nouvelles dépendances
npm install

# Rebuilder
npm run build

# Redémarrer
pm2 restart bem-web --update-env

# Vérifier
pm2 logs bem-web --lines 20