import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Icon from '../components/Icon';
import { Empty, MessageBox } from '../components/Common';
import api, { messagerie } from '../services/api';

// Couleurs d'avatars (stables par id)
const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

function InitialsAvatar({ name, id, size = 44 }) {
    const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    const bg = AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: `${bg}25`, color: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: size * 0.36, flexShrink: 0, border: `1.5px solid ${bg}40`
        }}>
            {initials}
        </div>
    );
}

function StudentClassmates() {
    const { user } = useOutletContext();

    const [classmates, setClassmates] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage]       = useState({ text: '', type: '' });

    // Chat
    const [messages, setMessages]     = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [draft, setDraft]           = useState('');
    const [sending, setSending]       = useState(false);
    const [unread, setUnread]         = useState({});
    const scrollRef = useRef(null);
    const activeChatRef = useRef(null);
    activeChatRef.current = activeChat;

    /* ── Chargement initial : camarades + compteurs non-lus ── */
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/etudiant/camarades');
                setClassmates(res.data || []);
            } catch (e) {
                console.error('Erreur lors de la récupération des camarades :', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const refreshUnread = useCallback(async () => {
        try {
            const res = await messagerie.nonLus();
            setUnread(res.data || {});
        } catch { /* silencieux */ }
    }, []);

    useEffect(() => {
        refreshUnread();
        const iv = setInterval(refreshUnread, 15000);
        return () => clearInterval(iv);
    }, [refreshUnread]);

    /* ── Conversation active : chargement + polling 4 s ── */
    const fetchConversation = useCallback(async (camaradeId, silencieux = false) => {
        if (!silencieux) setChatLoading(true);
        try {
            const res = await messagerie.conversation(camaradeId);
            // On ignore la réponse si l'utilisateur a changé de conversation entre-temps
            if (activeChatRef.current?.id === camaradeId) {
                setMessages(res.data);
                setUnread(u => { const n = { ...u }; delete n[camaradeId]; return n; });
            }
        } catch { /* le polling réessaiera */ }
        finally { if (!silencieux) setChatLoading(false); }
    }, []);

    useEffect(() => {
        if (!activeChat) return;
        setMessages([]);
        fetchConversation(activeChat.id);
        const iv = setInterval(() => fetchConversation(activeChat.id, true), 4000);
        return () => clearInterval(iv);
    }, [activeChat, fetchConversation]);

    // Auto-scroll en bas à chaque nouveau message
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const flash = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    /* ── Envoi (optimiste) ── */
    const handleSend = async (e) => {
        e.preventDefault();
        const contenu = draft.trim();
        if (!contenu || !activeChat || sending) return;
        setSending(true);
        setDraft('');
        const optimiste = { id: `tmp-${Date.now()}`, contenu, de_moi: true, created_at: new Date().toISOString(), _pending: true };
        setMessages(m => [...m, optimiste]);
        try {
            const res = await messagerie.envoyer(activeChat.id, contenu);
            setMessages(m => m.map(x => x.id === optimiste.id ? res.data.message : x));
        } catch (err) {
            setMessages(m => m.filter(x => x.id !== optimiste.id));
            setDraft(contenu); // on rend le texte pour réessayer
            flash(!err.response ? 'Serveur injoignable — message non envoyé.' : 'Message non envoyé.', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleInvite = async () => {
        const inviteLink = `${window.location.origin}/etudiant/login`;
        try {
            await navigator.clipboard.writeText(inviteLink);
            flash('Lien d\'invitation copié — partagez-le sur WhatsApp, par e-mail ou sur vos réseaux !');
        } catch {
            flash(`Lien d'invitation : ${inviteLink}`);
        }
    };

    const handleStudyRoom = () => {
        flash(`Invitation Study Room envoyée à ${activeChat?.nom} — la collaboration en temps réel arrive bientôt !`);
    };

    const classeLabel = user?.classe_nom ? `Ma Classe (${user.classe_nom})` : 'Ma Classe';

    const heure = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const jour = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 190px)' }}>
            <MessageBox message={message} />

            <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>

                {/* ── Liste des Camarades ── */}
                <div className="glass-card" style={{ flex: '1 1 40%', maxWidth: 400, borderRadius: 'var(--radius-xl)', padding: 24, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20 }}>
                        <h3 className="section-title" style={{ margin: 0 }}>{classeLabel}</h3>
                        <button onClick={handleInvite} className="btn btn-primary btn-sm" style={{ padding: '7px 12px', fontSize: 12 }}>
                            <Icon name="user-plus" size={14} style={{ marginRight: 6 }} />
                            Inviter
                        </button>
                    </div>

                    {loading ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chargement…</p>
                    ) : classmates.length === 0 ? (
                        <Empty
                            icon="users"
                            title="Aucun camarade"
                            description="Invitez vos amis à rejoindre Wii-Co ou attendez d'être ajouté à une classe."
                            action={
                                <button onClick={handleInvite} className="btn btn-primary btn-sm">
                                    <Icon name="user-plus" size={14} style={{ marginRight: 6 }} />
                                    Inviter un ami
                                </button>
                            }
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                            {classmates.map(c => (
                                <div key={c.id} className="interactive" onClick={() => setActiveChat(c)} style={{
                                    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                                    background: activeChat?.id === c.id ? 'var(--glass-bg-light)' : 'transparent',
                                    border: `1px solid ${activeChat?.id === c.id ? 'var(--info)' : 'var(--glass-border)'}`,
                                    borderRadius: 16, cursor: 'pointer'
                                }}>
                                    <InitialsAvatar name={c.nom} id={c.id} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {c.nom}
                                            {c.est_delegue && (
                                                <span className="pill pill-accent" style={{ fontSize: 9.5, padding: '2px 8px' }}>Délégué</span>
                                            )}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                                            {unread[c.id] ? `${unread[c.id]} nouveau${unread[c.id] > 1 ? 'x' : ''} message${unread[c.id] > 1 ? 's' : ''}` : 'Discuter'}
                                        </p>
                                    </div>
                                    {unread[c.id] > 0 && (
                                        <span style={{ background: 'var(--danger)', color: '#fff', fontSize: 10.5, fontWeight: 800, minWidth: 20, height: 20, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', flexShrink: 0 }}>
                                            {unread[c.id]}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Chat ── */}
                <div className="glass-card" style={{ flex: 1, borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                    {activeChat ? (
                        <>
                            {/* Header du Chat */}
                            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'var(--glass-bg-light)', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                    <InitialsAvatar name={activeChat.nom} id={activeChat.id} size={40} />
                                    <div style={{ minWidth: 0 }}>
                                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeChat.nom}</h4>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Messagerie Wii-Co</span>
                                    </div>
                                </div>
                                <button onClick={handleStudyRoom} className="btn btn-primary btn-sm" style={{ padding: '8px 14px', borderRadius: 12, flexShrink: 0 }}>
                                    <Icon name="monitor" size={15} style={{ marginRight: 7 }} />
                                    Study Room
                                </button>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>
                                {chatLoading ? (
                                    <p style={{ margin: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>Chargement de la conversation…</p>
                                ) : messages.length === 0 ? (
                                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                            <Icon name="message-circle" size={24} style={{ color: 'var(--primary)' }} />
                                        </div>
                                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            Dites bonjour à {activeChat.nom?.split(' ')[0]} !
                                        </p>
                                        <p style={{ margin: '4px 0 0', fontSize: 12 }}>Les messages se rafraîchissent automatiquement.</p>
                                    </div>
                                ) : messages.map((m, i) => {
                                    const nouveauJour = i === 0 || jour(m.created_at) !== jour(messages[i - 1].created_at);
                                    return (
                                        <div key={m.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                            {nouveauJour && (
                                                <div style={{ alignSelf: 'center', fontSize: 11, color: 'var(--text-muted)', background: 'var(--glass-bg)', padding: '4px 12px', borderRadius: 16, margin: '8px 0' }}>
                                                    {jour(m.created_at)}
                                                </div>
                                            )}
                                            <div style={{
                                                alignSelf: m.de_moi ? 'flex-end' : 'flex-start',
                                                background: m.de_moi ? 'var(--primary-soft)' : 'var(--glass-bg-light)',
                                                border: `1px solid ${m.de_moi ? 'rgba(99,102,241,0.25)' : 'var(--glass-border)'}`,
                                                padding: '9px 14px',
                                                borderRadius: m.de_moi ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                maxWidth: '72%',
                                                opacity: m._pending ? 0.6 : 1,
                                            }}>
                                                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.contenu}</p>
                                                <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>
                                                    {m._pending ? 'envoi…' : heure(m.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Saisie */}
                            <form onSubmit={handleSend} style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder={`Écrire à ${activeChat.nom?.split(' ')[0]}…`}
                                        className="input"
                                        value={draft}
                                        onChange={e => setDraft(e.target.value)}
                                        maxLength={2000}
                                        style={{ flex: 1, borderRadius: 24, background: 'var(--glass-bg-light)' }}
                                    />
                                    <button type="submit" disabled={!draft.trim() || sending} className="btn btn-primary"
                                        style={{ padding: 0, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!draft.trim() || sending) ? 0.5 : 1 }}>
                                        <Icon name="send" size={18} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <Icon name="message-circle" size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                            <p style={{ fontSize: 15, fontWeight: 500 }}>Sélectionnez un camarade pour commencer à discuter</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default StudentClassmates;
