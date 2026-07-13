import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  targetAlpha: number;
}

export const ParticlesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 40;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (initY = false): Particle => {
      return {
        x: Math.random() * canvas.width,
        y: initY ? Math.random() * canvas.height : canvas.height + 10,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.3 + 0.1),
        alpha: Math.random() * 0.5 + 0.1,
        targetAlpha: Math.random() * 0.5 + 0.2,
      };
    };

    // Initialize particles across the entire viewport
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle(true));
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        // Drifting movement
        p.x += p.vx;
        p.y += p.vy;

        // Gentle alpha pulse
        p.alpha += (p.targetAlpha - p.alpha) * 0.01;
        if (Math.abs(p.targetAlpha - p.alpha) < 0.05) {
          p.targetAlpha = Math.random() * 0.6 + 0.1;
        }

        // Draw particle with gorgeous warm orange glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 115, 22, ${p.alpha})`; // orange-500
        ctx.shadowBlur = p.radius * 3;
        ctx.shadowColor = "rgba(249, 115, 22, 0.4)";
        ctx.fill();

        // Recycle particles when they exit the top or sides
        if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[index] = createParticle(false);
        }
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    initParticles();
    drawParticles();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
};
