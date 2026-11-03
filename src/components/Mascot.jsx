import { useState, useEffect } from 'react';

/**
 * Mascot — "Wiico", la mascotte étudiante de la plateforme.
 * Style chibi avec relief 3D (dégradés + ombres portées).
 * - cligne des yeux en continu
 * - lève le bras et ouvre la bouche quand elle "parle" (nouveau conseil)
 * - bulle de dialogue avec conseils rotatifs (clic = conseil suivant)
 */
function Mascot({ tips = [], size = 150, interval = 9000 }) {
    const [tipIndex, setTipIndex] = useState(0);
    const [talking, setTalking] = useState(true);

    useEffect(() => {
        if (tips.length <= 1) {
            const t = setTimeout(() => setTalking(false), 3200);
            return () => clearTimeout(t);
        }
        const iv = setInterval(() => {
            setTipIndex(i => (i + 1) % tips.length);
            setTalking(true);
            setTimeout(() => setTalking(false), 3200);
        }, interval);
        const first = setTimeout(() => setTalking(false), 3200);
        return () => { clearInterval(iv); clearTimeout(first); };
    }, [tips.length, interval]);

    const nextTip = () => {
        if (!tips.length) return;
        setTipIndex(i => (i + 1) % tips.length);
        setTalking(true);
        setTimeout(() => setTalking(false), 3200);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <style>{`
                @keyframes wiicoBlink {
                    0%, 91%, 100% { transform: scaleY(1); }
                    94%, 96%      { transform: scaleY(0.06); }
                }
                @keyframes wiicoBob {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-5px); }
                }
                @keyframes wiicoWave {
                    0%, 100% { transform: rotate(-58deg); }
                    50%      { transform: rotate(-74deg); }
                }
                @keyframes wiicoTalk {
                    0%, 100% { transform: scaleY(1); }
                    50%      { transform: scaleY(0.45); }
                }
                @keyframes wiicoBubbleIn {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .wiico-svg { animation: wiicoBob 3.4s ease-in-out infinite; cursor: pointer; }
                .wiico-eye {
                    transform-box: fill-box;
                    transform-origin: center;
                    animation: wiicoBlink 4.2s ease-in-out infinite;
                }
                .wiico-arm-r {
                    transform-box: view-box;
                    transform-origin: 151px 152px;
                    transform: rotate(0deg);
                    transition: transform 0.55s cubic-bezier(.34,1.56,.64,1);
                }
                .wiico-talking .wiico-arm-r { animation: wiicoWave 1.5s ease-in-out infinite; }
                .wiico-mouth {
                    transform-box: fill-box;
                    transform-origin: center top;
                    transform: scaleY(0.45);
                    transition: transform 0.3s;
                }
                .wiico-talking .wiico-mouth { animation: wiicoTalk 0.42s ease-in-out infinite; }
                .wiico-bubble { animation: wiicoBubbleIn 0.4s ease-out; }
            `}</style>

            {/* Bulle de dialogue */}
            {tips.length > 0 && (
                <div key={tipIndex} className="wiico-bubble" style={{
                    position: 'relative',
                    background: '#ffffff',
                    color: '#1e1b4b',
                    borderRadius: 16,
                    borderBottomRightRadius: 4,
                    padding: '10px 14px',
                    maxWidth: 230,
                    fontSize: 12.5,
                    fontWeight: 600,
                    lineHeight: 1.45,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                }}>
                    <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: '#4f46e5', letterSpacing: 1, marginBottom: 3 }}>
                        WIICO · CONSEIL
                    </span>
                    {tips[tipIndex]}
                    {/* Queue de la bulle, pointée vers la mascotte */}
                    <div style={{
                        position: 'absolute', right: -7, bottom: 12,
                        width: 0, height: 0,
                        borderTop: '7px solid transparent',
                        borderBottom: '7px solid transparent',
                        borderLeft: '8px solid #ffffff',
                    }} />
                </div>
            )}

            {/* Mascotte */}
            <svg
                className={`wiico-svg ${talking ? 'wiico-talking' : ''}`}
                width={size} height={size * 300 / 220}
                viewBox="0 0 220 300"
                onClick={nextTip}
                role="img"
                aria-label="Wiico, la mascotte — clique pour un autre conseil"
            >
                <defs>
                    <radialGradient id="wiicoSkin" cx="42%" cy="32%" r="75%">
                        <stop offset="0%" stopColor="#ffe6c7" />
                        <stop offset="70%" stopColor="#fbd3a2" />
                        <stop offset="100%" stopColor="#eeb87f" />
                    </radialGradient>
                    <linearGradient id="wiicoShirt" x1="0" y1="0" x2="0.4" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#dfe5f2" />
                    </linearGradient>
                    <linearGradient id="wiicoPants" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#28246e" />
                    </linearGradient>
                    <radialGradient id="wiicoHair" cx="45%" cy="25%" r="80%">
                        <stop offset="0%" stopColor="#8a5a34" />
                        <stop offset="100%" stopColor="#5b3a1e" />
                    </radialGradient>
                    <filter id="wiicoShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.28" />
                    </filter>
                </defs>

                {/* Ombre au sol */}
                <ellipse cx="110" cy="288" rx="52" ry="8" fill="rgba(0,0,0,0.22)" />

                <g filter="url(#wiicoShadow)">
                    {/* ── Jambes (pantalon) ── */}
                    <rect x="86" y="200" width="21" height="60" rx="9" fill="url(#wiicoPants)" />
                    <rect x="113" y="200" width="21" height="60" rx="9" fill="url(#wiicoPants)" />
                    <rect x="82" y="192" width="56" height="26" rx="11" fill="url(#wiicoPants)" />
                    {/* Reflet pantalon (relief) */}
                    <rect x="90" y="204" width="5" height="46" rx="2.5" fill="rgba(255,255,255,0.14)" />

                    {/* Chaussures */}
                    <path d="M83 256 h26 a6 6 0 0 1 6 6 v4 a3 3 0 0 1 -3 3 h-29 a4 4 0 0 1 -4 -4 v-3 a6 6 0 0 1 4 -6z" fill="#1e293b" />
                    <path d="M111 256 h26 a6 6 0 0 1 6 6 v4 a3 3 0 0 1 -3 3 h-29 a4 4 0 0 1 -4 -4 v-3 a6 6 0 0 1 4 -6z" fill="#1e293b" />
                    <rect x="83" y="262" width="32" height="3" rx="1.5" fill="#f8fafc" opacity="0.85" />
                    <rect x="111" y="262" width="32" height="3" rx="1.5" fill="#f8fafc" opacity="0.85" />

                    {/* ── Bras gauche (statique) ── */}
                    <rect x="58" y="152" width="14" height="42" rx="7" fill="url(#wiicoSkin)" />
                    <circle cx="65" cy="196" r="8" fill="url(#wiicoSkin)" />
                    <rect x="55" y="146" width="20" height="20" rx="9" fill="url(#wiicoShirt)" stroke="#cdd5e8" strokeWidth="1" />

                    {/* ── Torse (chemise Wii-Co) ── */}
                    <rect x="72" y="138" width="76" height="64" rx="16" fill="url(#wiicoShirt)" stroke="#cdd5e8" strokeWidth="1.2" />
                    {/* Boutons */}
                    <circle cx="110" cy="158" r="1.8" fill="#94a3b8" />
                    <circle cx="110" cy="172" r="1.8" fill="#94a3b8" />
                    <circle cx="110" cy="186" r="1.8" fill="#94a3b8" />
                    {/* Col */}
                    <path d="M99 138 L110 150 L121 138 L114 134 L106 134 Z" fill="#ffffff" stroke="#cdd5e8" strokeWidth="1" />
                    {/* Badge Wii-Co */}
                    <rect x="79" y="150" width="27" height="11" rx="4" fill="#4f46e5" />
                    <text x="92.5" y="158.2" textAnchor="middle" fontSize="7" fontWeight="800" fill="#ffffff" fontFamily="'Lexend', sans-serif">Wii-Co</text>
                    {/* Ceinture */}
                    <rect x="82" y="196" width="56" height="7" rx="3.5" fill="#1e1b4b" />
                    <rect x="105" y="197" width="10" height="5" rx="1.5" fill="#f59e0b" />

                    {/* ── Bras droit (se lève pour parler) ── */}
                    <g className="wiico-arm-r">
                        <rect x="148" y="152" width="14" height="42" rx="7" fill="url(#wiicoSkin)" />
                        {/* Main ouverte (paume + pouce) */}
                        <circle cx="155" cy="196" r="8.5" fill="url(#wiicoSkin)" />
                        <ellipse cx="162" cy="191" rx="3.4" ry="5" fill="url(#wiicoSkin)" transform="rotate(35 162 191)" />
                        <rect x="145" y="146" width="20" height="20" rx="9" fill="url(#wiicoShirt)" stroke="#cdd5e8" strokeWidth="1" />
                    </g>

                    {/* ── Tête ── */}
                    <rect x="101" y="124" width="18" height="18" rx="7" fill="#eeb87f" />
                    <circle cx="110" cy="84" r="55" fill="url(#wiicoSkin)" />
                    {/* Oreilles */}
                    <circle cx="55" cy="90" r="9" fill="url(#wiicoSkin)" />
                    <circle cx="165" cy="90" r="9" fill="url(#wiicoSkin)" />

                    {/* Cheveux */}
                    <path d="M55 86
                             Q52 30 110 26
                             Q168 30 165 86
                             Q160 66 149 59
                             Q152 70 140 61
                             Q137 71 125 58
                             Q119 69 109 58
                             Q101 69 92 58
                             Q87 71 78 62
                             Q72 73 66 63
                             Q59 70 55 86 Z"
                        fill="url(#wiicoHair)" />
                    {/* Mèches latérales */}
                    <path d="M55 84 Q53 100 60 106 Q63 92 63 84 Z" fill="url(#wiicoHair)" />
                    <path d="M165 84 Q167 100 160 106 Q157 92 157 84 Z" fill="url(#wiicoHair)" />
                    {/* Reflet cheveux (relief) */}
                    <path d="M78 38 Q95 28 118 32 Q100 34 86 44 Z" fill="rgba(255,255,255,0.28)" />

                    {/* Sourcils */}
                    <path d="M80 72 Q89 66 99 71" stroke="#5b3a1e" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                    <path d="M121 71 Q131 66 140 72" stroke="#5b3a1e" strokeWidth="3.4" strokeLinecap="round" fill="none" />

                    {/* Yeux (clignent) */}
                    <g className="wiico-eye">
                        <ellipse cx="90" cy="90" rx="10.5" ry="13.5" fill="#38220f" />
                        <circle cx="93.5" cy="84.5" r="4.2" fill="#ffffff" />
                        <circle cx="86.5" cy="94" r="2" fill="#ffffff" opacity="0.85" />
                    </g>
                    <g className="wiico-eye">
                        <ellipse cx="130" cy="90" rx="10.5" ry="13.5" fill="#38220f" />
                        <circle cx="133.5" cy="84.5" r="4.2" fill="#ffffff" />
                        <circle cx="126.5" cy="94" r="2" fill="#ffffff" opacity="0.85" />
                    </g>

                    {/* Joues */}
                    <ellipse cx="74" cy="105" rx="7.5" ry="4.5" fill="#fda4af" opacity="0.55" />
                    <ellipse cx="146" cy="105" rx="7.5" ry="4.5" fill="#fda4af" opacity="0.55" />

                    {/* Nez */}
                    <path d="M107 100 Q110 104 113 100" stroke="#d99a62" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                    {/* Bouche (s'ouvre quand elle parle) */}
                    <g className="wiico-mouth">
                        <path d="M97 111 A 13.5 11 0 0 0 123 111 Z" fill="#7c2d3a" />
                        <ellipse cx="110" cy="117" rx="6.5" ry="3.4" fill="#f87171" />
                        <rect x="100" y="111" width="20" height="2.6" rx="1.3" fill="#ffffff" />
                    </g>
                </g>
            </svg>
        </div>
    );
}

export default Mascot;
