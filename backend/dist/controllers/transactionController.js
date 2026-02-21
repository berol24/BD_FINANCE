import { supabase } from '../config/supabase.js';
export const getTransactions = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const userId = parseInt(req.userId, 10);
    let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });
    if (type && type.trim() !== '') {
        query = query.eq('type', type);
    }
    const { data, error } = await query;
    const transactions = data;
    res.json({ data: transactions, error });
};
export const createTransaction = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { designation, quantite, prix_unitaire, categorie_id, date } = req.body;
    const userId = parseInt(req.userId, 10);
    if (!designation || !quantite || !prix_unitaire || !categorie_id) {
        res.status(400).json({ message: 'Designation, quantité, prix et catégorie requis' });
        return;
    }
    const { data, error } = await supabase
        .from('transactions')
        .insert({
        user_id: userId,
        designation,
        quantite,
        prix_unitaire,
        categorie_id,
        date: date || new Date().toISOString(),
    })
        .select();
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
};
export const updateTransaction = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { id } = req.params;
    const { designation, quantite, prix_unitaire, categorie_id, date } = req.body;
    const userId = parseInt(req.userId, 10);
    const { data, error } = await supabase
        .from('transactions')
        .update({ designation, quantite, prix_unitaire, categorie_id, date })
        .eq('id', id)
        .eq('user_id', userId)
        .select();
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    if (!data || data.length === 0) {
        res.status(404).json({ message: 'Transaction non trouvée ou non autorisée' });
        return;
    }
    res.json(data[0]);
};
export const deleteTransaction = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { id } = req.params;
    const userId = parseInt(req.userId, 10);
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json({ message: 'Transaction supprimée' });
};
//# sourceMappingURL=transactionController.js.map