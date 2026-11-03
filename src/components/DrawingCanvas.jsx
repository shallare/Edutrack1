import React, { useRef, useState, useEffect, useCallback } from 'react';
import Icon from './Icon';

/**
 * DrawingCanvas — atelier de schémas façon Figma :
 *  - barre d'outils verticale flottante (crayon, trait, rectangle, ellipse, flèche, gomme)
 *  - annuler / refaire, palette de couleurs, épaisseur, remplissage
 *  - copie dans le presse-papiers et insertion directe dans le texte du cours
 *
 * Le canvas interne (1600×900) est mis à l'échelle par rapport à sa taille
 * affichée : le trait suit exactement le curseur.
 */

const CANVAS_W = 1600;
const CANVAS_H = 900;
const HISTORY_MAX = 40;

const SWATCHES = ['#1e1b4b', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#111111'];

const TOOLS = [
    { id: 'pen',     icon: 'pen-tool',       label: 'Crayon (dessin libre)' },
    { id: 'line',    icon: 'slash',          label: 'Trait droit' },
    { id: 'rect',    icon: 'square',         label: 'Rectangle' },
    { id: 'ellipse', icon: 'circle',         label: 'Ellipse' },
    { id: 'arrow',   icon: 'arrow-up-right', label: 'Flèche' },
    { id: 'eraser',  icon: 'eraser',         label: 'Gomme' },
];

function DrawingCanvas({ onInsertToText }) {
    const canvasRef   = useRef(null);
    const drawingRef  = useRef(false);
    const startRef    = useRef({ x: 0, y: 0 });
    const snapshotRef = useRef(null);          // ImageData avant la forme en cours
    const historyRef  = useRef([]);            // dataURLs
    const histIdxRef  = useRef(-1);

    const [tool, setTool]           = useState('pen');
    const [color, setColor]         = useState('#1e1b4b');
    const [lineWidth, setLineWidth] = useState(3);
    const [fillShape, setFillShape] = useState(false);
    const [histState, setHistState] = useState({ canUndo: false, canRedo: false });
    const [feedback, setFeedback]   = useState('');

    const flash = (text) => {
        setFeedback(text);
        setTimeout(() => setFeedback(''), 2500);
    };

    /* ── Historique ─────────────────────────────────────────── */
    const syncHistState = () => setHistState({
        canUndo: histIdxRef.current > 0,
        canRedo: histIdxRef.current < historyRef.current.length - 1,
    });

    const pushHistory = useCallback(() => {
        const url = canvasRef.current.toDataURL('image/png');
        // Coupe la branche "redo" puis empile
        historyRef.current = historyRef.current.slice(0, histIdxRef.current + 1);
        historyRef.current.push(url);
        if (historyRef.current.length > HISTORY_MAX) historyRef.current.shift();
        histIdxRef.current = historyRef.current.length - 1;
        syncHistState();
    }, []);

    const restoreFrom = (url) => {
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
            ctx.drawImage(img, 0, 0);
        };
        img.src = url;
    };

    const undo = () => {
        if (histIdxRef.current <= 0) return;
        histIdxRef.current -= 1;
        restoreFrom(historyRef.current[histIdxRef.current]);
        syncHistState();
    };

    const redo = () => {
        if (histIdxRef.current >= historyRef.current.length - 1) return;
        histIdxRef.current += 1;
        restoreFrom(historyRef.current[histIdxRef.current]);
        syncHistState();
    };

    /* ── Init ───────────────────────────────────────────────── */
    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        pushHistory(); // état initial (pour pouvoir tout annuler)
    }, [pushHistory]);

    /* ── Coordonnées réelles (corrige l'échelle CSS) ────────── */
    const getPos = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height),
        };
    }, []);

    /* ── Styles de trait ────────────────────────────────────── */
    const applyStyle = (ctx) => {
        if (tool === 'eraser') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(lineWidth * 5, 22);
        } else {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = lineWidth;
        }
    };

    const drawShape = (ctx, x0, y0, x1, y1) => {
        ctx.beginPath();
        if (tool === 'line') {
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        } else if (tool === 'rect') {
            const w = x1 - x0, h = y1 - y0;
            if (fillShape) ctx.fillRect(x0, y0, w, h);
            ctx.strokeRect(x0, y0, w, h);
        } else if (tool === 'ellipse') {
            ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, Math.PI * 2);
            if (fillShape) ctx.fill();
            ctx.stroke();
        } else if (tool === 'arrow') {
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
            // Pointe de flèche
            const angle = Math.atan2(y1 - y0, x1 - x0);
            const head = 16 + lineWidth * 2.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - head * Math.cos(angle - Math.PI / 6), y1 - head * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - head * Math.cos(angle + Math.PI / 6), y1 - head * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
    };

    /* ── Événements pointeur ────────────────────────────────── */
    const startDrawing = (e) => {
        const ctx = canvasRef.current.getContext('2d');
        const pos = getPos(e);
        startRef.current = pos;
        drawingRef.current = true;
        applyStyle(ctx);

        if (tool === 'pen' || tool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x + 0.1, pos.y + 0.1); // point dès le clic
            ctx.stroke();
        } else {
            // Formes : on mémorise l'état pour l'aperçu en direct
            snapshotRef.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        }
    };

    const draw = (e) => {
        if (!drawingRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const pos = getPos(e);
        applyStyle(ctx);

        if (tool === 'pen' || tool === 'eraser') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (snapshotRef.current) {
            // Aperçu : on repart de l'état initial puis on trace la forme
            ctx.putImageData(snapshotRef.current, 0, 0);
            drawShape(ctx, startRef.current.x, startRef.current.y, pos.x, pos.y);
        }
    };

    const stopDrawing = () => {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        snapshotRef.current = null;
        pushHistory();
    };

    /* ── Actions ────────────────────────────────────────────── */
    const clearCanvas = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        pushHistory();
    };

    const downloadDrawing = () => {
        const a = document.createElement('a');
        a.download = 'schema-wiico.png';
        a.href = canvasRef.current.toDataURL('image/png');
        a.click();
    };

    const copyToClipboard = async () => {
        try {
            const blob = await new Promise(res => canvasRef.current.toBlob(res, 'image/png'));
            await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
            flash('Dessin copié ! Collez-le (Ctrl+V) dans le texte ou ailleurs.');
        } catch {
            flash('Copie non supportée par ce navigateur — utilisez « Insérer dans le texte ».');
        }
    };

    const insertToText = () => {
        if (!onInsertToText) return;
        onInsertToText(canvasRef.current.toDataURL('image/png'));
    };

    /* ── Rendu ──────────────────────────────────────────────── */
    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

            {/* ═ Barre supérieure ═ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>

                {/* Annuler / refaire */}
                <div style={{ display: 'flex', gap: 2 }}>
                    <TopBtn icon="undo" title="Annuler (dernière action)" onClick={undo} disabled={!histState.canUndo} />
                    <TopBtn icon="redo" title="Refaire" onClick={redo} disabled={!histState.canRedo} />
                </div>

                <Sep />

                {/* Palette de couleurs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {SWATCHES.map(c => (
                        <button key={c} onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
                            title={c}
                            style={{
                                width: 20, height: 20, borderRadius: 6, background: c, cursor: 'pointer',
                                border: color === c ? '2px solid var(--primary)' : '1.5px solid var(--glass-border)',
                                boxShadow: color === c ? '0 0 0 2px var(--primary-soft)' : 'none',
                                transition: 'transform .1s',
                            }} />
                    ))}
                    <input
                        type="color" value={color}
                        onChange={(e) => { setColor(e.target.value); if (tool === 'eraser') setTool('pen'); }}
                        title="Couleur personnalisée"
                        style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
                    />
                </div>

                <Sep />

                {/* Épaisseur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title="Épaisseur du trait">
                    <div style={{ width: lineWidth + 4, height: lineWidth + 4, maxWidth: 16, maxHeight: 16, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <input type="range" min="1" max="14" value={lineWidth}
                        onChange={e => setLineWidth(Number(e.target.value))}
                        style={{ width: 90, accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', width: 26 }}>{lineWidth}px</span>
                </div>

                {/* Remplissage (formes) */}
                {(tool === 'rect' || tool === 'ellipse') && (
                    <>
                        <Sep />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                            <input type="checkbox" checked={fillShape} onChange={e => setFillShape(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                            Remplir
                        </label>
                    </>
                )}

                {/* Feedback */}
                {feedback && (
                    <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{feedback}</span>
                )}

                {/* Actions à droite */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {onInsertToText && (
                        <button onClick={insertToText} className="btn btn-primary btn-sm" style={{ fontSize: 12, padding: '7px 14px' }} title="Insérer le dessin dans le texte du cours">
                            <Icon name="image" size={14} style={{ marginRight: 6 }} />
                            Insérer dans le texte
                        </button>
                    )}
                    <TopBtn icon="copy" title="Copier le dessin (presse-papiers)" onClick={copyToClipboard} />
                    <TopBtn icon="download" title="Télécharger en PNG" onClick={downloadDrawing} />
                    <TopBtn icon="trash-2" title="Tout effacer" onClick={clearCanvas} danger />
                </div>
            </div>

            {/* ═ Zone de travail (fond gris + planche blanche, façon Figma) ═ */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 18px 18px 74px', overflow: 'hidden' }}>

                {/* Barre d'outils verticale flottante */}
                <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', flexDirection: 'column', gap: 4,
                    background: 'var(--glass-bg-strong)', backdropFilter: 'blur(16px)',
                    border: '1px solid var(--glass-border)', borderRadius: 14,
                    padding: 6, boxShadow: 'var(--shadow-md)', zIndex: 5,
                }}>
                    {TOOLS.map(t => (
                        <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                            style={{
                                width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: tool === t.id ? 'var(--primary)' : 'transparent',
                                color: tool === t.id ? '#fff' : 'var(--text-secondary)',
                                boxShadow: tool === t.id ? 'var(--shadow-glow-primary)' : 'none',
                                transition: 'all .15s',
                            }}
                            onMouseEnter={e => { if (tool !== t.id) e.currentTarget.style.background = 'var(--glass-bg-light)'; }}
                            onMouseLeave={e => { if (tool !== t.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <Icon name={t.icon} size={17} />
                        </button>
                    ))}
                </div>

                {/* Planche blanche */}
                <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                        cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                        touchAction: 'none',
                    }}
                />
            </div>
        </div>
    );
}

function TopBtn({ icon, title, onClick, disabled, danger }) {
    return (
        <button onClick={onClick} title={title} disabled={disabled}
            style={{
                width: 32, height: 32, borderRadius: 9, border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg-light)', cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: disabled ? 'var(--text-muted)' : danger ? 'var(--danger)' : 'var(--text-secondary)',
                opacity: disabled ? 0.45 : 1,
                transition: 'all .15s',
            }}>
            <Icon name={icon} size={15} />
        </button>
    );
}

function Sep() {
    return <div style={{ width: 1, height: 22, background: 'var(--glass-border)' }} />;
}

export default DrawingCanvas;
