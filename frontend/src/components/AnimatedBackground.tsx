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
                    'rgba(168, 85, 247, ', // Purple
                    'rgba(236, 72, 153, ', // Magenta
                    'rgba(6, 182, 212, ',  // Cyan
                    'rgba(20, 184, 166, '  // Teal
                ];
                const colorBase = colors[Math.floor(Math.random() * colors.length)];

                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: size,
                    speedX: (Math.random() - 0.5) * 0.2,
                    speedY: (Math.random() - 0.5) * 0.2,
                    color: colorBase,
                    glow: Math.random() * 25 + 15 
                });
            }
        };

        const drawParticles = () => {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#020617');
            gradient.addColorStop(1, '#050b1a');
            ctx.fillStyle = gradient;
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
                    particle.x += dx / 50 * force;
                    particle.y += dy / 50 * force;
                }

                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                const pulse = Math.sin(time + index) * 0.3 + 0.7;
                const currentGlow = particle.glow * pulse;
                const currentOpacity = (Math.sin(time * 0.5 + index) * 0.2 + 0.5);

                const particleGradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, currentGlow
                );
                particleGradient.addColorStop(0, particle.color + `${currentOpacity})`);
                particleGradient.addColorStop(1, particle.color + '0)');

                ctx.fillStyle = particleGradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, currentGlow, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = particle.color + '0.8)';
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.sqrt(Math.pow(particle.x - p2.x, 2) + Math.pow(particle.y - p2.y, 2));

                    if (dist < connectionDistance) {
                        const lineOpacity = (1 - dist / connectionDistance) * 0.15;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            const spots = [
                { x: 0.2, y: 0.2, c: 'rgba(168, 85, 247, 0.05)', r: 0.6 },
                { x: 0.8, y: 0.8, c: 'rgba(6, 182, 212, 0.05)', r: 0.6 },
                { x: 0.5, y: 0.5, c: 'rgba(236, 72, 153, 0.03)', r: 0.4 }
            ];

            spots.forEach(spot => {
                const sG = ctx.createRadialGradient(
                    canvas.width * spot.x, canvas.height * spot.y, 0,
                    canvas.width * spot.x, canvas.height * spot.y, canvas.width * spot.r
                );
                sG.addColorStop(0, spot.c);
                sG.addColorStop(1, 'transparent');
                ctx.fillStyle = sG;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });

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
            className="fixed inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default AnimatedBackground;
