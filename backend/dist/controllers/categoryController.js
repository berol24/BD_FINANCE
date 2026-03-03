import { supabase } from '../config/supabase.js';
const normalizeCategoryName = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const CATEGORY_TYPES = ['recette', 'depense'];
const normalizeCategoryType = (value) => {
    return value === 'recette' || value === 'depense' ? value : 'depense';
};
export const getCategories = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const userId = parseInt(req.userId, 10);
    const typeQuery = typeof req.query.type === 'string' ? req.query.type : undefined;
    let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('nom', { ascending: true });
    if (typeQuery === 'recette' || typeQuery === 'depense') {
        query = query.eq('type', typeQuery);
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
    const sanitizedName = typeof nom === 'string' ? nom.trim().replace(/\s+/g, ' ') : '';
    const sanitizedType = normalizeCategoryType(type);
    if (!sanitizedName) {
        res.status(400).json({ message: 'Nom requis' });
        return;
    }
    const { data: existingCategories, error: existingError } = await supabase
        .from('categories')
        .select('id, nom')
        .eq('user_id', userId);
    if (existingError) {
        res.status(400).json({ message: 'Erreur lors de la vérification des catégories', error: existingError.message });
        return;
    }
    const duplicate = (existingCategories || []).some((category) => normalizeCategoryName(category.nom) === normalizeCategoryName(sanitizedName));
    if (duplicate) {
        res.status(409).json({ message: `Une catégorie "${sanitizedName}" existe déjà pour vous` });
        return;
    }
    const { data, error } = await supabase
        .from('categories')
        .insert({
        user_id: userId,
        nom: sanitizedName,
        type: sanitizedType,
    })
        .select()
        .single();
    if (error) {
        console.error('Supabase error creating category:', error);
        if (error.code === '23505') {
            res.status(409).json({ message: `Une catégorie "${sanitizedName}" existe déjà pour vous` });
            return;
        }
        res.status(400).json({ message: 'Erreur lors de la création de la catégorie', error: error.message });
        return;
    }
    res.json({ data });
};
export const updateCategory = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const { id } = req.params;
    const { nom, type } = req.body;
    const sanitizedName = typeof nom === 'string' ? nom.trim().replace(/\s+/g, ' ') : '';
    const sanitizedType = type === undefined ? undefined : normalizeCategoryType(type);
    const userId = parseInt(req.userId, 10);
    if (!sanitizedName) {
        res.status(400).json({ message: 'Nom requis' });
        return;
    }
    const { data: existingCategories, error: existingError } = await supabase
        .from('categories')
        .select('id, nom')
        .eq('user_id', userId);
    if (existingError) {
        res.status(400).json({ message: 'Erreur lors de la vérification des catégories', error: existingError.message });
        return;
    }
    const duplicate = (existingCategories || []).some((category) => category.id !== Number(id) && normalizeCategoryName(category.nom) === normalizeCategoryName(sanitizedName));
    if (duplicate) {
        res.status(409).json({ message: `Une catégorie "${sanitizedName}" existe déjà pour vous` });
        return;
    }
    const updatePayload = { nom: sanitizedName };
    if (sanitizedType) {
        updatePayload.type = sanitizedType;
    }
    const { data, error } = await supabase
        .from('categories')
        .update(updatePayload)
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
    res.json({ data: data[0] });
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