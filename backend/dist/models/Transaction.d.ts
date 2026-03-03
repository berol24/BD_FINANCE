export interface Transaction {
    id: number;
    user_id: number;
    date: string;
    type: 'recette' | 'depense';
    designation: string;
    quantite: number;
    prix_unitaire: number;
    categorie_id: number;
}
//# sourceMappingURL=Transaction.d.ts.map