import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth, MessageBox, LoadingScreen, Empty, StatCard } from '../components/Common';
import { studentMenu } from '../utils/menus';

const SCANNER_DOM_ID = 'edutrack-qr-scanner';

function ScannerPresence() {
    const { user, ready } = useAuth(['delegue', 'etudiant'], '/etudiant/login');
    const [cours, setCours] = useState([]);
    const [selectedCours, setSelectedCours] = useState('');
    const [presences, setPresences] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [cameraOn, setCameraOn]   = useState(false);
    const [cameras, setCameras]     = useState([]);
    const [cameraId, setCameraId]   = useState(null);
    const [scanning, setScanning]   = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    const [qrInput, setQrInput]       = useState('');
    const [geo, setGeo]               = useState(null);

    const html5QrCodeRef    = useRef(null);
    const lastScanRef       = useRef({ data: null, time: 0 });
    const inFlightRef       = useRef(false);

    /* ----------------------------------------------------------
       Chargement initial
       ---------------------------------------------------------- */
    useEffect(() => {
        if (!ready) return;
        fetchCours();
        // Geolocalisation
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setGeo({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                }),
                () => { /* refus = pas grave */ },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }
    }, [ready]);

    useEffect(() => {
        if (selectedCours) fetchPresences();
        // eslint-disable-next-line
    }, [selectedCours]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line
    }, []);

    const fetchCours = async () => {
        try {
            const res = await api.get('/etudiant/cours');
            setCours(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchPresences = async () => {
        if (!selectedCours) return;
        try {
            const res = await api.get(`/cours/${selectedCours}/presences`);
            setPresences(res.data);
        } catch (e) { console.error(e); }
    };

    /* ----------------------------------------------------------
       Logique de scan (envoi a l'API)
       ---------------------------------------------------------- */
    const submitScan = useCallback(async (qrData) => {
        if (!selectedCours) {
            setMessage({ text: 'Veuillez d\'abord selectionner un cours', type: 'error' });
            return;
        }
        if (inFlightRef.current) return;
        // Debounce : ne pas re-scanner le meme code dans les 3s
        const now = Date.now();
        if (lastScanRef.current.data === qrData && now - lastScanRef.current.time < 3000) {
            return;
        }
        lastScanRef.current = { data: qrData, time: now };
        inFlightRef.current = true;

        setScanning(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await api.post('/presence/scanner', {
                cours_id: selectedCours,
                qr_data: qrData,
                latitude: geo?.latitude,
                longitude: geo?.longitude,
            });
            setMessage({
                text: `${res.data.etudiant} marque(e) present(e)`,
                type: 'success',
            });
            // Beep visuel : on flash brievement
            fetchPresences();
        } catch (error) {
            setMessage({
                text: error.response?.data?.erreur || 'Erreur lors du scan',
                type: 'error',
            });
        } finally {
            setScanning(false);
            inFlightRef.current = false;
            // efface le toast au bout de 3s
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    }, [selectedCours, geo]);

    /* ----------------------------------------------------------
       Camera : start / stop / switch
       ---------------------------------------------------------- */
    const startCamera = async (specificCameraId = null) => {
        if (!selectedCours) {
            setMessage({ text: 'Selectionnez un cours avant d\'activer la camera', type: 'error' });
            return;
        }
        try {
            // Lister les cameras disponibles
            if (cameras.length === 0) {
                const devices = await Html5Qrcode.getCameras();
                if (!devices || devices.length === 0) {
                    setMessage({ text: 'Aucune camera detectee sur cet appareil', type: 'error' });
                    return;
                }
                setCameras(devices);
                // Preferer la camera arriere
                const back = devices.find(d => /back|arriere|rear|environment/i.test(d.label));
                specificCameraId = specificCameraId || back?.id || devices[0].id;
                setCameraId(specificCameraId);
            } else {
                specificCameraId = specificCameraId || cameraId || cameras[0].id;
            }

            const html5QrCode = new Html5Qrcode(SCANNER_DOM_ID, /* verbose */ false);
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                specificCameraId,
                {
                    fps: 10,
                    qrbox: (vw, vh) => {
                        const minEdge = Math.min(vw, vh);
                        const size = Math.floor(minEdge * 0.75);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    submitScan(decodedText);
                },
                () => { /* erreurs de scan continu, ignorer */ }
            );

            setCameraOn(true);
        } catch (err) {
            console.error('Camera start error', err);
            const msg = String(err?.message || err);
            let user_msg = 'Impossible d\'activer la camera';
            if (/permission|denied|notallowed/i.test(msg)) {
                user_msg = 'Autorisation camera refusee. Activez-la dans les parametres du navigateur.';
            } else if (/not found|no camera/i.test(msg)) {
                user_msg = 'Aucune camera detectee';
            } else if (/secure|https/i.test(msg)) {
                user_msg = 'La camera necessite HTTPS ou localhost';
            }
            setMessage({ text: user_msg, type: 'error' });
            setCameraOn(false);
        }
    };

    const stopCamera = async () => {
        try {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
                await html5QrCodeRef.current.clear();
            }
        } catch (e) { /* ignore */ }
        html5QrCodeRef.current = null;
        setCameraOn(false);
    };

    const switchCamera = async () => {
        if (cameras.length < 2) return;
        await stopCamera();
        const currentIdx = cameras.findIndex(c => c.id === cameraId);
        const next = cameras[(currentIdx + 1) % cameras.length];
        setCameraId(next.id);
        // Petite pause pour eviter conflit
        setTimeout(() => startCamera(next.id), 200);
    };

    /* ----------------------------------------------------------
       Saisie manuelle
       ---------------------------------------------------------- */
    const handleManualScan = () => {
        if (!qrInput.trim()) return;
        submitScan(qrInput.trim());
        setQrInput('');
    };

    /* ----------------------------------------------------------
       Marquer absents
       ---------------------------------------------------------- */
    const handleMarquerAbsents = async () => {
        if (!selectedCours) return;
        try {
            await api.post(`/cours/${selectedCours}/absents`);
            fetchPresences();
            setMessage({ text: 'Etudiants restants marques comme absents', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (e) {
            setMessage({ text: 'Erreur lors du marquage des absents', type: 'error' });
        }
    };

    if (!ready) return <LoadingScreen />;

    const isDelegue = user?.role === 'delegue';
    const presents = presences.filter(p => p.statut === 'present').length;
    const absents = presences.filter(p => p.statut === 'absent').length;
    const retards = presences.filter(p => p.statut === 'retard').length;

    return (
        <Layout
            user={user}
            role={user?.role}
            menuItems={studentMenu(isDelegue)}
            title="Scanner les présences"
            subtitle="Activez la caméra et scannez les QR Codes"
            actions={geo ? (
                <span className="pill pill-success" style={{ padding: '6px 12px', fontSize: 11 }}>
                    <Icon name="map-pin" size={11} />
                    Position acquise
                </span>
            ) : (
                <span className="pill pill-neutral" style={{ padding: '6px 12px', fontSize: 11 }}>
                    <Icon name="map-pin" size={11} />
                    Sans position
                </span>
            )}
        >
            {/* Banner Section */}
            <div style={{
                position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)',
                borderRadius: 'var(--radius-xl)', padding: '32px 40px', color: '#fff',
                boxShadow: 'var(--shadow-glow-accent)', marginBottom: 24
            }}>
                <h2 style={{ fontSize: 26, margin: '0 0 8px', fontFamily: 'var(--font-display)', zIndex: 2, position: 'relative' }}>
                    Scanner de Présences
                </h2>
                <p style={{ opacity: 0.9, maxWidth: '60%', margin: '0', lineHeight: 1.5, zIndex: 2, position: 'relative', fontSize: 14 }}>
                    Sélectionnez votre cours et activez la caméra pour enregistrer les présences via QR Code.
                </p>
                
                {/* Banner Decorations */}
                <div style={{
                    position: 'absolute', right: '-5%', bottom: '-15%',
                    width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%',
                    zIndex: 1
                }} />
                <div style={{
                    position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%) rotate(10deg)', zIndex: 1, opacity: 0.8,
                }}>
                    <Icon name="qr-code" size={100} color="white" />
                </div>
            </div>

            {/* Selecteur cours */}
            <div className="glass-card" style={{ padding: 22, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 44, height: 44,
                        borderRadius: 12,
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Icon name="book" size={22} />
                    </div>
                    <div style={{ flex: '1 1 240px', minWidth: 200 }}>
                        <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                            Cours en cours
                        </label>
                        <select
                            value={selectedCours}
                            onChange={(e) => setSelectedCours(e.target.value)}
                            className="select"
                        >
                            <option value="">Choisir un cours...</option>
                            {cours.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.matiere?.nom} — {new Date(c.date).toLocaleDateString('fr-FR')} ({c.classe?.nom})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {message.text && <div style={{ marginBottom: 18 }}><MessageBox message={message} /></div>}

            {selectedCours && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 14,
                    marginBottom: 22,
                }}>
                    <StatCard label="Presents" value={presents} icon="check-circle" color="success" />
                    <StatCard label="Retards"  value={retards}  icon="clock"        color="warning" />
                    <StatCard label="Absents"  value={absents}  icon="x-circle"     color="danger" />
                    <StatCard label="Total"    value={presences.length} icon="users" color="primary" />
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 460px) 1fr',
                gap: 22,
            }} className="scanner-grid">
                {/* Scanner */}
                <div className="glass-card" style={{ padding: 22 }}>
                    <h3 className="section-title" style={{ marginBottom: 14 }}>
                        <Icon name="scan" size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        Scanner
                    </h3>

                    {/* Zone camera */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1',
                        background: '#000',
                        borderRadius: 14,
                        overflow: 'hidden',
                        marginBottom: 14,
                        border: '1px solid var(--glass-border)',
                    }}>
                        <div id={SCANNER_DOM_ID} style={{ width: '100%', height: '100%' }} />

                        {!cameraOn && (
                            /* Placeholder */
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 14,
                                background: 'linear-gradient(135deg, rgba(10, 31, 68, 0.9) 0%, rgba(6, 11, 30, 0.95) 100%)',
                                color: 'var(--text-secondary)',
                                padding: 22,
                                textAlign: 'center',
                            }}>
                                <div style={{
                                    width: 70, height: 70,
                                    borderRadius: 18,
                                    background: 'var(--glass-bg-light)',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Icon name="camera-off" size={32} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <p style={{
                                        fontSize: 13.5,
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 4px',
                                    }}>
                                        Camera inactive
                                    </p>
                                    <p style={{
                                        fontSize: 12,
                                        color: 'var(--text-muted)',
                                        margin: 0,
                                    }}>
                                        Selectionnez un cours puis activez la camera
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Overlay viseur quand camera active */}
                        {cameraOn && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{
                                    width: '70%',
                                    height: '70%',
                                    border: '2px solid var(--accent)',
                                    borderRadius: 16,
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                                    position: 'relative',
                                    animation: 'pulse 2s ease-in-out infinite',
                                }}>
                                    {/* Coins du viseur */}
                                    {['nw', 'ne', 'sw', 'se'].map(corner => (
                                        <div key={corner} style={{
                                            position: 'absolute',
                                            width: 20, height: 20,
                                            borderColor: 'var(--accent)',
                                            borderStyle: 'solid',
                                            borderWidth: 0,
                                            ...(corner.includes('n') ? { top: -2 } : { bottom: -2 }),
                                            ...(corner.includes('w') ? { left: -2 } : { right: -2 }),
                                            ...(corner.includes('n') ? { borderTopWidth: 4 } : { borderBottomWidth: 4 }),
                                            ...(corner.includes('w') ? { borderLeftWidth: 4 } : { borderRightWidth: 4 }),
                                            borderRadius: 4,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {scanning && (
                            <div style={{
                                position: 'absolute',
                                top: 12, right: 12,
                                background: 'var(--accent)',
                                color: 'var(--text-on-accent)',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                            }}>
                                <div className="spinner spinner-sm" style={{
                                    width: 11,
                                    height: 11,
                                    borderColor: 'rgba(0,0,0,0.2)',
                                    borderTopColor: 'var(--text-on-accent)',
                                }} />
                                Validation
                            </div>
                        )}
                    </div>

                    {/* Controles camera */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        {!cameraOn ? (
                            <button
                                onClick={() => startCamera()}
                                disabled={!selectedCours}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                <Icon name="camera" size={15} />
                                Activer camera
                            </button>
                        ) : (
                            <>
                                <button onClick={stopCamera} className="btn btn-danger" style={{ flex: 1 }}>
                                    <Icon name="camera-off" size={15} />
                                    Stopper
                                </button>
                                {cameras.length >= 2 && (
                                    <button onClick={switchCamera} className="btn btn-secondary" title="Changer de camera">
                                        <Icon name="refresh" size={15} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Saisie manuelle (fallback) */}
                    <button
                        onClick={() => setManualOpen(!manualOpen)}
                        className="btn btn-ghost btn-sm btn-block"
                        style={{ marginBottom: manualOpen ? 12 : 0 }}
                    >
                        <Icon name={manualOpen ? 'chevron-down' : 'chevron-right'} size={13} />
                        {manualOpen ? 'Masquer' : 'Saisir manuellement'}
                    </button>

                    {manualOpen && (
                        <div style={{
                            padding: 14,
                            background: 'var(--glass-bg-light)',
                            borderRadius: 12,
                            border: '1px solid var(--glass-border)',
                        }}>
                            <p style={{
                                fontSize: 11.5,
                                color: 'var(--text-muted)',
                                margin: '0 0 8px',
                            }}>
                                Si la camera ne marche pas, collez les donnees du QR Code ici :
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    placeholder="Donnees QR..."
                                    className="input"
                                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                                    style={{ fontSize: 12 }}
                                />
                                <button
                                    onClick={handleManualScan}
                                    disabled={!qrInput.trim()}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Icon name="check" size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Liste presences */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        padding: '18px 22px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                    }}>
                        <h3 className="section-title">
                            <Icon name="list" size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Liste de presence
                        </h3>
                        {presences.length > 0 && (
                            <button
                                onClick={handleMarquerAbsents}
                                className="btn btn-sm btn-secondary"
                                style={{ color: 'var(--danger)' }}
                            >
                                <Icon name="x" size={13} />
                                Marquer absents restants
                            </button>
                        )}
                    </div>

                    {!selectedCours ? (
                        <Empty
                            icon="book"
                            title="Aucun cours selectionne"
                            description="Choisissez un cours dans le selecteur ci-dessus"
                        />
                    ) : presences.length === 0 ? (
                        <Empty
                            icon="users"
                            title="Aucune presence enregistree"
                            description="Activez la camera et commencez a scanner les QR Codes"
                        />
                    ) : (
                        <div style={{ overflowX: 'auto', maxHeight: 540 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Etudiant</th>
                                        <th>Matricule</th>
                                        <th>Statut</th>
                                        <th>Heure</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {presences.map((p, i) => {
                                        const initials = (p.nom_complet || '?')
                                            .split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
                                        return (
                                            <tr key={i}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div className="avatar avatar-sm">{initials}</div>
                                                        <span style={{ fontWeight: 600 }}>{p.nom_complet}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>
                                                    {p.matricule || '—'}
                                                </td>
                                                <td>
                                                    {p.statut === 'present' && (
                                                        <span className="pill pill-success">
                                                            <Icon name="check" size={11} />
                                                            Present
                                                        </span>
                                                    )}
                                                    {p.statut === 'retard' && (
                                                        <span className="pill pill-warning">
                                                            <Icon name="clock" size={11} />
                                                            Retard
                                                        </span>
                                                    )}
                                                    {p.statut === 'absent' && (
                                                        <span className="pill pill-danger">
                                                            <Icon name="x" size={11} />
                                                            Absent
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                                                    {p.heure_scan
                                                        ? new Date(p.heure_scan).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                                        : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Styles inline pour la grille responsive et l'animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 0 rgba(244, 184, 96, 0.4); }
                    50%      { box-shadow: 0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 8px rgba(244, 184, 96, 0); }
                }
                @media (max-width: 900px) {
                    .scanner-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </Layout>
    );
}

export default ScannerPresence;
