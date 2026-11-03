import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth, MessageBox, LoadingScreen } from '../components/Common';
import { studentMenu } from '../utils/menus';

function MonQRCode() {
    const { user, ready } = useAuth(['etudiant', 'delegue'], '/etudiant/login');
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const qrWrapRef = useRef(null);

    // Si l'utilisateur a deja un QR enregistre, le charger automatiquement
    useEffect(() => {
        if (!ready || !user) return;
        if (user.code_qr) {
            setQrData(user.code_qr);
        }
    }, [ready, user]);

    const genererQR = async () => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await api.get('/etudiant/qrcode');
            setQrData(res.data.qr_code);
            setGenerated(new Date());

            // Mettre a jour user en local pour que le QR soit garde
            const userData = JSON.parse(localStorage.getItem('user'));
            userData.code_qr = res.data.qr_code;
            localStorage.setItem('user', JSON.stringify(userData));

            setMessage({ text: 'QR Code genere avec succes', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (e) {
            setMessage({ text: 'Erreur lors de la generation du QR Code', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        if (!qrWrapRef.current) return;
        const svg = qrWrapRef.current.querySelector('svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            canvas.width = 600;
            canvas.height = 600;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 600, 600);
            ctx.drawImage(img, 50, 50, 500, 500);
            URL.revokeObjectURL(url);
            const a = document.createElement('a');
            a.download = `qrcode-${user?.matricule || user?.id}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = url;
    };

    if (!ready) return <LoadingScreen />;

    const isDelegue = user?.role === 'delegue';

    return (
        <Layout
            user={user}
            role={user?.role}
            menuItems={studentMenu(isDelegue)}
            title="Mon QR Code de presence"
            subtitle="Presentez ce code au delegue pour enregistrer votre presence"
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Left Column: QR Code Display */}
                <div style={{ flex: '1 1 55%', minWidth: 320 }}>
                    <div className="glass-card-strong" style={{
                        padding: 36,
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        {/* Decoration */}
                        <div style={{
                            position: 'absolute',
                            top: -80, right: -80,
                            width: 220, height: 220,
                            background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.15) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        {!qrData ? (
                            <>
                                <div style={{
                                    width: 96, height: 96,
                                    margin: '0 auto 20px',
                                    borderRadius: 20,
                                    background: 'var(--accent-soft)',
                                    color: 'var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed rgba(var(--accent-rgb), 0.4)',
                                }}>
                                    <Icon name="qr-code" size={44} />
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px', fontFamily: 'var(--font-display)' }}>
                                    Code Inexistant
                                </h3>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 auto 24px', maxWidth: 320, lineHeight: 1.6 }}>
                                    Générez votre code unique pour valider votre présence lors des prochaines séances.
                                </p>
                                <button onClick={genererQR} disabled={loading} className="btn btn-primary btn-lg">
                                    {loading ? <><div className="spinner spinner-sm" /> Génération...</> : <><Icon name="qr-code" size={16} /> Générer le QR Code</>}
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--success-soft)', borderRadius: 999, marginBottom: 24, fontSize: 11, fontWeight: 800, color: 'var(--success)' }}>
                                    <Icon name="check-circle" size={12} />
                                    VOTRE CODE EST ACTIF
                                </div>

                                <div ref={qrWrapRef} style={{ width: 260, height: 260, margin: '0 auto 24px', padding: 18, background: '#fff', borderRadius: 24, boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)', position: 'relative', zIndex: 1 }}>
                                    <QRCodeSVG value={qrData} size={224} level="H" bgColor="#ffffff" fgColor="#0A1F44" includeMargin={false} />
                                </div>

                                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                    <button onClick={downloadQR} className="btn btn-secondary">
                                        <Icon name="download" size={14} /> Télécharger
                                    </button>
                                    <button onClick={genererQR} disabled={loading} className="btn btn-primary">
                                        {loading ? '...' : <><Icon name="refresh" size={14} /> Régénérer</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: Identity & Help */}
                <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Identity Widget */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h4 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Identité Étudiant</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="avatar avatar-lg accent">
                                {(user?.nom_complet || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <div>
                                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{user?.nom_complet}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'monospace' }}>Matricule: {user?.matricule || 'Non assigné'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Usage Instructions */}
                    <div className="glass-card" style={{ padding: 24, background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
                        <h4 style={{ margin: '0 0 12px', color: 'var(--accent)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Utilisation</h4>
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <li style={{ fontSize: 13, display: 'flex', gap: 12 }}>
                                <div style={{ marginTop: 2 }}><Icon name="sun" size={14} /></div>
                                <span>Augmentez la luminosité de votre écran pour faciliter le scan.</span>
                            </li>
                            <li style={{ fontSize: 13, display: 'flex', gap: 12 }}>
                                <div style={{ marginTop: 2 }}><Icon name="shield-check" size={14} /></div>
                                <span>Ce code est personnel et lié à votre identité académique.</span>
                            </li>
                            <li style={{ fontSize: 13, display: 'flex', gap: 12 }}>
                                <div style={{ marginTop: 2 }}><Icon name="clock" size={14} /></div>
                                <span>Valable pour toutes les séances de l'année en cours.</span>
                            </li>
                        </ul>
                    </div>

                    {generated && (
                        <div style={{ textAlign: 'center', opacity: 0.6 }}>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                                <Icon name="clock" size={11} /> Généré le {generated.toLocaleDateString('fr-FR')} à {generated.toLocaleTimeString('fr-FR')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default MonQRCode;
