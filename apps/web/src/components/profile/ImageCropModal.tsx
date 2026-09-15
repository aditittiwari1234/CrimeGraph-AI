import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';

interface Props {
  src: string;
  onConfirm: (croppedDataUrl: string) => void;
  onClose: () => void;
  outputSize?: number;
}

const CANVAS_SIZE = 320;
const CIRCLE_RADIUS = 140;
const CX = CANVAS_SIZE / 2;
const CY = CANVAS_SIZE / 2;

export default function ImageCropModal({ src, onConfirm, onClose, outputSize = 256 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);

  const [offset, setOffset] = useState({ x: CX, y: CY });
  const [scale,  setScale]  = useState(1);
  const [nat,    setNat]    = useState({ w: 1, h: 1 });
  const [ready,  setReady]  = useState(false);

  const drag = useRef({ active: false, startX: 0, startY: 0, ox: CX, oy: CY });

  // ── Min scale: photo must always cover the full circle ───────────────────────
  const minScale = useCallback((nw: number, nh: number) => {
    // smallest dim must span 2 × CIRCLE_RADIUS
    return (CIRCLE_RADIUS * 2) / Math.min(nw, nh);
  }, []);

  // ── Clamp offset so photo never exposes the circle edge ──────────────────────
  const clampOffset = useCallback((ox: number, oy: number, sc: number, nw: number, nh: number) => {
    const hw = (nw * sc) / 2; // half-width of drawn image
    const hh = (nh * sc) / 2;
    // image must reach every point on the circle boundary
    // simplest: keep image rect overlapping CIRCLE_RADIUS in every direction from centre
    const minOx = CX - hw + CIRCLE_RADIUS;
    const maxOx = CX + hw - CIRCLE_RADIUS;
    const minOy = CY - hh + CIRCLE_RADIUS;
    const maxOy = CY + hh - CIRCLE_RADIUS;
    return {
      x: Math.min(Math.max(ox, Math.min(minOx, maxOx)), Math.max(minOx, maxOx)),
      y: Math.min(Math.max(oy, Math.min(minOy, maxOy)), Math.max(minOy, maxOy)),
    };
  }, []);

  // ── Load image ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const nw = img.naturalWidth, nh = img.naturalHeight;
      setNat({ w: nw, h: nh });
      const sc = minScale(nw, nh);
      setScale(sc);
      setOffset({ x: CX, y: CY });
      setReady(true);
    };
    img.src = src;
  }, [src, minScale]);

  // ── Draw ─────────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Draw the image — crystal clear, no composite tricks
    const dw = img.naturalWidth  * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, offset.x - dw / 2, offset.y - dh / 2, dw, dh);

    // 2. Dim the area OUTSIDE the circle using an evenodd donut path
    //    (outer rect + inner circle, evenodd punches the circle out)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    ctx.beginPath();
    // outer rectangle
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // inner circle (drawn in opposite winding so evenodd cuts it out)
    ctx.arc(CX, CY, CIRCLE_RADIUS, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();

    // 3. Circle border (dashed purple ring)
    ctx.save();
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(CX, CY, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Subtle rule-of-thirds grid inside the circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 1; i <= 2; i++) {
      const x = CX - CIRCLE_RADIUS + (2 * CIRCLE_RADIUS * i) / 3;
      ctx.beginPath(); ctx.moveTo(x, CY - CIRCLE_RADIUS); ctx.lineTo(x, CY + CIRCLE_RADIUS); ctx.stroke();
      const y = CY - CIRCLE_RADIUS + (2 * CIRCLE_RADIUS * i) / 3;
      ctx.beginPath(); ctx.moveTo(CX - CIRCLE_RADIUS, y); ctx.lineTo(CX + CIRCLE_RADIUS, y); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }, [offset, scale]);

  useEffect(() => { if (ready) draw(); }, [ready, draw]);

  // ── Drag ─────────────────────────────────────────────────────────────────────
  const startDrag = (clientX: number, clientY: number) => {
    drag.current = { active: true, startX: clientX, startY: clientY, ox: offset.x, oy: offset.y };
  };
  const moveDrag = (clientX: number, clientY: number) => {
    if (!drag.current.active) return;
    const nx = drag.current.ox + (clientX - drag.current.startX);
    const ny = drag.current.oy + (clientY - drag.current.startY);
    setOffset(clampOffset(nx, ny, scale, nat.w, nat.h));
  };
  const endDrag = () => { drag.current.active = false; };

  // ── Zoom helpers ─────────────────────────────────────────────────────────────
  const applyScale = (newScale: number) => {
    const mn = minScale(nat.w, nat.h);
    const clamped = Math.max(mn, Math.min(newScale, mn * 8));
    setScale(clamped);
    setOffset(prev => clampOffset(prev.x, prev.y, clamped, nat.w, nat.h));
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    applyScale(scale * (e.deltaY < 0 ? 1.06 : 0.94));
  };

  // Slider position (0–100)
  const sliderVal = () => {
    const mn = minScale(nat.w, nat.h);
    const mx = mn * 8;
    return Math.round(((scale - mn) / (mx - mn)) * 100);
  };
  const onSlider = (v: number) => {
    const mn = minScale(nat.w, nat.h);
    const mx = mn * 8;
    applyScale(mn + (v / 100) * (mx - mn));
  };

  const reset = () => {
    const sc = minScale(nat.w, nat.h);
    setScale(sc);
    setOffset({ x: CX, y: CY });
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement('canvas');
    out.width  = outputSize;
    out.height = outputSize;
    const ctx  = out.getContext('2d')!;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Map the visible circle region in display-canvas coords → output canvas
    const ratio   = outputSize / (CIRCLE_RADIUS * 2);
    const circleL = CX - CIRCLE_RADIUS;
    const circleT = CY - CIRCLE_RADIUS;
    const dw = img.naturalWidth  * scale;
    const dh = img.naturalHeight * scale;
    const imgL = offset.x - dw / 2;
    const imgT = offset.y - dh / 2;

    ctx.drawImage(
      img,
      (imgL - circleL) * ratio,
      (imgT - circleT) * ratio,
      dw * ratio,
      dh * ratio,
    );

    onConfirm(out.toDataURL('image/png'));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1301,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 20,
        boxShadow: '0 40px 100px rgba(0,0,0,0.65)',
        overflow: 'hidden',
        width: 400,
        maxWidth: 'calc(100vw - 24px)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid var(--border-primary)',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), transparent)',
        }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Crop Photo</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Drag to reposition · Scroll or slider to zoom
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Canvas area */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 20px 0', background: '#111' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onMouseDown={e  => startDrag(e.clientX, e.clientY)}
            onMouseMove={e  => moveDrag(e.clientX, e.clientY)}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onWheel={onWheel}
            onTouchStart={e  => { if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
            onTouchMove={e   => { e.preventDefault(); if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY); }}
            onTouchEnd={endDrag}
            style={{ cursor: 'grab', display: 'block', borderRadius: 8, touchAction: 'none' }}
          />
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: '#111' }}>
          <button onClick={() => applyScale(scale / 1.1)}
            style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex' }}>
            <ZoomOut size={14} />
          </button>
          <input
            type="range" min={0} max={100}
            value={sliderVal()}
            onChange={e => onSlider(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#7c3aed', cursor: 'pointer' }}
          />
          <button onClick={() => applyScale(scale * 1.1)}
            style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex' }}>
            <ZoomIn size={14} />
          </button>
          <button onClick={reset} title="Reset position & zoom"
            style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex' }}>
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 20px', borderTop: '1px solid var(--border-primary)', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
            <Check size={14} />
            Use Photo
          </button>
        </div>
      </div>
    </>
  );
}

