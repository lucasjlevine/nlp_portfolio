"use client";

import { useEffect, useMemo, useRef } from "react";

type Star = { x: number; y: number; r: number; a: number; s: number };

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stars = useMemo(() => {
    const out: Star[] = [];
    for (let i = 0; i < 240; i++) {
      out.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * (i % 17 === 0 ? 2.2 : 1.5) + 0.25,
        a: Math.random() * 0.75 + 0.18,
        s: Math.random() * 0.28 + 0.04,
      });
    }
    return out;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(w * 0.2, h * 0.1, 0, w * 0.2, h * 0.1, w * 0.7);
      g.addColorStop(0, "rgba(124,108,255,0.18)");
      g.addColorStop(0.45, "rgba(62,224,184,0.05)");
      g.addColorStop(1, "rgba(5,8,20,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.85, h * 0.7, 0, w * 0.85, h * 0.7, w * 0.55);
      g2.addColorStop(0, "rgba(255,107,107,0.08)");
      g2.addColorStop(1, "rgba(5,8,20,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      for (const star of stars) {
        const twinkle = reduce ? 1 : 0.65 + 0.35 * Math.sin(t * star.s + star.x * 12);
        ctx.beginPath();
        ctx.fillStyle = `rgba(232,238,252,${star.a * twinkle})`;
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce) {
        t += 0.035;
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [stars]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
