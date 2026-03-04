# 🚀 Déploiement sur Render - Guide Manuel Complet

## ÉTAPE 1️⃣ : Créer le Backend (API)

### Sur render.com → New + → Web Service

#### Formulaire General
- **Name**: `bd-finance-backend`
- **Environment**: `Node`
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Start Command**: 
  ```
  npm start
  ```
- **Root Directory** (advanced): 
  ```
  backend
  ```

#### Environment Variables (Add Multiple)
Clique "Add Environment Variable" pour chaque ligne :

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | *(copie ta clé Supabase URL)* |
| `VITE_SUPABASE_ANON_KEY` | *(copie ta clé Supabase ANON KEY)* |
| `JWT_SECRET` | *(génère une clé longue sécurisée, ex: `openssl rand -base64 32`)* |
| `NODE_ENV` | `production` |
| `PORT` | *(Render l'ajoute auto - laisse vide)* |

**Où trouver les clés Supabase ?**
1. Va dans le dashboard Supabase
2. Settings → API
3. Copie : `Project URL` et `anon public`

#### Plan & Options
- **Plan**: `Free` (ou Starter si besoin)
- Clique **Create Web Service**

---

## ÉTAPE 2️⃣ : Créer le Frontend (Angular)

### Sur render.com → New + → Web Service

#### Formulaire General
- **Name**: `bd-finance-frontend`
- **Environment**: `Node`
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Start Command**: 
  ```
  npx serve -s dist/bd-finance/browser -l $PORT
  ```
- **Root Directory** (advanced): 
  ```
  frontend
  ```

#### Environment Variables (Add Multiple)

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |

#### Plan & Options
- **Plan**: `Free` (ou Starter si besoin)
- Clique **Create Web Service**

---

## ÉTAPE 3️⃣ : Récupérer les URLs de Render

Une fois déployés, Render te donne 2 URLs :

- **Backend**: `https://bd-finance-backend.onrender.com`
- **Frontend**: `https://bd-finance-frontend.onrender.com`

### Ensuite, update le Backend pour accepter le Frontend

1. Va dans le dashboard Render → `bd-finance-backend`
2. Onglet **Environment**
3. Clique **Add Environment Variable**
4. Ajoute:
   - **Key**: `CORS_ORIGIN`
   - **Value**: `https://bd-finance-frontend.onrender.com` *(ou ton domaine custom si tu en as un)*
5. **Deploy** (redéploiement auto)

---

## 🔍 CHECKLIST VALIDATION

### ✅ Backend Doit Avoir
- [ ] 2 fichiers compilés en `backend/dist/`:
  - `app.js` (main)
  - dossiers `config/`, `routes/`, `middleware/`, `models/`, `controllers/`
- [ ] `package.json` en `backend/`
- [ ] Env vars Supabase + JWT remplies
- [ ] Status "Live" (pas "Build in Progress")
- [ ] Logs affichent : `Server is running on port` + `Swagger documentation available`

### ✅ Frontend Doit Avoir
- [ ] Dossier `frontend/dist/bd-finance/browser/` avec:
  - `index.html`
  - `main.*.js`
  - `styles.*.css`
  - `runtime.*.js`
- [ ] Status "Live"
- [ ] Test l'URL frontend → tu vois la page d'accueil

---

## 🐛 TROUBLESHOOTING

### Problème: Backend en erreur 404 / "Cannot find module"
**Cause**: Node modules pas compilés ou version TypeScript
**Solution**:
1. Va dans Render Dashboard → `bd-finance-backend` → Logs
2. Lis l'erreur (exemple: `Cannot find 'supabase'`)
3. Vérifie que `package.json` a la dépendance

### Problème: Frontend affiche "Cannot GET /dashboard/..."
**Cause**: Serve ne fait pas le fallback SPA
**Solution**: Start Command doit être **exactement**:
```
npx serve -s dist/bd-finance/browser -l $PORT
```
(pas `http-server`, pas `-p`, mais `-l`)

### Problème: "API cannot reach database"
**Cause**: Env vars Supabase manquent ou fausses
**Solution**:
1. Copie depuis Supabase Dashboard → Settings → API
2. Colle dans Render Backend Environment (exact copy/paste)
3. Redéploie

### Problème: CORS error "Access-Control-Allow-Origin"
**Cause**: `CORS_ORIGIN` env var pas set ou URL différente
**Solution**:
1. Copie l'URL du frontend Render (ex: `https://bd-finance-frontend.onrender.com`)
2. Va dans Backend → Environment → Add `CORS_ORIGIN`
3. Mets cette URL exacte
4. Redéploie

---

## 📞 Tests Finaux

1. **Test Backend alive**:
   - Va à: `https://bd-finance-backend.onrender.com/api-docs` 
   - Tu dois voir Swagger UI

2. **Test Frontend alive**:
   - Va à: `https://bd-finance-frontend.onrender.com`
   - Tu dois voir la page d'accueil BD Finance

3. **Test API call**:
   - Depuis le frontend, ouvre Console (F12)
   - Essaie de te connecter
   - Vérifie que ça appelle `https://bd-finance-backend.onrender.com/api/auth/login`
   - Pas d'erreur CORS

---

## 🔐 Sécurité - À FAIRE APRÈS DÉPLOIEMENT

- [ ] Change `NODE_ENV` à `production` sur backend
- [ ] Génère une clé JWT très sécurisée (pas de simple texte)
- [ ] Mets à jour Supabase RLS (Row-Level Security) pour production
- [ ] (Optional) Ajoute un domaine custom au lieu de `.onrender.com`

---

**Date**: 4 mars 2026  
**Version**: 1.0 - Manual Setup
