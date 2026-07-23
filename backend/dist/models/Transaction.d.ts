export type MoyenPaiement = 'espece' | 'carte' | 'cheque';
export interface Transaction {
    id: number;
    user_id: number;
    date: string;
    type: 'recette' | 'depense';
    designation: string;
    quantite: number;
    prix_unitaire: number;
    categorie_id: number;
    moyen_paiement?: MoyenPaiement | null;
}
//# sourceMappingURL=Transaction.d.ts.map