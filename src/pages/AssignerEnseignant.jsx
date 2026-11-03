import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth, MessageBox, LoadingScreen, Empty } from '../components/Common';
import { adminMenu } from '../utils/menus';

function AssignerEnseignant() {
    const { user, ready } = useAuth('admin', '/admin/login');
    const [enseignants, setEnseignants] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [classes, setClasses] = useState([]);
    const [assignations, setAssignations] = useState([]);
    const [form, setForm] = useState({ enseignant_id: '', matiere_id: '', classe_id: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!ready) return;
        fetchData();
        fetchAssignations();
    }, [ready]);

    const fetchData = async () => {
        try {
            const [ens, mat, cla] = await Promise.all([
                api.get('/admin/enseignants'),
                api.get('/admin/matieres'),
                api.get('/admin/classes'),
            ]);
            setEnseignants(ens.data);
            setMatieres(mat.data);
            setClasses(cla.data);
        } catch (e) { console.error(e); }
    };

    const fetchAssignations = async () => {
        try {
            const res = await api.get('/admin/assignations');
            setAssignations(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await api.post('/admin/enseignant/assigner', form);
            setMessage({ text: 'Enseignant assigne avec succes', type: 'success' });
            setForm({ enseignant_id: '', matiere_id: '', classe_id: '' });
            fetchAssignations();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({
                text: error.response?.data?.erreur || 'Erreur lors de l\'assignation',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!ready) return <LoadingScreen />;

    return (
        <Layout
            user={user}
            role="admin"
            menuItems={adminMenu()}
            title="Assigner un enseignant"
            subtitle="Affectez un professeur a une matiere et une classe"
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22 }}>
                {/* Form */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 22,
                        paddingBottom: 16,
                        borderBottom: '1px solid var(--glass-border)',
                    }}>
                        <div style={{
                            width: 38, height: 38,
                            borderRadius: 11,
                            background: 'var(--accent-soft)',
                            color: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon name="flag" size={18} />
                        </div>
                        <h3 className="section-title">Nouvelle assignation</h3>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="field">
                            <label className="label">Enseignant *</label>
                            <select
                                value={form.enseignant_id}
                                onChange={(e) => setForm({ ...form, enseignant_id: e.target.value })}
                                className="select"
                                required
                            >
                                <option value="">Selectionner un enseignant...</option>
                                {enseignants.map(ens => (
                                    <option key={ens.id} value={ens.id}>{ens.nom_complet}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label className="label">Matiere *</label>
                            <select
                                value={form.matiere_id}
                                onChange={(e) => setForm({ ...form, matiere_id: e.target.value })}
                                className="select"
                                required
                            >
                                <option value="">Selectionner une matiere...</option>
                                {matieres.map(m => (
                                    <option key={m.id} value={m.id}>{m.nom} {m.code ? `(${m.code})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label className="label">Classe *</label>
                            <select
                                value={form.classe_id}
                                onChange={(e) => setForm({ ...form, classe_id: e.target.value })}
                                className="select"
                                required
                            >
                                <option value="">Selectionner une classe...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nom}</option>
                                ))}
                            </select>
                        </div>

                        {message.text && <MessageBox message={message} />}

                        <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                            {loading ? <><div className="spinner spinner-sm" /> Assignation...</> : <><Icon name="check" size={16} /> Assigner</>}
                        </button>
                    </form>
                </div>

                {/* Liste */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 18,
                        paddingBottom: 14,
                        borderBottom: '1px solid var(--glass-border)',
                    }}>
                        <h3 className="section-title">Assignations existantes</h3>
                        <span className="pill pill-accent">{assignations.length}</span>
                    </div>

                    {assignations.length === 0 ? (
                        <Empty
                            icon="flag"
                            title="Aucune assignation"
                            description="Creez une assignation a gauche pour la voir apparaitre ici"
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
                            {assignations.map((a, i) => {
                                const initials = (a.enseignant || '?')
                                    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
                                return (
                                    <div key={a.id || i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 14px',
                                        background: 'var(--glass-bg-light)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 12,
                                    }}>
                                        <div className="avatar avatar-sm">{initials}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 13.5,
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                margin: 0,
                                            }}>{a.enseignant}</p>
                                            <p style={{
                                                fontSize: 12,
                                                color: 'var(--text-muted)',
                                                margin: '2px 0 0',
                                            }}>{a.matiere} <span style={{ opacity: 0.5 }}>·</span> {a.classe}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default AssignerEnseignant;
