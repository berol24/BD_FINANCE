import { supabase } from '../config/supabase.js';
export const getCategories = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const userId = parseInt(req.userId, 10);
    let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });
    if (type && type.trim() !== '') {
        query = query.eq('type', type);
    }
    const { data, error } = await query;
    const categories = data;
    res.json({ data: categories, error });
};
export const createCategory = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { nom, type } = req.body;
    const userId = parseInt(req.userId, 10);
    if (!nom || !type) {
        res.status(400).json({ message: 'Nom et type requis' });
        return;
    }
    const { data, error } = await supabase
        .from('categories')
        .insert({
        user_id: userId,
        nom,
        type,
    })
        .select();
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
};
export const updateCategory = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { id } = req.params;
    const { nom, type } = req.body;
    const userId = parseInt(req.userId, 10);
    const { data, error } = await supabase
        .from('categories')
        .update({ nom, type })
        .eq('id', id)
        .eq('user_id', userId)
        .select();
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    if (!data || data.length === 0) {
        res.status(404).json({ message: 'Catégorie non trouvée ou non autorisée' });
        return;
    }
    res.json(data[0]);
};
export const deleteCategory = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { id } = req.params;
    const userId = parseInt(req.userId, 10);
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json({ message: 'Catégorie supprimée' });
};
//# sourceMappingURL=categoryController.js.map