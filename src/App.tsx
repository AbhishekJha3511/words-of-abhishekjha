import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, Heart, Menu, Search, Share2, X } from 'lucide-react';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqo8jMd-cCTPtOtBgR5APClmG36rz1hN9xA9iIO375R6OZLRe3t5Q_Y1OOwkFFUx0N4kd8rMUxEXdX/pub?gid=0&single=true&output=csv';
type Piece = { id: string; title: string; category: string; language: string; excerpt: string; body: string; date: string; tags: string };

// CSV parser supports quoted commas, escaped quotes and line breaks inside cells.
function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function getField(row: string[], indexes: Record<string, number>, ...names: string[]) {
  for (const name of names) { const index = indexes[name.toLowerCase()]; if (index !== undefined) return (row[index] || '').trim(); }
  return '';
}

function mapSheetRows(csv: string): Piece[] {
  const rows = parseCSV(csv);
  if (rows.length < 2) return [];
  const headers = rows[0].map(value => value.trim().toLowerCase());
  const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
  return rows.slice(1).filter(row => getField(row, indexes, 'status', 'visibility').toLowerCase() === 'published').map((row, index) => {
    const body = getField(row, indexes, 'body', 'content', 'poem');
    const title = getField(row, indexes, 'title', 'name');
    const status = getField(row, indexes, 'status', 'visibility');
    return {
      id: getField(row, indexes, 'id', 'slug') || `writing-${index + 1}`,
      title,
      category: getField(row, indexes, 'category', 'type') || 'Poetry',
      language: getField(row, indexes, 'language') || 'English',
      excerpt: getField(row, indexes, 'excerpt', 'preview') || body.replace(/\s+/g, ' ').slice(0, 145) + (body.length > 145 ? '…' : ''),
      body,
      date: getField(row, indexes, 'publishedAt', 'date'),
      tags: getField(row, indexes, 'tags'),
    };
  }).filter(piece => piece.title && piece.body);
}

export default function App() {
  const [items, setItems] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [active, setActive] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Piece | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    fetch(SHEET_CSV_URL)
      .then(response => { if (!response.ok) throw new Error('Google Sheet could not be reached.'); return response.text(); })
      .then(csv => {
        const published = mapSheetRows(csv);
        setItems(published);
        if (!published.length) setFeedError('No published writing was found. Check your sheet headers and make sure at least one row has status Published.');
      })
      .catch(() => setFeedError('The Google Sheet could not be loaded. Check that the Poetry tab is published as CSV.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(item => item.category)))], [items]);
  const visible = useMemo(() => items.filter(piece => (active === 'All' || piece.category === active) && `${piece.title} ${piece.excerpt} ${piece.language} ${piece.tags}`.toLowerCase().includes(query.toLowerCase())), [items, active, query]);
  const share = async (piece: Piece) => {
    const url = `${location.origin}/#${encodeURIComponent(piece.id)}`;
    if (navigator.share) await navigator.share({ title: piece.title, text: piece.excerpt, url });
    else { await navigator.clipboard.writeText(url); alert('Writing link copied.'); }
  };

  return <div className="site">
    <header className="topbar"><a className="brand" href="#"><span>ABHISHEK JHA</span><small>A PERSONAL COLLECTION OF WORDS</small></a><button className="menu" onClick={() => setMobile(!mobile)} aria-label="Toggle navigation">{mobile ? <X /> : <Menu />}</button><nav className={mobile ? 'nav open' : 'nav'}>{['Myself', 'Poetry', 'Sayings', 'Thoughts'].map(label => <a key={label} href={label === 'Myself' ? '#myself' : `#${label.toLowerCase()}`} onClick={() => { setActive(label === 'Myself' ? 'All' : label); setMobile(false); }}>{label}</a>)}<a className="follow" href="https://www.instagram.com/its_abhishekjha/" target="_blank" rel="noreferrer">Follow Me <ArrowUpRight size={14} /></a></nav></header>
    <main><section className="hero"><div className="hero-copy"><p className="eyebrow">POETRY · SAYINGS · THOUGHTS</p><h1>Words that<br /><em>remain.</em></h1><p className="intro">A quiet place for the things I feel, the thoughts I keep, and the words I choose to share.</p><a className="text-link" href="#poetry">EXPLORE THE COLLECTION <ArrowUpRight size={15} /></a></div><div className="hero-note"><span className="ornament">✳</span><p>“Every page holds<br />a piece of a feeling.”</p><small>— A NOTE TO THE READER</small></div><div className="hero-foot"><span>EST. 2026</span><span>SCROLL TO DISCOVER ↓</span><span>ABHISHEK JHA</span></div></section>
      <section className="about" id="myself"><p className="eyebrow">A NOTE ABOUT THIS SPACE</p><h2>Some things are easier<br />to <em>write</em> than to say.</h2><p>This is my personal collection of poetry, sayings and thoughts — written across languages, moods and moments. Welcome to my little corner of the world.</p></section>
      <section className="collection" id="poetry"><div className="section-head"><div><p className="eyebrow">THE COLLECTION</p><h2>Words & <em>fragments</em></h2></div><div className="search"><Search size={16} /><input placeholder="Search writing…" value={query} onChange={event => setQuery(event.target.value)} /></div></div><div className="filters">{categories.map(category => <button key={category} className={active === category ? 'active' : ''} onClick={() => setActive(category)}>{category}</button>)}</div>
        {loading && <p className="feed-message">Opening the collection…</p>}{!loading && feedError && <p className="feed-message">{feedError}</p>}
        <div className="cards">{visible.map(piece => <article className="piece" key={piece.id}><div className="piece-topline"><span>{piece.category}</span><span>{piece.language}</span></div><div className="piece-content"><div className="meta">{piece.date || 'ABHISHEK JHA'}</div><h3>{piece.title}</h3><p>{piece.excerpt}</p><div className="piece-actions"><button onClick={() => setSelected(piece)}>READ MORE <ArrowUpRight size={14} /></button><div><button aria-label="Like" className={liked.includes(piece.id) ? 'liked' : ''} onClick={() => setLiked(old => old.includes(piece.id) ? old.filter(id => id !== piece.id) : [...old, piece.id])}><Heart size={17} fill={liked.includes(piece.id) ? 'currentColor' : 'none'} /></button><button aria-label="Share" onClick={() => share(piece)}><Share2 size={17} /></button></div></div></div></article>)}</div>
        {!loading && !feedError && visible.length === 0 && <p className="empty">No writing found. Try another search.</p>}
      </section>
      <section className="quote"><BookOpen /><p>“The page remembers<br />what the world may never hear.”</p><small>— ABHISHEK JHA</small></section>
      <footer><div className="footer-brand">ABHISHEK JHA<small>WORDS THAT REMAIN</small></div><a href="https://www.instagram.com/its_abhishekjha/" target="_blank" rel="noreferrer">
  <span style={{ fontWeight: 'bold', fontSize: '17px' }}>◎</span> Instagram
</a><span>© 2026 Abhishek Jha</span></footer>
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><article className="reader" onClick={event => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)} aria-label="Close"><X /></button><p className="eyebrow">{selected.category} · {selected.language}</p><h2>{selected.title}</h2><div className="poem">{selected.body}</div><div className="signature">Abhishek Jha</div><button className="share-reader" onClick={() => share(selected)}>SHARE THIS WRITING <Share2 size={15} /></button></article></div>}
  </div>;
}
