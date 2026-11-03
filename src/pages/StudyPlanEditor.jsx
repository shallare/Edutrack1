import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { MessageBox } from '../components/Common';
import DrawingCanvas from '../components/DrawingCanvas';
import { mesCours, uploadImage } from '../services/api';

// TipTap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';

import './StudyPlanEditor.css';

// Clé du plan d'étude global (mode sans cours ciblé)
const GLOBAL_PLAN_KEY = 'wiico_plan_etude_global';

const DEFAULT_CONTENT = '<p>Commencez à rédiger vos notes ici…</p>';

const COULEURS = [
    '#ffffff', '#f3e8ff', '#dcfce7', '#dbeafe',
    '#fef3c7', '#fce7f3', '#ffedd5', '#e0f2fe',
];

const STATUTS = {
    a_venir:  { label: 'À venir',  color: '#64748b', bg: 'transparent' },
    en_cours: { label: 'En cours', color: '#1d4ed8', bg: '#dbeafe' },
    termine:  { label: 'Terminé',  color: '#166534', bg: '#dcfce7' },
};

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    // TipTap v3 : editor.can() lève une exception tant que la vue n'est pas
    // montée (premier rendu). On protège pour ne jamais faire planter la page.
    const can = (check) => { try { return check(); } catch { return false; } };

    return (
        <div className="editor-menu-bar">
            {/* Headers */}
            <div className="editor-group">
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>H1</button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}>H4</button>
            </div>

            {/* Text Formatting */}
            <div className="editor-group">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}><Icon name="bold" size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}><Icon name="italic" size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}><Icon name="underline" size={16} /></button>
            </div>

            {/* Colors */}
            <div className="editor-group">
                <input
                    type="color"
                    onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                    value={editor.getAttributes('textStyle').color || '#1e1b4b'}
                    title="Couleur du texte"
                    className="color-picker"
                />
                <button onClick={() => editor.chain().focus().unsetColor().run()} title="Réinitialiser la couleur">
                    <Icon name="droplet" size={16} />
                </button>
            </div>

            {/* Lists */}
            <div className="editor-group">
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}><Icon name="list" size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}><Icon name="list-ordered" size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}><Icon name="message-square" size={16} /></button>
            </div>

            {/* Tables */}
            <div className="editor-group">
                <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insérer un tableau">
                    <Icon name="grid" size={16} />
                </button>
                <button onClick={() => editor.chain().focus().deleteTable().run()} disabled={!can(() => editor.can().deleteTable())} title="Supprimer le tableau">
                    <Icon name="trash" size={16} />
                </button>
                <button onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!can(() => editor.can().addColumnAfter())} title="Ajouter une colonne">
                    + Col
                </button>
                <button onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!can(() => editor.can().addRowAfter())} title="Ajouter une ligne">
                    + Ligne
                </button>
            </div>
        </div>
    );
};

function StudyPlanEditor() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const isReadOnly = searchParams.get('read') === '1';
    const courseId   = searchParams.get('id');

    const [activeTab, setActiveTab] = useState('texte'); // 'texte' | 'dessin'
    const [course, setCourse]       = useState(null);
    const [meta, setMeta]           = useState({ titre: '', description: '', statut: 'a_venir', couleur: '#ffffff' });
    const [saveState, setSaveState] = useState('');      // '' | 'saving' | 'saved'
    const [message, setMessage]     = useState({ text: '', type: '' });
    const [wordCount, setWordCount] = useState(0);

    const timerRef  = useRef(null);
    const courseRef = useRef(null);
    const metaRef   = useRef(meta);
    metaRef.current = meta;

    // ── Sauvegarde (débouncée = autosave, immédiate = bouton) ──
    const doSave = useCallback(async (html) => {
        setSaveState('saving');
        try {
            if (courseRef.current) {
                await mesCours.modifier(courseRef.current.id, {
                    contenu: html,
                    titre: metaRef.current.titre || courseRef.current.titre,
                    description: metaRef.current.description,
                    statut: metaRef.current.statut,
                    couleur: metaRef.current.couleur,
                });
            } else {
                localStorage.setItem(GLOBAL_PLAN_KEY, html);
            }
            setSaveState('saved');
            setTimeout(() => setSaveState(s => (s === 'saved' ? '' : s)), 2500);
        } catch {
            setSaveState('');
            setMessage({ text: 'Erreur lors de la sauvegarde.', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Image.configure({ allowBase64: true, inline: false }),
        ],
        content: DEFAULT_CONTENT,
        editable: !isReadOnly,
        editorProps: {
            // Coller une image (Ctrl+V) : upload serveur, repli base64 si hors-ligne
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items || [];
                for (const item of items) {
                    if (item.type && item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (!file) continue;
                        const insertSrc = (src) => {
                            const { schema } = view.state;
                            const node = schema.nodes.image?.create({ src });
                            if (node) view.dispatch(view.state.tr.replaceSelectionWith(node));
                        };
                        uploadImage(file)
                            .then(insertSrc)
                            .catch(() => {
                                const reader = new FileReader();
                                reader.onload = () => insertSrc(reader.result);
                                reader.readAsDataURL(file);
                            });
                        event.preventDefault();
                        return true;
                    }
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            setWordCount(editor.getText().split(/\s+/).filter(Boolean).length);
            if (isReadOnly) return;
            // Autosave : 1,2 s après la dernière frappe
            if (timerRef.current) clearTimeout(timerRef.current);
            setSaveState('saving');
            timerRef.current = setTimeout(() => doSave(editor.getHTML()), 1200);
        },
    });

    // Insérer un schéma dessiné : upload serveur (URL légère), repli base64 si échec
    const insertDrawing = async (dataURL) => {
        if (!editor || isReadOnly) return;
        let src = dataURL;
        try {
            const blob = await (await fetch(dataURL)).blob();
            src = await uploadImage(blob);
        } catch { /* repli : base64 directement dans le contenu */ }
        editor.chain().focus('end').setImage({ src, alt: 'Schéma' }).run();
        setActiveTab('texte');
        setMessage({ text: 'Schéma inséré dans le texte du cours.', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 2500);
    };

    // Autosave aussi quand les métadonnées changent (titre, statut, couleur…)
    const scheduleMetaSave = (patch) => {
        setMeta(m => ({ ...m, ...patch }));
        if (isReadOnly || !editor) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        setSaveState('saving');
        timerRef.current = setTimeout(() => doSave(editor.getHTML()), 900);
    };

    // ── Chargement du contenu ──
    useEffect(() => {
        if (!editor) return;
        (async () => {
            if (courseId) {
                try {
                    const res = await mesCours.lister();
                    const found = res.data.find(c => String(c.id) === String(courseId));
                    if (found) {
                        setCourse(found);
                        courseRef.current = found;
                        setMeta({
                            titre: found.titre || '',
                            description: found.description || '',
                            statut: found.statut || 'a_venir',
                            couleur: found.couleur || '#ffffff',
                        });
                        editor.commands.setContent(found.contenu || DEFAULT_CONTENT);
                        setWordCount(editor.getText().split(/\s+/).filter(Boolean).length);
                    } else {
                        setMessage({ text: 'Cours introuvable — vous éditez le plan global.', type: 'error' });
                    }
                } catch {
                    setMessage({ text: 'Impossible de charger le cours (serveur injoignable ?).', type: 'error' });
                }
            } else {
                const saved = localStorage.getItem(GLOBAL_PLAN_KEY);
                if (saved) {
                    editor.commands.setContent(saved);
                    setWordCount(editor.getText().split(/\s+/).filter(Boolean).length);
                }
            }
        })();
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, courseId]);

    const saveNow = () => {
        if (!editor) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        doSave(editor.getHTML());
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>

            <MessageBox message={message} />

            {/* ── Toolbar supérieure ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/etudiant/cours')} className="btn btn-ghost" style={{ padding: '8px 16px' }}>
                    <Icon name="arrow-left" size={16} style={{ marginRight: 8 }} />
                    Mes cours
                </button>

                <div style={{ display: 'flex', background: 'var(--glass-bg)', padding: 4, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={() => setActiveTab('texte')}
                        className={`btn ${activeTab === 'texte' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13 }}
                    >
                        <Icon name="file-text" size={14} /> Texte Enrichi
                    </button>
                    <button
                        onClick={() => setActiveTab('dessin')}
                        className={`btn ${activeTab === 'dessin' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13 }}
                    >
                        <Icon name="pen-tool" size={14} /> Schémas & Dessin
                    </button>
                </div>

                {!isReadOnly ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {saveState === 'saving' && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Enregistrement…</span>
                        )}
                        {saveState === 'saved' && (
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Icon name="check-circle" size={14} /> Enregistré
                            </span>
                        )}
                        <button onClick={saveNow} disabled={saveState === 'saving'} className="btn btn-success" style={{ padding: '8px 20px' }}>
                            <Icon name="save" size={16} />
                            Enregistrer
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate(`/etudiant/cours/editeur${courseId ? `?id=${courseId}` : ''}`)}
                        className="btn btn-secondary" style={{ padding: '8px 20px' }}
                    >
                        <Icon name="edit-2" size={15} />
                        Passer en édition
                    </button>
                )}
            </div>

            {/* ── Cahier ── */}
            <div className="glass-card notebook-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', overflow: 'hidden', minHeight: 560 }}>

                {activeTab === 'texte' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {!isReadOnly && <MenuBar editor={editor} />}

                        {/* Barre méta : statut + couleur (comme l'ancien plan d'étude) */}
                        {course && (
                            <div className="notebook-metabar">
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {Object.entries(STATUTS).map(([k, s]) => (
                                        <button key={k}
                                            onClick={() => !isReadOnly && scheduleMetaSave({ statut: k })}
                                            disabled={isReadOnly}
                                            style={{
                                                padding: '4px 12px', borderRadius: 999,
                                                border: meta.statut === k ? `1.5px solid ${s.color}` : '1px solid #d6c4a0',
                                                background: meta.statut === k ? s.bg : 'transparent',
                                                color: meta.statut === k ? s.color : '#92400e',
                                                fontSize: 11, fontWeight: 600,
                                                cursor: isReadOnly ? 'default' : 'pointer',
                                            }}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                                {!isReadOnly && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {COULEURS.map(h => (
                                            <button key={h} onClick={() => scheduleMetaSave({ couleur: h })}
                                                title="Couleur de la carte"
                                                style={{ width: 18, height: 18, borderRadius: 6, background: h, border: meta.couleur === h ? '2px solid #6d28d9' : '1px solid #d6c4a0', cursor: 'pointer' }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Page lignée */}
                        <div className="notebook-paper editor-content-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
                            {course && (
                                <>
                                    <input
                                        type="text"
                                        className="notebook-title"
                                        value={meta.titre}
                                        readOnly={isReadOnly}
                                        onChange={e => scheduleMetaSave({ titre: e.target.value })}
                                        placeholder="Titre du cours…"
                                    />
                                    <input
                                        type="text"
                                        className="notebook-subtitle"
                                        value={meta.description}
                                        readOnly={isReadOnly}
                                        onChange={e => scheduleMetaSave({ description: e.target.value })}
                                        placeholder="Sous-titre ou description courte…"
                                    />
                                    <div className="notebook-rule" />
                                </>
                            )}
                            <EditorContent editor={editor} />
                        </div>

                        {/* Pied de page */}
                        <div className="notebook-footer">
                            <span>
                                {course
                                    ? (course.updated_at ? `Modifié le ${new Date(course.updated_at).toLocaleString('fr-FR')}` : 'Nouveau')
                                    : 'Plan d\'étude global (enregistré sur cet appareil)'}
                            </span>
                            <span>{wordCount} mot{wordCount > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                )}

                {activeTab === 'dessin' && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        {isReadOnly && (
                            <div className="message-box info" style={{ margin: 16 }}>
                                Vous êtes en mode lecture : le dessin ne sera pas inséré dans le texte.
                            </div>
                        )}
                        <DrawingCanvas onInsertToText={!isReadOnly ? insertDrawing : undefined} />
                    </div>
                )}

            </div>
        </div>
    );
}

export default StudyPlanEditor;
