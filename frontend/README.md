# BD Finance - Frontend

Frontend Angular pour l'application de gestion de recettes et dépenses.

## Installation

```bash
npm install
```

## Développement

```bash
npm start
```

L'application sera disponible sur `http://localhost:4200`

## Build

```bash
npm run build
```

## Structure du Projet

```
src/
├── app/
│   ├── core/              # Services, guards, interceptors
│   │   ├── services/      # AuthService, TransactionService
│   │   ├── guards/        # authGuard
│   │   └── interceptors/  # authInterceptor
│   ├── features/          # Modules fonctionnels
│   │   ├── auth/          # Pages de login/register
│   │   └── dashboard/     # Dashboard et composants
│   ├── app.config.ts      # Configuration Angular
│   ├── app.routes.ts      # Routes
│   └── app.component.ts   # Composant racine
├── assets/                # Images, icônes
└── styles.css             # Styles globaux (Tailwind)
```

## Technologies

- **Angular 18** - Framework frontal
- **Tailwind CSS** - Styling
- **TypeScript** - Langague de programmation
- **RxJS** - Gestion des observables
