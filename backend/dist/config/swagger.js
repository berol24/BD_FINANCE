import swaggerJsdoc from 'swagger-jsdoc';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BD Finance API',
            version: '1.0.0',
            description: 'API de gestion financière - Recettes et Dépenses',
            contact: {
                name: 'Support API',
                email: 'support@bdfinance.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Serveur de développement',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Entrez votre token JWT (obtenu via /auth/login)',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        nom: { type: 'string', example: 'Dupont' },
                        prenom: { type: 'string', example: 'Jean' },
                        email: { type: 'string', format: 'email', example: 'jean.dupont@example.com' },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        user_id: { type: 'integer', example: 1 },
                        nom: { type: 'string', example: 'Alimentation' },
                        type: {
                            type: 'string',
                            enum: ['recette', 'depense'],
                            example: 'depense',
                            description: 'Type de catégorie',
                        },
                    },
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        user_id: { type: 'integer', example: 1 },
                        date: { type: 'string', format: 'date-time', example: '2024-03-01T10:30:00Z' },
                        type: {
                            type: 'string',
                            enum: ['recette', 'depense'],
                            example: 'depense',
                            description: 'Type de transaction',
                        },
                        designation: { type: 'string', example: 'Courses alimentaires' },
                        quantite: { type: 'number', example: 2, description: 'Quantité achetée' },
                        prix_unitaire: { type: 'number', format: 'float', example: 25.5, description: 'Prix unitaire en euros' },
                        categorie_id: { type: 'integer', example: 1, description: 'ID de la catégorie' },
                    },
                    required: ['type', 'designation', 'quantite', 'prix_unitaire', 'categorie_id'],
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: { $ref: '#/components/schemas/User' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Message d\'erreur' },
                        error: { type: 'string' },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Auth',
                description: 'Endpoints d\'authentification (inscription, connexion, refresh token)',
            },
            {
                name: 'Profile',
                description: 'Gestion du profil utilisateur',
            },
            {
                name: 'Categories',
                description: 'Gestion des catégories de transactions',
            },
            {
                name: 'Transactions',
                description: 'Gestion des recettes et dépenses',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
export const swaggerSpec = swaggerJsdoc(options);
//# sourceMappingURL=swagger.js.map