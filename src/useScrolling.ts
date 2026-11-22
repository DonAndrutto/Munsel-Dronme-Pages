import { useEffect, useRef, useState } from 'react';

type Mode = 'off' | 'auto' | 'tilt';
type Orientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };

export function useScrolling(speed: number) {
  const [mode, setMode] = useState<Mode>('off');
  const [message, setMessage] = useState('');
  const requestVersion = useRef(0);

  function toggleAuto() {
    requestVersion.current++;
    setMessage('');
    setMode(value => value === 'auto' ? 'off' : 'auto');
  }

  async function toggleTilt() {
    const version = ++requestVersion.current;
    setMessage('');
    setMode('off');
    if (mode === 'tilt') return;
    const sensor = window.DeviceOrientationEvent as Orientation | undefined;
    if (!sensor) {
      setMessage('To urządzenie nie obsługuje przewijania przechyłem.');
      return;
    }
    try {
      const permission = await sensor.requestPermission?.();
      if (version !== requestVersion.current) return;
      if (permission && permission !== 'granted') {
        setMessage('Aby przewijać przechyłem, zezwól na dostęp do czujnika ruchu.');
      } else {
        setMode('tilt');
      }
    } catch {
      if (version === requestVersion.current) setMessage('Nie udało się włączyć czujnika ruchu.');
    }
  }

  useEffect(() => {
    if (mode === 'off') return;
    let baseline: number | null = null;
    let tilt = 0;
    let last = performance.now();
    let position = window.scrollY;
    let pauseUntil = 0;
    let frame: number;
    function orient(event: DeviceOrientationEvent) {
      if (event.beta == null) return;
      baseline ??= event.beta;
      tilt = event.beta - baseline;
    }
    function manual() { pauseUntil = performance.now() + 1800; }
    function advance(now: number) {
      const delta = Math.min(64, now - last) / 1000;
      last = now;
      if (now < pauseUntil || Math.abs(position - window.scrollY) > 2) position = window.scrollY;
      const rate = mode === 'auto' ? 25 : Math.abs(tilt) > 1 ? -Math.sign(tilt) * Math.min(600, 0.6 * tilt * tilt) : 0;
      if (now >= pauseUntil && rate !== 0) {
        const end = document.documentElement.scrollHeight - window.innerHeight;
        position = Math.max(0, Math.min(end, position + delta * rate * speed));
        window.scrollTo(0, position);
        if (mode === 'auto' && position >= end) {
          setMode('off');
          return;
        }
      }
      frame = requestAnimationFrame(advance);
    }
    if (mode === 'tilt') window.addEventListener('deviceorientation', orient);
    window.addEventListener('wheel', manual, { passive: true });
    window.addEventListener('touchmove', manual, { passive: true });
    frame = requestAnimationFrame(advance);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('deviceorientation', orient);
      window.removeEventListener('wheel', manual);
      window.removeEventListener('touchmove', manual);
    };
  }, [mode, speed]);

  return { mode, toggleAuto, toggleTilt, message };
}
