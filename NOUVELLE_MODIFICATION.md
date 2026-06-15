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


Prochaines étapes (optionnelles, dans les jours qui viennent)

Accélérer l'indexation — va dans "Inspection de l'URL", teste tes pages principales une par une, clique "Demander une indexation" pour chacune :

https://boutique.bem.sn
https://boutique.bem.sn/catalogue
https://boutique.bem.sn/produits/1b413832-d20e-4ce3-a6ed-e270b008e02d

Surveiller dans "Pages" (sous Indexation) dans les prochains jours — le nombre de pages indexées devrait progressivement passer de 0 à 10.
Une fois GA4 ou Plausible installé (vu plus tôt), tu pourras suivre le trafic réel qui arrive depuis Google.