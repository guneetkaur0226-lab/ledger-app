'use client';
import { useEffect, useState } from 'react';

// Best-effort deterrent for non-owner users. A web page cannot stop the phone's screenshot button,
// so this (1) covers the screen whenever the page loses focus or a PrintScreen key is pressed,
// and (2) stamps the viewer's name and email across the screen so any leaked image is traceable.
export default function Guard({ label }: { label: string }) {
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    let timer: any;
    const cover = (ms = 0) => {
      setCovered(true);
      clearTimeout(timer);
      if (ms) timer = setTimeout(() => setCovered(false), ms);
    };
    const uncover = () => { if (!document.hidden) setCovered(false); };
    const onVis = () => (document.hidden ? cover() : uncover());
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === 'PrintScreen' || k === 'Snapshot' || ((e.ctrlKey || e.metaKey) && (k === 'p' || k === 'P' || k === 's' || k === 'S'))) {
        e.preventDefault();
        try { navigator.clipboard?.writeText(''); } catch {}
        cover(2500);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', () => cover());
    window.addEventListener('focus', uncover);
    window.addEventListener('pagehide', () => cover());
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  const esc = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><text x="20" y="100" transform="rotate(-25 160 90)" font-family="sans-serif" font-size="15" font-weight="600" fill="#14213D" fill-opacity="0.16">${esc}</text></svg>`;
  return (
    <>
      <div className="wm" aria-hidden style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")` }} />
      {covered && <div className="cover" role="alert">Ledger hidden. Return to the app to continue.</div>}
    </>
  );
}
