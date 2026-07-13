import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Minus, Square, Highlighter, Eraser, Trash2, Undo2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type DrawTool = 'pen' | 'arrow' | 'rect' | 'highlight' | 'eraser';
type StrokeWidth = 2 | 5 | 10;

interface Point { x: number; y: number; }
interface DrawAction {
  tool: DrawTool;
  color: string;
  strokeWidth: StrokeWidth;
  points: Point[];
}

// ─── Constants ──────────────────────────────────────────────────────────────
const COLORS = [
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#60a5fa' },
  { label: 'Yellow', value: '#fbbf24' },
  { label: 'Green', value: '#34d399' },
  { label: 'White', value: '#ffffff' },
];
const STROKE_WIDTHS: { label: string; value: StrokeWidth }[] = [
  { label: 'S', value: 2 },
  { label: 'M', value: 5 },
  { label: 'L', value: 10 },
];

// ─── Drawing helpers ─────────────────────────────────────────────────────────
function drawAction(ctx: CanvasRenderingContext2D, action: DrawAction) {
  if (action.points.length === 0) return;
  const { tool, color, strokeWidth, points } = action;

  ctx.save();
  ctx.strokeStyle = tool === 'highlight' ? color + '80' : color;
  ctx.fillStyle = tool === 'highlight' ? color + '40' : color;
  ctx.lineWidth = tool === 'highlight' ? strokeWidth * 4 : strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

  if (tool === 'pen' || tool === 'eraser' || tool === 'highlight') {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  } else if (tool === 'rect' && points.length >= 2) {
    const [p0, p1] = [points[0], points[points.length - 1]];
    ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
  } else if (tool === 'arrow' && points.length >= 2) {
    const [from, to] = [points[0], points[points.length - 1]];
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLen = Math.max(strokeWidth * 4, 18);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 7), to.y - headLen * Math.sin(angle - Math.PI / 7));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 7), to.y - headLen * Math.sin(angle + Math.PI / 7));
    ctx.stroke();
  }

  ctx.restore();
}

function redraw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, actions: DrawAction[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  actions.forEach(a => drawAction(ctx, a));
}

// ─── Component ───────────────────────────────────────────────────────────────
interface AnnotationOverlayProps {
  /** Show overlay only when recording / paused */
  active: boolean;
  /** Controlled by parent — whether draw mode is on */
  isAnnotating: boolean;
  onToggle: () => void;
}

const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  active,
  isAnnotating,
  onToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(5);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const isDrawingRef = useRef(false);
  const currentAction = useRef<DrawAction | null>(null);

  // Size canvas to its CSS box
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) redraw(ctx, canvas, actions);
    };
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    size();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear when deactivated
  useEffect(() => {
    if (!active) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActions([]);
    }
  }, [active]);

  // Redraw on every action change
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    redraw(ctx, canvas, actions);
  }, [actions]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * sx, y: ((e as React.MouseEvent).clientY - rect.top) * sy };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isAnnotating) return;
    e.preventDefault();
    isDrawingRef.current = true;
    currentAction.current = { tool, color, strokeWidth, points: [getPos(e)] };

  }, [isAnnotating, tool, color, strokeWidth]);

  const continueDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !currentAction.current || !isAnnotating) return;
    e.preventDefault();
    currentAction.current.points.push(getPos(e));
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    redraw(ctx, canvas, actions);
    drawAction(ctx, currentAction.current);
  }, [isAnnotating, actions]);

  const endDraw = useCallback(() => {
    if (!isDrawingRef.current || !currentAction.current) return;
    isDrawingRef.current = false;
    if (currentAction.current.points.length > 0) {
      setActions(prev => [...prev, currentAction.current!]);
    }
    currentAction.current = null;
  }, []);

  if (!active) return null;

  const toolItems: { id: DrawTool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <Pencil className="w-4 h-4" />, label: 'Pen' },
    { id: 'arrow', icon: <Minus className="w-4 h-4" style={{ transform: 'rotate(-45deg)' }} />, label: 'Arrow' },
    { id: 'rect', icon: <Square className="w-4 h-4" />, label: 'Rect' },
    { id: 'highlight', icon: <Highlighter className="w-4 h-4" />, label: 'Highlight' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser' },
  ];

  return (
    <>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={continueDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={continueDraw}
        onTouchEnd={endDraw}
        className="absolute inset-0 w-full h-full rounded-2xl"
        style={{
          pointerEvents: isAnnotating ? 'auto' : 'none',
          cursor: isAnnotating ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'default',
          zIndex: 20,
        }}
      />

      {/* Floating toolbar — visible only in annotation mode */}
      {isAnnotating && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 rounded-2xl shadow-2xl"
          style={{
            background: 'rgba(10,15,30,0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            zIndex: 30,
            whiteSpace: 'nowrap',
          }}
        >
          {/* Tools */}
          {toolItems.map(t => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTool(t.id)}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: tool === t.id ? 'rgba(67,97,240,0.4)' : 'transparent',
                color: tool === t.id ? '#93affd' : 'rgba(255,255,255,0.5)',
                border: tool === t.id ? '1px solid rgba(67,97,240,0.5)' : '1px solid transparent',
              }}
            >
              {t.icon}
            </button>
          ))}

          <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Color palette */}
          {COLORS.map(c => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => setColor(c.value)}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110 flex-shrink-0"
              style={{
                background: c.value,
                outline: color === c.value ? '2px solid white' : '2px solid transparent',
                outlineOffset: '2px',
              }}
            />
          ))}

          <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Stroke width */}
          {STROKE_WIDTHS.map(sw => (
            <button
              key={sw.value}
              title={`Stroke ${sw.label}`}
              onClick={() => setStrokeWidth(sw.value)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all"
              style={{
                background: strokeWidth === sw.value ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: strokeWidth === sw.value ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            >
              {sw.label}
            </button>
          ))}

          <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Undo */}
          <button
            title="Undo last stroke"
            onClick={() => setActions(prev => prev.slice(0, -1))}
            disabled={actions.length === 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Clear all */}
          <button
            title="Clear canvas"
            onClick={() => setActions([])}
            disabled={actions.length === 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Exit draw mode */}
          <button
            onClick={onToggle}
            className="px-3 h-8 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            Done
          </button>
        </div>
      )}
    </>
  );
};

export default AnnotationOverlay;
