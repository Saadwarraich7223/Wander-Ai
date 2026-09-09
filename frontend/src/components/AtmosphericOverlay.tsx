"use client";

import { useEffect, useRef, useState } from "react";

export type WeatherScenario = "clear" | "rain" | "snow" | "monsoon";

interface AtmosphericOverlayProps {
  scenario: WeatherScenario;
}

export default function AtmosphericOverlay({ scenario }: AtmosphericOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Trigger 5-second active animation effect on weather scenario change
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [scenario]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle Structure
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      step: number;
      rotation: number;
      rotSpeed: number;
      splashRadius?: number;
    }

    const count = scenario === "monsoon" ? 170 : scenario === "rain" ? 120 : scenario === "snow" ? 65 : 45;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size:
          scenario === "snow"
            ? Math.random() * 7 + 4
            : scenario === "clear"
            ? Math.random() * 5 + 2
            : Math.random() * 2 + 1,
        speedY:
          scenario === "monsoon"
            ? Math.random() * 14 + 11
            : scenario === "rain"
            ? Math.random() * 9 + 6
            : scenario === "snow"
            ? Math.random() * 1.4 + 0.6
            : -(Math.random() * 0.4 + 0.1),
        speedX:
          scenario === "monsoon"
            ? Math.random() * 2 - 4
            : scenario === "rain"
            ? -1.8
            : scenario === "snow"
            ? Math.sin(Math.random() * Math.PI) * 0.6
            : (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.65 + 0.35,
        step: Math.random() * 100,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        splashRadius: 0,
      });
    }

    let lightningTimer = 0;
    let lightningOpacity = 0;
    let lightningX = width * 0.5;

    // Helper 1: Crystalline 6-arm snowflake
    const drawSnowflakeCrystal = (x: number, y: number, radius: number, opacity: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity * 0.85})`;
      ctx.lineWidth = Math.max(1, radius * 0.18);
      ctx.lineCap = "round";

      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -radius);

        const b1 = radius * 0.5;
        ctx.moveTo(0, -b1);
        ctx.lineTo(-radius * 0.35, -b1 - radius * 0.2);
        ctx.moveTo(0, -b1);
        ctx.lineTo(radius * 0.35, -b1 - radius * 0.2);

        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, radius * 0.25), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${opacity})`;
      ctx.fill();

      ctx.restore();
    };

    // Helper 2: Realistic Raindrop with Gradient Trail & Splash
    const drawRealisticRaindrop = (p: Particle, isMonsoon: boolean) => {
      const streakLen = isMonsoon ? p.size * 22 : p.size * 14;
      const endX = p.x + p.speedX * 2;
      const endY = p.y + streakLen;

      const grad = ctx.createLinearGradient(p.x, p.y, endX, endY);
      if (isMonsoon) {
        grad.addColorStop(0, `rgba(99, 102, 241, 0)`);
        grad.addColorStop(1, `rgba(129, 140, 248, ${p.opacity * 0.9})`);
      } else {
        grad.addColorStop(0, `rgba(14, 116, 144, 0)`);
        grad.addColorStop(1, `rgba(14, 165, 233, ${p.opacity * 0.8})`);
      }

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = p.size;
      ctx.lineCap = "round";
      ctx.stroke();

      // Rain Splash ripple near bottom of viewport
      if (p.y > height - 80) {
        p.splashRadius = (p.splashRadius || 0) + 0.4;
        if (p.splashRadius < 8) {
          ctx.beginPath();
          ctx.ellipse(p.x, height - 10, p.splashRadius, p.splashRadius * 0.4, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - p.splashRadius / 8) * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    // Helper 3: Golden Sun Dust Bokeh Halo
    const drawGoldenBokeh = (p: Particle) => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      grad.addColorStop(0, `rgba(251, 191, 36, ${p.opacity * 0.8})`);
      grad.addColorStop(0.5, `rgba(245, 158, 11, ${p.opacity * 0.3})`);
      grad.addColorStop(1, "rgba(245, 158, 11, 0)");

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    };

    // Helper 4: Zig-zag Lightning Bolt Path for Storms
    const drawLightningBolt = (startX: number, startY: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      let curX = startX;
      let curY = startY;

      while (curY < height * 0.6) {
        curX += (Math.random() - 0.5) * 40;
        curY += Math.random() * 30 + 15;
        ctx.lineTo(curX, curY);
      }

      ctx.strokeStyle = "rgba(224, 231, 255, 0.9)";
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(129, 140, 248, 1)";
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Lightning Flash effect for Monsoon Surge
      if (scenario === "monsoon") {
        lightningTimer++;
        if (lightningTimer > 240 && Math.random() < 0.04) {
          lightningOpacity = 0.3;
          lightningX = Math.random() * width;
          lightningTimer = 0;
        }
        if (lightningOpacity > 0) {
          ctx.fillStyle = `rgba(99, 102, 241, ${lightningOpacity * 0.6})`;
          ctx.fillRect(0, 0, width, height);
          drawLightningBolt(lightningX, 0);
          lightningOpacity -= 0.04;
        }
      }

      // Render weather particles
      particles.forEach((p) => {
        p.step += 0.02;

        if (scenario === "snow") {
          p.x += Math.sin(p.step) * 0.6 + p.speedX;
          p.y += p.speedY;
          p.rotation += p.rotSpeed;
          drawSnowflakeCrystal(p.x, p.y, p.size, p.opacity, p.rotation);
        } else if (scenario === "rain" || scenario === "monsoon") {
          p.x += p.speedX;
          p.y += p.speedY;
          drawRealisticRaindrop(p, scenario === "monsoon");
        } else {
          // Clear skies golden sun dust
          p.x += p.speedX;
          p.y += p.speedY;
          drawGoldenBokeh(p);
        }

        // Reset particle position when leaving boundary
        if (p.y > height + 20) {
          p.y = -10;
          p.x = Math.random() * width;
          p.splashRadius = 0;
        } else if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
          p.splashRadius = 0;
        }
        if (p.x > width + 20) p.x = -10;
        if (p.x < -20) p.x = width + 10;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [scenario]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Light Theme Weather Ambient Mesh Lighting Gradients */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 bg-gradient-to-b ${
          scenario === "clear"
            ? "from-amber-500/10 via-amber-500/5 to-transparent"
            : scenario === "rain"
            ? "from-teal-500/12 via-cyan-500/5 to-transparent"
            : scenario === "snow"
            ? "from-sky-400/15 via-blue-500/5 to-transparent"
            : "from-indigo-500/12 via-purple-500/5 to-transparent"
        }`}
      />

      {/* Dynamic Ambient Glowing Orbs */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none ${
          scenario === "clear"
            ? "bg-amber-400/25"
            : scenario === "rain"
            ? "bg-teal-400/25"
            : scenario === "snow"
            ? "bg-sky-300/30"
            : "bg-indigo-400/25"
        }`}
      />
      <div
        className={`absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-[120px] transition-all duration-1000 pointer-events-none ${
          scenario === "clear"
            ? "bg-emerald-400/20"
            : scenario === "rain"
            ? "bg-cyan-400/25"
            : scenario === "snow"
            ? "bg-blue-300/25"
            : "bg-purple-400/25"
        }`}
      />

      {/* Weather Particle Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
