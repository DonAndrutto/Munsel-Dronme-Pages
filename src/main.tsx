import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Maximize, Minimize, Minus, Moon, Move3d, Pause, Play, Plus, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import Practice from './Practice';
import { useScrolling } from './useScrolling';
import './reader.css';

const layers = [
  ['tib', 'TYB', 'Tekst tybetański'],
  ['pho', 'FON', 'Zapis fonetyczny'],
  ['pl', 'PL', 'Polski przekład'],
] as const;
const defaults = { tib: true, pho: true, pl: true, dark: false, size: 20, speed: 1 };
const settingsKey = 'munsel-dronme.reader.v1';

function readPreferences() {
  const settings = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    for (const key of ['tib', 'pho', 'pl', 'dark'] as const) {
      if (typeof saved[key] === 'boolean') settings[key] = saved[key];
    }
    if (!settings.tib && !settings.pho && !settings.pl) settings.pl = true;
    if (Number.isFinite(saved.size)) settings.size = Math.max(12, Math.min(40, saved.size));
    if (Number.isFinite(saved.speed)) settings.speed = Math.max(0.1, Math.min(5, saved.speed));
  } catch { /* Storage is optional in private browsing. */ }
  return settings;
}

function Reader() {
  const [settings, setSettings] = useState(readPreferences);
  const [focus, setFocus] = useState(false);
  const { mode, message, toggleAuto, toggleTilt } = useScrolling(settings.speed);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.dark);
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch { /* Session-only settings. */ }
  }, [settings]);
  useEffect(() => {
    if (!focus) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setFocus(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [focus]);

  const selected = layers.filter(([key]) => settings[key]).length;
  function speed(delta: number) {
    setSettings(s => ({ ...s, speed: Math.max(0.1, Math.min(5, +(s.speed + delta).toFixed(1))) }));
  }
  function resize(delta: number) {
    setSettings(s => ({ ...s, size: Math.max(12, Math.min(40, s.size + delta)) }));
  }
  const speedLabel = settings.speed.toLocaleString('pl');
  return <div className={focus ? 'focused' : ''}>
    <header className="reader-head" hidden={focus}>
      <div className="head-inner">
        <span className="reader-name">Münsel Drönme</span>
        <div className="layers" role="group" aria-label="Warstwy tekstu">
          {layers.map(([key, short, label]) => <button key={key} title={label} aria-label={label}
            aria-pressed={settings[key]} disabled={settings[key] && selected === 1}
            onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}>{short}</button>)}
        </div>
      </div>
    </header>
    <main className="reader" data-tib={settings.tib} data-pho={settings.pho} data-pl={settings.pl}
      style={{ fontSize: settings.size }} onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()}
      onContextMenu={e => e.preventDefault()}>
      <Practice />
    </main>
    <div className="bottom-bar">
      {message && !focus && <p role="status" className="status">{message}</p>}
      <div className="bar-inner" role="group" aria-label="Ustawienia czytania">
        <div className="bar-group" hidden={focus}>
          <button className="bar-btn" aria-label="Zwolnij przewijanie" title={'Wolniej · ' + speedLabel + '×'}
            disabled={settings.speed <= 0.1} onClick={() => speed(-0.1)}><Minus /></button>
          <button className="bar-btn" aria-label={mode === 'auto' ? 'Wstrzymaj przewijanie' : 'Włącz przewijanie'}
            aria-pressed={mode === 'auto'} title={'Automatyczne przewijanie · ' + speedLabel + '×'} onClick={toggleAuto}>
            {mode === 'auto' ? <Pause /> : <Play />}</button>
          <button className="bar-btn" aria-label="Przyspiesz przewijanie" title={'Szybciej · ' + speedLabel + '×'}
            disabled={settings.speed >= 5} onClick={() => speed(0.1)}><Plus /></button>
        </div>
        <div className="bar-group bar-center">
          <button className="bar-btn" hidden={focus} aria-label="Tryb ciemny" title="Tryb ciemny" aria-pressed={settings.dark}
            onClick={() => setSettings(s => ({ ...s, dark: !s.dark }))}>{settings.dark ? <Sun /> : <Moon />}</button>
          <button className="bar-btn" aria-label={focus ? 'Pokaż narzędzia' : 'Ukryj narzędzia'}
            title={focus ? 'Pokaż narzędzia' : 'Ukryj narzędzia'} onClick={() => setFocus(v => !v)}>
            {focus ? <Minimize /> : <Maximize />}</button>
          <button className="bar-btn" hidden={focus} aria-label="Przewijanie przechyłem" title="Przewijanie przechyłem"
            aria-pressed={mode === 'tilt'} onClick={toggleTilt}><Move3d /></button>
        </div>
        <div className="bar-group" hidden={focus}>
          <button className="bar-btn" aria-label="Zmniejsz tekst" title="Zmniejsz tekst"
            disabled={settings.size <= 12} onClick={() => resize(-2)}><ZoomOut /></button>
          <button className="bar-btn" aria-label="Powiększ tekst" title="Powiększ tekst"
            disabled={settings.size >= 40} onClick={() => resize(2)}><ZoomIn /></button>
        </div>
      </div>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Reader /></StrictMode>);
