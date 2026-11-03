import { useState, useEffect, useRef } from 'react';
import MascotSVG from './Mascot';

/**
 * Mascot3D — mascotte 3D temps réel (WebGL via <model-viewer>).
 *
 * Le modèle est un fichier .glb standard : pour utiliser VOTRE mascotte
 * créée dans Blender ou Spline, exportez-la en .glb (avec des animations
 * nommées) et remplacez public/models/mascot.glb. Adaptez ANIMATIONS
 * ci-dessous aux noms de vos clips d'animation.
 *
 * Modèle par défaut : "RobotExpressive" (Tomás Laulhé, licence CC0) —
 * il salue de la main quand il donne un conseil.
 */

const MODEL_URL = process.env.PUBLIC_URL + '/models/mascot.glb';

const ANIMATIONS = {
    idle:    'Idle',       // animation de repos (boucle)
    speak:   'Wave',       // quand la mascotte "parle" (lève la main)
    happy:   'ThumbsUp',   // approbation ponctuelle
    dance:   'Dance',      // easter egg (double-clic)
};

function Mascot3D({ tips = [], size = 150, interval = 9000 }) {
    const [tipIndex, setTipIndex] = useState(0);
    const [talking, setTalking] = useState(true);
    const [failed, setFailed] = useState(false);
    const viewerRef = useRef(null);
    const danceRef = useRef(false);

    // Rotation automatique des conseils
    useEffect(() => {
        if (tips.length <= 1) {
            const t = setTimeout(() => setTalking(false), 3500);
            return () => clearTimeout(t);
        }
        const iv = setInterval(() => {
            setTipIndex(i => (i + 1) % tips.length);
            setTalking(true);
            setTimeout(() => setTalking(false), 3500);
        }, interval);
        const first = setTimeout(() => setTalking(false), 3500);
        return () => { clearInterval(iv); clearTimeout(first); };
    }, [tips.length, interval]);

    // Pilotage des animations du modèle : Wave quand elle parle, Idle sinon
    useEffect(() => {
        const v = viewerRef.current;
        if (!v || danceRef.current) return;
        v.setAttribute('animation-name', talking ? ANIMATIONS.speak : ANIMATIONS.idle);
    }, [talking]);

    const nextTip = () => {
        if (!tips.length) return;
        setTipIndex(i => (i + 1) % tips.length);
        setTalking(true);
        setTimeout(() => setTalking(false), 3500);
    };

    const easterEgg = () => {
        const v = viewerRef.current;
        if (!v) return;
        danceRef.current = true;
        v.setAttribute('animation-name', ANIMATIONS.dance);
        setTimeout(() => {
            danceRef.current = false;
            v.setAttribute('animation-name', ANIMATIONS.idle);
        }, 4500);
    };

    // WebGL indisponible ou modèle introuvable → mascotte SVG de secours
    if (failed) return <MascotSVG tips={tips} size={Math.round(size * 0.75)} interval={interval} />;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <style>{`
                @keyframes wiicoBubbleIn3d {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .wiico3d-bubble { animation: wiicoBubbleIn3d 0.4s ease-out; }
                model-viewer.wiico3d {
                    --poster-color: transparent;
                    background: transparent;
                }
            `}</style>

            {/* Bulle de dialogue */}
            {tips.length > 0 && (
                <div key={tipIndex} className="wiico3d-bubble" style={{
                    position: 'relative',
                    background: '#ffffff',
                    color: '#1e1b4b',
                    borderRadius: 16,
                    borderBottomRightRadius: 4,
                    padding: '10px 14px',
                    maxWidth: 235,
                    fontSize: 12.5,
                    fontWeight: 600,
                    lineHeight: 1.45,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                }}>
                    <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: '#4f46e5', letterSpacing: 1, marginBottom: 3 }}>
                        WIICO · CONSEIL
                    </span>
                    {tips[tipIndex]}
                    <div style={{
                        position: 'absolute', right: -7, bottom: 12,
                        width: 0, height: 0,
                        borderTop: '7px solid transparent',
                        borderBottom: '7px solid transparent',
                        borderLeft: '8px solid #ffffff',
                    }} />
                </div>
            )}

            {/* Modèle 3D temps réel */}
            <model-viewer
                ref={(el) => {
                    if (el && !viewerRef.current) {
                        viewerRef.current = el;
                        el.addEventListener('error', () => setFailed(true));
                        // Si le composant model-viewer ne s'initialise pas (offline), fallback
                        if (!window.customElements.get('model-viewer')) {
                            setTimeout(() => {
                                if (!window.customElements.get('model-viewer')) setFailed(true);
                            }, 4000);
                        }
                    }
                }}
                class="wiico3d"
                src={MODEL_URL}
                alt="Wiico, la mascotte 3D — clique pour un autre conseil"
                autoplay
                animation-name={ANIMATIONS.speak}
                camera-orbit="0deg 82deg 105%"
                camera-controls
                disable-zoom
                disable-pan
                disable-tap
                interaction-prompt="none"
                shadow-intensity="1.2"
                shadow-softness="0.8"
                exposure="1.1"
                onClick={nextTip}
                onDoubleClick={easterEgg}
                style={{
                    width: size,
                    height: size * 1.15,
                    cursor: 'pointer',
                    flexShrink: 0,
                }}
                title="Clique : un autre conseil · Double-clic : surprise"
            />
        </div>
    );
}

export default Mascot3D;
