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
    // Meilleure validation
    if (!designation || quantite === undefined || quantite === null || prix_unitaire === undefined || prix_unitaire === null || !categorie_id) {
        console.error('Validation failed:', { designation, quantite, prix_unitaire, categorie_id });
        res.status(400).json({ message: 'Designation, quantité, prix et catégorie requis' });
        return;
    }
    const { data, error } = await supabase
        .from('transactions')
        .insert({
        user_id: userId,
        designation,
        quantite: Number(quantite),
        prix_unitaire: Number(prix_unitaire),
        categorie_id: Number(categorie_id),
        date: date || new Date().toISOString(),
    })
        .select();
    if (error) {
        console.error('Supabase error creating transaction:', error);
        res.status(400).json({ message: 'Erreur lors de la création de la transaction', error: error.message });
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
export const getTransactionsByPeriod = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    try {
        const userId = parseInt(req.userId, 10);
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({ message: 'startDate and endDate are required' });
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .gte('date', start.toISOString())
            .lte('date', end.toISOString())
            .order('date', { ascending: false });
        const { data, error } = await query;
        if (error) {
            res.status(400).json({ message: 'Error fetching transactions', error });
            return;
        }
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching transactions by period', error: err.message });
    }
};
export const getChartData = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    try {
        const userId = parseInt(req.userId, 10);
        const months = parseInt(req.query.months || '12', 10);
        // Calculate date range (last N months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months + 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // Fetch transactions in the period
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*, categories(type)')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());
        if (error) {
            res.status(400).json({ message: 'Error fetching chart data', error });
            return;
        }
        // Group by month and calculate totals
        const chartData = {};
        // Initialize months
        for (let i = 0; i < months; i++) {
            const monthDate = new Date(startDate);
            monthDate.setMonth(monthDate.getMonth() + i);
            const monthKey = monthDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            chartData[monthKey] = { recettes: 0, depenses: 0 };
        }
        // Aggregate data
        if (transactions) {
            transactions.forEach((t) => {
                const txDate = new Date(t.date);
                const monthKey = txDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
                const amount = t.quantite * t.prix_unitaire;
                if (chartData[monthKey]) {
                    if (t.categories?.type === 'recette') {
                        chartData[monthKey].recettes += amount;
                    }
                    else {
                        chartData[monthKey].depenses += amount;
                    }
                }
            });
        }
        // Convert to array format
        const labels = Object.keys(chartData);
        const recettes = labels.map((label) => chartData[label].recettes);
        const depenses = labels.map((label) => chartData[label].depenses);
        res.json({
            labels,
            recettes,
            depenses,
            months,
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching chart data', error: err.message });
    }
};
//# sourceMappingURL=transactionController.js.map