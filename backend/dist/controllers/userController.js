import { supabase } from '../config/supabase.js';
export const getUsers = async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, email, createdAt')
        .order('id', { ascending: true });
    const users = data;
    res.json({ data: users, error });
};
//# sourceMappingURL=userController.js.map