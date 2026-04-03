# FCMA Ti Kaz - Devis, factures et clients

Application React/Vite pour generer des devis et factures, consulter les clients, et synchroniser les donnees avec Notion.

## Architecture recommandee

Pour garder le site sur GitHub Pages tout en parlant a Notion :

- Frontend statique : GitHub Pages
- Backend API : Netlify Functions
- Base de donnees metier : Notion

GitHub Pages ne peut pas executer de fonctions serveur ni cacher un token Notion. Le token doit rester sur Netlify.

## Variables d'environnement

### Cote Netlify

- `NOTION_TOKEN`
- `NOTION_DB_DEVIS`
- `NOTION_DB_CLIENTS`
- `NOTION_DB_COMMANDES`

### Cote frontend Vite

- `VITE_APP_BASE_URL`
- `VITE_API_BASE_URL`

Exemple :

```env
VITE_APP_BASE_URL=/SiteTikazDevis/
VITE_API_BASE_URL=https://mon-site-api.netlify.app/.netlify/functions
```

Pour ce projet deploye sur GitHub Pages :

```env
VITE_APP_BASE_URL=/TraiteurFrancio/
VITE_API_BASE_URL=https://sprightly-starlight-393440.netlify.app/.netlify/functions
```

## Demarrage local

```bash
npm install
npx vite
```

Pour tester aussi les fonctions Netlify en local :

```bash
npx netlify dev
```

## GitHub Pages

Le projet inclut un workflow GitHub Actions :

- [.github/workflows/deploy-pages.yml](C:\Users\amali\Documents\Entreprenariat\Francio\SiteTikazDevis\.github\workflows\deploy-pages.yml)

Il build l'application Vite et publie le dossier `dist` sur GitHub Pages a chaque push sur `main`.

## Endpoints disponibles

- `GET /.netlify/functions/notion-health`
- `GET /.netlify/functions/notion-clients`
- `POST /.netlify/functions/notion-save-client`
- `POST /.netlify/functions/notion-save-document`

## Points importants

- Le frontend n'utilise plus directement de token Notion.
- L'URL du backend est configurable.
- Le projet peut etre deploye en mode hybride GitHub Pages + Netlify.
- Si une base Notion repond `404`, il faut verifier l'ID de base et le partage avec l'integration.
