import React, { useEffect, useRef } from "react";
import { useFinance } from "../../context/FinanceContext";

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  color: string;
}

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useFinance();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Mixed Royal Particle Palette
    const isDark = theme === "dark";
    const colors = isDark
      ? [
          "rgba(129, 140, 248, 0.50)", // Royal Indigo
          "rgba(168, 85, 247, 0.45)", // Imperial Violet
          "rgba(59, 130, 246, 0.40)", // Sapphire Blue
          "rgba(245, 158, 11, 0.35)", // Royal Gold highlight
        ]
      : [
          "rgba(79, 70, 229, 0.24)", // Royal Indigo
          "rgba(124, 58, 237, 0.20)", // Royal Violet
          "rgba(37, 99, 235, 0.20)", // Sapphire Blue
          "rgba(217, 119, 6, 0.16)", // Warm Gold hint
        ];

    // Adaptive particle density: lighter on mobile viewports for zero lag
    const isMobileViewport = width < 768;
    const particleCount = prefersReducedMotion
      ? 0
      : Math.min(isMobileViewport ? 16 : 26, Math.max(8, Math.floor((width * height) / 52000)));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = Math.random() * 0.45 + 0.15;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 1.1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: baseAlpha,
        baseAlpha,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    if (!isMobileViewport && !prefersReducedMotion) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    let tick = 0;
    let isVisible = !document.hidden;

    const drawStaticGlow = () => {
      ctx.clearRect(0, 0, width, height);
      const gradient1 = ctx.createRadialGradient(
        width * 0.85,
        height * 0.15,
        10,
        width * 0.85,
        height * 0.15,
        width * 0.45
      );
      gradient1.addColorStop(0, isDark ? "rgba(124, 58, 237, 0.07)" : "rgba(124, 58, 237, 0.05)");
      gradient1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, width, height);
    };

    const render = () => {
      if (!isVisible) return;

      tick += 0.01;
      ctx.clearRect(0, 0, width, height);

      // 1. Mixed Royal Mesh Glow Spots
      const gradient1 = ctx.createRadialGradient(
        width * 0.85 + Math.sin(tick) * 32,
        height * 0.15 + Math.cos(tick) * 24,
        10,
        width * 0.85,
        height * 0.15,
        width * 0.45
      );
      gradient1.addColorStop(0, isDark ? "rgba(124, 58, 237, 0.07)" : "rgba(124, 58, 237, 0.05)");
      gradient1.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, width, height);

      const gradient2 = ctx.createRadialGradient(
        width * 0.15 + Math.cos(tick * 0.8) * 28,
        height * 0.75 + Math.sin(tick * 0.8) * 28,
        10,
        width * 0.15,
        height * 0.75,
        width * 0.42
      );
      gradient2.addColorStop(0, isDark ? "rgba(37, 99, 235, 0.06)" : "rgba(79, 70, 229, 0.045)");
      gradient2.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);

      // 2. Animate and draw particles without expensive shadowBlur per particle
      for (let idx = 0; idx < particles.length; idx++) {
        const p = particles[idx];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        if (!isMobileViewport) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 32400) {
            const dist = Math.sqrt(distSq);
            p.alpha = Math.min(1, p.baseAlpha + (1 - dist / 180) * 0.5);
          } else {
            p.alpha += (p.baseAlpha - p.alpha) * 0.05;
          }
        }

        // Soft outer halo without shadowBlur GPU stall
        ctx.globalAlpha = p.alpha * 0.28;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Crisp core particle
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdistSq = cdx * cdx + cdy * cdy;

          if (cdistSq < 12100) {
            const cdist = Math.sqrt(cdistSq);
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isDark
              ? `rgba(129, 140, 248, ${(1 - cdist / 110) * 0.11})`
              : `rgba(79, 70, 229, ${(1 - cdist / 110) * 0.08})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      cancelAnimationFrame(animationFrameId);
      if (isVisible && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (prefersReducedMotion) {
      drawStaticGlow();
    } else if (isVisible) {
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Mixed Royal Ambient Glows */}
      <div className="absolute -top-24 right-1/4 w-[48vw] h-[48vw] max-w-[680px] max-h-[680px] rounded-full bg-gradient-to-br from-violet-600/12 via-indigo-500/8 to-transparent blur-[110px] ambient-orb pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-[42vw] h-[42vw] max-w-[620px] max-h-[620px] rounded-full bg-gradient-to-tr from-blue-600/10 via-indigo-600/8 to-transparent blur-[120px] ambient-pulse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32vw] h-[32vw] max-w-[420px] max-h-[420px] rounded-full bg-gradient-to-tr from-amber-500/5 via-fuchsia-500/5 to-transparent blur-[100px] pointer-events-none" />

      {/* Interactive HTML5 particle canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-90 transition-opacity duration-500"
      />
    </div>
  );
};
