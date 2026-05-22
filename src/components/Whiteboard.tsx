import { useEffect, useRef, useState } from "react";
import { Pencil, Eraser, Trash2, Download, Square, Circle as CircleIcon, Type, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tool = "pen" | "eraser" | "rect" | "circle" | "text";

interface Stroke {
  tool: Tool;
  color: string;
  size: number;
  points: { x: number; y: number }[];
  text?: string;
}

interface WhiteboardProps {
  storageKey?: string;
  height?: number;
  compact?: boolean;
  onSave?: (dataUrl: string) => void;
  saveLabel?: string;
}

const COLORS = ["#0f172a", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];

const Whiteboard = ({ storageKey, height = 480, compact = false, onSave, saveLabel = "Übernehmen" }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>(() => {
    if (!storageKey) return [];
    try {
      const raw = localStorage.getItem("wb-" + storageKey);
      return raw ? (JSON.parse(raw) as Stroke[]) : [];
    } catch {
      return [];
    }
  });
  const drawingRef = useRef<Stroke | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // Persist
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem("wb-" + storageKey, JSON.stringify(strokes));
  }, [strokes, storageKey]);

  // Redraw
  const redraw = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    const all = drawingRef.current ? [...strokes, drawingRef.current] : strokes;
    all.forEach((s) => drawStroke(ctx, s));
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    ctx.strokeStyle = s.tool === "eraser" ? "#ffffff" : s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.tool === "eraser" ? s.size * 4 : s.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (s.tool === "pen" || s.tool === "eraser") {
      ctx.beginPath();
      s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    } else if (s.tool === "rect" && s.points.length >= 2) {
      const [a, b] = [s.points[0], s.points[s.points.length - 1]];
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    } else if (s.tool === "circle" && s.points.length >= 2) {
      const [a, b] = [s.points[0], s.points[s.points.length - 1]];
      const r = Math.hypot(b.x - a.x, b.y - a.y);
      ctx.beginPath();
      ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.tool === "text" && s.text && s.points[0]) {
      ctx.font = `${s.size * 6 + 12}px ui-sans-serif, system-ui`;
      ctx.fillText(s.text, s.points[0].x, s.points[0].y);
    }
  };

  // Resize
  useEffect(() => {
    const cvs = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cvs || !wrap) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      cvs.width = wrap.clientWidth * dpr;
      cvs.height = height * dpr;
      cvs.style.width = wrap.clientWidth + "px";
      cvs.style.height = height + "px";
      const ctx = cvs.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = getPos(e);
    startRef.current = p;

    if (tool === "text") {
      const text = window.prompt("Text:");
      if (!text) return;
      setStrokes((s) => [...s, { tool: "text", color, size, points: [p], text }]);
      return;
    }

    drawingRef.current = { tool, color, size, points: [p] };
    redraw();
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const p = getPos(e);
    drawingRef.current.points.push(p);
    redraw();
  };

  const onUp = () => {
    if (!drawingRef.current) return;
    const finished = drawingRef.current;
    drawingRef.current = null;
    setStrokes((s) => [...s, finished]);
  };

  const undo = () => setStrokes((s) => s.slice(0, -1));
  const clear = () => {
    if (window.confirm("Whiteboard wirklich leeren?")) setStrokes([]);
  };
  const exportPng = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const a = document.createElement("a");
    a.href = cvs.toDataURL("image/png");
    a.download = "whiteboard.png";
    a.click();
  };

  const tools: { id: Tool; icon: typeof Pencil; label: string }[] = [
    { id: "pen", icon: Pencil, label: "Stift" },
    { id: "eraser", icon: Eraser, label: "Radierer" },
    { id: "rect", icon: Square, label: "Rechteck" },
    { id: "circle", icon: CircleIcon, label: "Kreis" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <div className="space-y-3">
      <div className={cn("flex flex-wrap items-center gap-2 p-2 rounded-xl bg-secondary/60 border border-border", compact && "p-1.5")}>
        <div className="flex gap-1">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors",
                tool === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                color === c ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        <input
          type="range"
          min={1}
          max={12}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-20 accent-primary"
          title="Größe"
        />

        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={undo} title="Rückgängig">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={exportPng} title="PNG laden">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={clear} title="Leeren">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          {onSave && (
            <Button
              size="sm"
              onClick={() => {
                const cvs = canvasRef.current;
                if (!cvs) return;
                onSave(cvs.toDataURL("image/png"));
              }}
            >
              {saveLabel}
            </Button>
          )}
        </div>
      </div>

      <div ref={wrapRef} className="rounded-xl overflow-hidden border border-border bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          className="block touch-none cursor-crosshair"
        />
      </div>
    </div>
  );
};

export default Whiteboard;
