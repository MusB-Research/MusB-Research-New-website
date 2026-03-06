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
        const particleCount = 20; // Number of particles
        const connectionDistance = 150; // Distance to draw lines
        const mouseRadius = 200; // Radius for mouse interaction

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 2 + 1; // Random size 1-3
                // Colors: Cyan, Blue, Purple mix
                const colors = ['rgba(6, 182, 212, ', 'rgba(99, 102, 241, ', 'rgba(168, 85, 247, '];
                const colorBase = colors[Math.floor(Math.random() * colors.length)];

                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: size,
                    speedX: (Math.random() - 0.5) * 0.5, // Slow horizontal speed
                    speedY: (Math.random() - 0.5) * 0.5, // Slow vertical speed
                    color: colorBase,
                    glow: Math.random() * 15 + 5 // Glow radius
                });
            }
        };

        const drawParticles = () => {
            // Dark gradient background clear - Deep Navy/Black
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#020617'); // slate-950 equivalent
            gradient.addColorStop(0.5, '#0f172a'); // slate-900 equivalent slightly lighter
            gradient.addColorStop(1, '#020617'); // Back to dark

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle noise/grain overlay could be added here for texture if needed

            particles.forEach((particle, index) => {
                // Movement
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Mouse interaction (parallax/repel/attract) - subtle attraction
                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseRadius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseRadius - distance) / mouseRadius;
                    const directionX = forceDirectionX * force * 0.5; // Attraction strength
                    const directionY = forceDirectionY * force * 0.5;

                    particle.x += directionX;
                    particle.y += directionY;
                }

                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

                // Draw Particle (Glow)
                ctx.beginPath();
                // Radial gradient for soft glow
                const particleGradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.glow
                );
                particleGradient.addColorStop(0, particle.color + '0.8)'); // Core opacity
                particleGradient.addColorStop(1, particle.color + '0)');   // Fade out

                ctx.fillStyle = particleGradient;
                ctx.arc(particle.x, particle.y, particle.glow, 0, Math.PI * 2);
                ctx.fill();

                // Draw solid core
                ctx.beginPath();
                ctx.fillStyle = particle.color + '1)';
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                // Connect particles (Constellation effect)
                /* 
                // Optional: Uncomment for connected lines effect. 
                // Kept commented out for a cleaner, more "glowing particles" look as requested "abstract wave/particle".
                // Adding lines makes it look very "tech/networky". Without lines it looks more "space/magical".
                // Let's enable subtle connections for density.
                */
                for (let j = index; j < particles.length; j++) {
                    const p2 = particles[j];
                    const distX = particle.x - p2.x;
                    const distY = particle.y - p2.y;
                    const dist = Math.sqrt(distX * distX + distY * distY);

                    if (dist < connectionDistance) {
                        ctx.beginPath();
                        // Opacity based on distance
                        const opacity = 1 - (dist / connectionDistance);
                        ctx.strokeStyle = `rgba(100, 116, 139, ${opacity * 0.15})`; // Slate-500 very faint
                        ctx.lineWidth = 1;
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            // Draw large ambient glow orbs in background (simulating "abstract waves")
            // Can be static or slowly moving separate from particles
            // Top-left glow
            const ambient1 = ctx.createRadialGradient(
                canvas.width * 0.2, canvas.height * 0.2, 0,
                canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.5
            );
            ambient1.addColorStop(0, 'rgba(6, 182, 212, 0.03)'); // Cyan faint
            ambient1.addColorStop(1, 'transparent');
            ctx.fillStyle = ambient1;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bottom-right glow
            const ambient2 = ctx.createRadialGradient(
                canvas.width * 0.8, canvas.height * 0.8, 0,
                canvas.width * 0.8, canvas.height * 0.8, canvas.width * 0.5
            );
            ambient2.addColorStop(0, 'rgba(168, 85, 247, 0.03)'); // Purple faint
            ambient2.addColorStop(1, 'transparent');
            ctx.fillStyle = ambient2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

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
