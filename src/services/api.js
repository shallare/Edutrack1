import axios from 'axios';

// Configurable via REACT_APP_API_URL dans .env (indispensable en production)
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Token Sanctum injecté automatiquement
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Si la session expire, on déconnecte proprement
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const path = window.location.pathname;
            // ne pas boucler si on est déjà sur une page login
            if (!path.includes('/login') && path !== '/etudiant/login' && path !== '/') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // On redirige vers la home — l'utilisateur choisira son portail
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

// ─── Mes Cours Personnels ─────────────────────────────────────────────────────
export const mesCours = {
    lister: () => api.get('/etudiant/mes-cours'),
    creer: (data) => api.post('/etudiant/mes-cours', data),
    modifier: (id, data) => api.put(`/etudiant/mes-cours/${id}`, data),
    supprimer: (id) => api.delete(`/etudiant/mes-cours/${id}`),
    lienPartage: (id) => api.get(`/etudiant/mes-cours/${id}/partage`),
};

// ─── Messagerie entre camarades ───────────────────────────────────────────────
export const messagerie = {
    conversation: (camaradeId) => api.get(`/etudiant/messages/${camaradeId}`),
    envoyer: (camaradeId, contenu) => api.post(`/etudiant/messages/${camaradeId}`, { contenu }),
    nonLus: () => api.get('/etudiant/messages-non-lus'),
};

// ─── Upload d'illustrations ───────────────────────────────────────────────────
export async function uploadImage(blob) {
    const form = new FormData();
    form.append('image', blob, 'illustration.png');
    const res = await api.post('/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
}

export default api;
