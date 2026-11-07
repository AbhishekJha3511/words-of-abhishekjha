
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Heart,
  Menu,
  Search,
  Share2,
  X,
  Download,
  Palette,
} from 'lucide-react';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqo8jMd-cCTPtOtBgR5APClmG36rz1hN9xA9iIO375R6OZLRe3t5Q_Y1OOwkFFUx0N4kd8rMUxEXdX/pub?gid=0&single=true&output=csv';

type Piece = {
  id: string;
  title: string;
  category: string;
  language: string;
  excerpt: string;
  body: string;
  date: string;
  tags: string;
};

// CSV parser supports quoted commas, escaped quotes and multiline cells.
function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i++;

      row.push(cell);
      cell = '';

      if (row.some(value => value.trim())) {
        rows.push(row);
      }

      row = [];
    } else {
      cell += char;
    }
  }

  row.push(cell);

  if (row.some(value => value.trim())) {
    rows.push(row);
  }

  return rows;
}

function getField(
  row: string[],
  indexes: Record<string, number>,
  ...names: string[]
) {
  for (const name of names) {
    const index = indexes[name.toLowerCase()];

    if (index !== undefined) {
      return (row[index] || '').trim();
    }
  }

  return '';
}

function mapSheetRows(csv: string): Piece[] {
  const rows = parseCSV(csv);

  if (rows.length < 2) return [];

  const headers = rows[0].map(value => value.trim().toLowerCase());

  const indexes = Object.fromEntries(
    headers.map((header, index) => [header, index])
  );

  return rows
    .slice(1)
    .filter(
      row =>
        getField(row, indexes, 'status', 'visibility').toLowerCase() ===
        'published'
    )
    .map((row, index) => {
      const body = getField(row, indexes, 'body', 'content', 'poem');
      const title = getField(row, indexes, 'title', 'name');

      return {
        id:
          getField(row, indexes, 'id', 'slug') ||
          `writing-${index + 1}`,
        title,
        category:
          getField(row, indexes, 'category', 'type') || 'Poetry',
        language: getField(row, indexes, 'language') || 'English',
        excerpt:
          getField(row, indexes, 'excerpt', 'preview') ||
          body.replace(/\s+/g, ' ').slice(0, 145) +
            (body.length > 145 ? '…' : ''),
        body,
        date: getField(row, indexes, 'publishedAt', 'date'),
        tags: getField(row, indexes, 'tags'),
      };
    })
    .filter(piece => piece.title && piece.body);
}

// Draw a complete poetry artwork onto a 1080 x 1350 canvas.
function drawPoetryArtwork(
  canvas: HTMLCanvasElement,
  piece: Piece
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  const width = 1080;
  const height = 1350;

  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = '#f4eee3';
  ctx.fillRect(0, 0, width, height);

  // Decorative border
  ctx.strokeStyle = '#cbb99d';
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, width - 110, height - 110);

  ctx.strokeStyle = '#dfd2bd';
  ctx.lineWidth = 1;
  ctx.strokeRect(70, 70, width - 140, height - 140);

  // Top ornament
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#a88965';
  ctx.font = '48px Georgia';
  ctx.fillText('✳', width / 2, 145);

  // Brand
  ctx.fillStyle = '#9b7958';
  ctx.font = '600 19px Arial';
  ctx.fillText('ABHISHEK JHA', width / 2, 205);

  ctx.font = '13px Arial';
  ctx.fillStyle = '#9a8c79';
  ctx.fillText(
    `${piece.category.toUpperCase()}  ·  ${piece.language.toUpperCase()}`,
    width / 2,
    245
  );

  // Title with automatic wrapping
  ctx.fillStyle = '#40382d';
  ctx.font = '52px Georgia';

  const titleWords = piece.title.split(/\s+/);
  const titleLines: string[] = [];
  let titleLine = '';

  titleWords.forEach(word => {
    const test = titleLine ? `${titleLine} ${word}` : word;

    if (ctx.measureText(test).width > 850 && titleLine) {
      titleLines.push(titleLine);
      titleLine = word;
    } else {
      titleLine = test;
    }
  });

  if (titleLine) titleLines.push(titleLine);

  let titleY = 335;

  titleLines.forEach(line => {
    ctx.fillText(line, width / 2, titleY);
    titleY += 65;
  });

  // Divider
  const dividerY = Math.max(420, titleY + 20);

  ctx.strokeStyle = '#cbb99d';
  ctx.beginPath();
  ctx.moveTo(390, dividerY);
  ctx.lineTo(690, dividerY);
  ctx.stroke();

  // Poetry text
  const poemTop = dividerY + 65;
  const signatureTop = 1170;
  const maxWidth = 820;
  const availableHeight = signatureTop - poemTop - 100;

  let fontSize = 34;
  let lineHeight = fontSize * 1.55;

  let lines: string[] = [];

  // Wrap text and reduce font size if necessary.
  const makeLines = (size: number) => {
    ctx.font = `${size}px Georgia`;

    const output: string[] = [];

    piece.body.split('\n').forEach(paragraph => {
      if (!paragraph.trim()) {
        output.push('');
        return;
      }

      let line = '';

      paragraph.split(/\s+/).forEach(word => {
        const test = line ? `${line} ${word}` : word;

        if (ctx.measureText(test).width > maxWidth && line) {
          output.push(line);
          line = word;
        } else {
          line = test;
        }
      });

      if (line) output.push(line);
    });

    return output;
  };

  for (fontSize = 34; fontSize >= 19; fontSize -= 1) {
    lineHeight = fontSize * 1.55;
    lines = makeLines(fontSize);

    if (lines.length * lineHeight <= availableHeight) {
      break;
    }
  }

  ctx.font = `${fontSize}px Georgia`;
  ctx.fillStyle = '#655746';
  ctx.textAlign = 'center';

  let poemY = poemTop;

  const maxLines = Math.max(
    1,
    Math.floor(availableHeight / lineHeight)
  );

  const displayedLines = lines.slice(0, maxLines);

  displayedLines.forEach(line => {
    if (line) {
      ctx.fillText(line, width / 2, poemY, maxWidth);
    }

    poemY += lineHeight;
  });

  if (lines.length > maxLines) {
    ctx.font = '24px Arial';
    ctx.fillText('…', width / 2, poemY + 5);
  }

  // Signature
  ctx.fillStyle = '#72583f';
  ctx.font = 'italic 48px cursive';
  ctx.fillText('Abhishek Jha', width / 2, signatureTop);

  // Footer
  ctx.fillStyle = '#9a8c79';
  ctx.font = '13px Arial';
  ctx.fillText('WORDS THAT REMAIN', width / 2, 1220);
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

  // Artwork states
  const [artworkPiece, setArtworkPiece] = useState<Piece | null>(null);
  const [artworkReady, setArtworkReady] = useState(false);

  const artworkCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load published poetry from Google Sheets.
  useEffect(() => {
    let cancelled = false;

    fetch(SHEET_CSV_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error('Google Sheet could not be reached.');
        }

        return response.text();
      })
      .then(csv => {
        if (cancelled) return;

        const published = mapSheetRows(csv);

        setItems(published);

        if (!published.length) {
          setFeedError(
            'No published writing was found. Check your sheet headers and make sure at least one row has status Published.'
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeedError(
            'The Google Sheet could not be loaded. Check that the Poetry tab is published as CSV.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Categories
  const categories = useMemo(
    () => [
      'All',
      ...Array.from(new Set(items.map(item => item.category))),
    ],
    [items]
  );

  // Search and filter
  const visible = useMemo(
    () =>
      items.filter(
        piece =>
          (active === 'All' || piece.category === active) &&
          `${piece.title} ${piece.excerpt} ${piece.language} ${piece.tags}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [items, active, query]
  );

  // Share a normal writing link.
  const share = async (piece: Piece) => {
    const url = `${location.origin}/#${encodeURIComponent(piece.id)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: piece.title,
          text: piece.excerpt,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Writing link copied.');
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.name !== 'AbortError'
      ) {
        try {
          await navigator.clipboard.writeText(url);
          alert('Writing link copied.');
        } catch {
          alert('Could not share this writing.');
        }
      }
    }
  };

  // Open artwork preview and generate canvas.
  const openArtwork = (piece: Piece) => {
    setArtworkReady(false);
    setArtworkPiece(piece);
  };

  useEffect(() => {
    if (!artworkPiece || !artworkCanvasRef.current) return;

    let cancelled = false;

    const generate = async () => {
      try {
        await document.fonts.ready;
      } catch {
        // Continue with available system fonts.
      }

      if (cancelled || !artworkCanvasRef.current) return;

      drawPoetryArtwork(artworkCanvasRef.current, artworkPiece);
      setArtworkReady(true);
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [artworkPiece]);

  // Download artwork as PNG.
  const downloadArtwork = () => {
    const canvas = artworkCanvasRef.current;

    if (!canvas || !artworkPiece || !artworkReady) {
      alert('Please wait for the artwork to finish loading.');
      return;
    }

    const link = document.createElement('a');

    link.download = `${artworkPiece.title
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()}-abhishek-jha.png`;

    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Share actual PNG image through supported apps.
  const shareArtwork = async () => {
    const canvas = artworkCanvasRef.current;

    if (!canvas || !artworkPiece || !artworkReady) {
      alert('Please wait for the artwork to finish loading.');
      return;
    }

    canvas.toBlob(async blob => {
      if (!blob) {
        alert('Could not create the artwork. Please try downloading it.');
        return;
      }

      const safeName = artworkPiece.title
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();

      const file = new File(
        [blob],
        `${safeName || 'poetry'}-abhishek-jha.png`,
        { type: 'image/png' }
      );

      try {
        if (
          navigator.share &&
          navigator.canShare?.({ files: [file] })
        ) {
          await navigator.share({
            title: artworkPiece.title,
            text: 'A piece of writing by Abhishek Jha',
            files: [file],
          });
        } else {
          downloadArtwork();

          alert(
            'Artwork downloaded. You can now upload it to Instagram or WhatsApp.'
          );
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.name !== 'AbortError'
        ) {
          alert(
            'Sharing is not available here. Please download the artwork.'
          );
        }
      }
    }, 'image/png');
  };

  return (
    <div className="site">
      {/* Header */}
      <header className="topbar">
        <a className="brand" href="#">
          <span>ABHISHEK JHA</span>
          <small>A PERSONAL COLLECTION OF WORDS</small>
        </a>

        <button
          className="menu"
          onClick={() => setMobile(!mobile)}
          aria-label="Toggle navigation"
        >
          {mobile ? <X /> : <Menu />}
        </button>

        <nav className={mobile ? 'nav open' : 'nav'}>
          {['Myself', 'Poetry', 'Sayings', 'Thoughts'].map(label => (
            <a
              key={label}
              href={
                label === 'Myself'
                  ? '#myself'
                  : `#${label.toLowerCase()}`
              }
              onClick={() => {
                setActive(label === 'Myself' ? 'All' : label);
                setMobile(false);
              }}
            >
              {label}
            </a>
          ))}

          <a
            className="follow"
            href="https://www.instagram.com/its_abhishekjha/"
            target="_blank"
            rel="noreferrer"
          >
            Follow Me <ArrowUpRight size={14} />
          </a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              POETRY · SAYINGS · THOUGHTS
            </p>

            <h1>
              Words that
              <br />
              <em>remain.</em>
            </h1>

            <p className="intro">
              A quiet place for the things I feel, the thoughts I
              keep, and the words I choose to share.
            </p>

            <a className="text-link" href="#poetry">
              EXPLORE THE COLLECTION <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="hero-note">
            <span className="ornament">✳</span>

            <p>
              “Every page holds
              <br />
              a piece of a feeling.”
            </p>

            <small>— A NOTE TO THE READER</small>
          </div>

          <div className="hero-foot">
            <span>EST. 2026</span>
            <span>SCROLL TO DISCOVER ↓</span>
            <span>ABHISHEK JHA</span>
          </div>
        </section>

        {/* About */}
        <section className="about" id="myself">
          <p className="eyebrow">A NOTE ABOUT THIS SPACE</p>

          <h2>
            Some things are easier
            <br />
            to <em>write</em> than to say.
          </h2>

          <p>
            This is my personal collection of poetry, sayings and
            thoughts — written across languages, moods and moments.
            Welcome to my little corner of the world.
          </p>
        </section>

        {/* Collection */}
        <section className="collection" id="poetry">
          <div className="section-head">
            <div>
              <p className="eyebrow">THE COLLECTION</p>

              <h2>
                Words & <em>fragments</em>
              </h2>
            </div>

            <div className="search">
              <Search size={16} />

              <input
                placeholder="Search writing…"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="filters">
            {categories.map(category => (
              <button
                key={category}
                className={active === category ? 'active' : ''}
                onClick={() => setActive(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading && (
            <p className="feed-message">
              Opening the collection…
            </p>
          )}

          {!loading && feedError && (
            <p className="feed-message">{feedError}</p>
          )}

          <div className="cards">
            {visible.map(piece => (
              <article className="piece" key={piece.id}>
                <div className="piece-topline">
                  <span>{piece.category}</span>
                  <span>{piece.language}</span>
                </div>

                <div className="piece-content">
                  <div className="meta">
                    {piece.date || 'ABHISHEK JHA'}
                  </div>

                  <h3>{piece.title}</h3>

                  <p>{piece.excerpt}</p>

                  <div className="piece-actions">
                    <button onClick={() => setSelected(piece)}>
                      READ MORE <ArrowUpRight size={14} />
                    </button>

                    <div>
                      <button
                        className="artwork-action"
                        aria-label="Create poetry artwork"
                        title="Create shareable artwork"
                        onClick={() => openArtwork(piece)}
                      >
                        <Palette size={16} />
                        <span>ARTWORK</span>
                      </button>

                      <button
                        aria-label="Like"
                        className={
                          liked.includes(piece.id) ? 'liked' : ''
                        }
                        onClick={() =>
                          setLiked(old =>
                            old.includes(piece.id)
                              ? old.filter(id => id !== piece.id)
                              : [...old, piece.id]
                          )
                        }
                      >
                        <Heart
                          size={17}
                          fill={
                            liked.includes(piece.id)
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>

                      <button
                        aria-label="Share writing link"
                        onClick={() => share(piece)}
                      >
                        <Share2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!loading && !feedError && visible.length === 0 && (
            <p className="empty">
              No writing found. Try another search.
            </p>
          )}
        </section>

        {/* Quote */}
        <section className="quote">
          <BookOpen />

          <p>
            “The page remembers
            <br />
            what the world may never hear.”
          </p>

          <small>— ABHISHEK JHA</small>
        </section>

        {/* Footer */}
        <footer>
          <div className="footer-brand">
            ABHISHEK JHA
            <small>WORDS THAT REMAIN</small>
          </div>

          <a
            href="https://www.instagram.com/its_abhishekjha/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="instagram-symbol">◎</span>
            Instagram
          </a>

          <span>© 2026 Abhishek Jha</span>
        </footer>
      </main>

      {/* Read poetry modal */}
      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <article
            className="reader"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <X />
            </button>

            <p className="eyebrow">
              {selected.category} · {selected.language}
            </p>

            <h2>{selected.title}</h2>

            <div className="poem">{selected.body}</div>

            <div className="signature">Abhishek Jha</div>

            <div className="reader-actions">
              <button
                className="share-reader"
                onClick={() => share(selected)}
              >
                SHARE THIS WRITING <Share2 size={15} />
              </button>

              <button
                className="share-reader artwork-reader-button"
                onClick={() => {
                  const piece = selected;
                  setSelected(null);
                  openArtwork(piece);
                }}
              >
                CREATE ARTWORK <Palette size={15} />
              </button>
            </div>
          </article>
        </div>
      )}

      {/* Poetry artwork modal */}
      {artworkPiece && (
        <div
          className="modal-backdrop artwork-backdrop"
          onClick={() => setArtworkPiece(null)}
        >
          <article
            className="artwork-panel"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setArtworkPiece(null)}
              aria-label="Close artwork preview"
            >
              <X />
            </button>

            <p className="eyebrow">
              YOUR POETRY · YOUR ARTWORK
            </p>

            <h2>{artworkPiece.title}</h2>

            {!artworkReady && (
              <p className="artwork-loading">
                Creating your artwork…
              </p>
            )}

            <canvas
              ref={artworkCanvasRef}
              className="artwork-canvas"
              aria-label={`Poetry artwork for ${artworkPiece.title}`}
            />

            <div className="artwork-buttons">
              <button
                onClick={downloadArtwork}
                disabled={!artworkReady}
              >
                <Download size={16} />
                DOWNLOAD PNG
              </button>

              <button
                onClick={shareArtwork}
                disabled={!artworkReady}
              >
                <Share2 size={16} />
                SHARE IMAGE
              </button>
            </div>

            <p className="artwork-hint">
              Save your artwork or share it using an app supported
              by your device.
            </p>
          </article>
        </div>
      )}
    </div>
  );
}
