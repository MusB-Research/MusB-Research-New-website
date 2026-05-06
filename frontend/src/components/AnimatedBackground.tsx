import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    glow: number;
}

const AnimatedBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let mouseX = 0;
        let mouseY = 0;

        // Configuration
        const particleCount = 30;
        const connectionDistance = 180;
        const mouseRadius = 250;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 2.5 + 1;
                const colors = [
                    'rgba(6, 182, 212, ', // Cyan 500
                    'rgba(45, 212, 191, ', // Teal 400
                    'rgba(255, 255, 255, ', // White/Glow
                ];
                const colorBase = colors[Math.floor(Math.random() * colors.length)];

                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: size,
                    speedX: (Math.random() - 0.5) * 0.1, // Slower speed for better performance
                    speedY: (Math.random() - 0.5) * 0.1,
                    color: colorBase,
                    glow: Math.random() * 15 + 10 // Reduced glow size
                });
            }
        };

        const drawParticles = () => {
            // Draw background with a simple fill first
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const time = Date.now() * 0.001;

            particles.forEach((particle, index) => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseRadius) {
                    const force = (mouseRadius - distance) / mouseRadius;
                    particle.x += dx / 100 * force;
                    particle.y += dy / 100 * force;
                }

                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                const pulse = Math.sin(time + index) * 0.3 + 0.7;
                const currentGlow = particle.glow * pulse;
                const currentOpacity = (Math.sin(time * 0.5 + index) * 0.2 + 0.4);

                // Use globalAlpha instead of complex radial gradients for every particle
                ctx.save();
                ctx.globalAlpha = currentOpacity;
                ctx.shadowBlur = currentGlow;
                ctx.shadowColor = particle.color + '0.5)';
                
                ctx.fillStyle = particle.color + '0.8)';
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Optimized connections
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const distX = particle.x - p2.x;
                    const distY = particle.y - p2.y;
                    const distSq = distX * distX + distY * distY;

                    if (distSq < connectionDistance * connectionDistance) {
                        const dist = Math.sqrt(distSq);
                        const lineOpacity = (1 - dist / connectionDistance) * 0.05;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            // Draw fixed ambient spots only once or at lower frequency if needed
            // But here we keep them simple
            ctx.globalCompositeOperation = 'screen';
            const spots = [
                { x: 0.2, y: 0.2, c: 'rgba(6, 182, 212, 0.02)', r: 0.6 },
                { x: 0.8, y: 0.8, c: 'rgba(99, 102, 241, 0.02)', r: 0.6 }
            ];

            spots.forEach(spot => {
                ctx.fillStyle = spot.c;
                ctx.beginPath();
                ctx.arc(canvas.width * spot.x, canvas.height * spot.y, canvas.width * spot.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over';

            animationFrameId = requestAnimationFrame(drawParticles);
        };

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = event.clientX - rect.left;
            mouseY = event.clientY - rect.top;
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        resizeCanvas();
        drawParticles();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[-1]"
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default AnimatedBackground;


