import React, { useEffect, useRef } from 'react';

/**
 * Modern Animated Background Component
 * Inspired by Apple, Stripe, Linear, Vercel
 */

const AnimatedBackground = ({ variant = 'mesh' }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let time = 0;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle class for floating elements
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.offsetWidth;
                this.y = Math.random() * canvas.offsetHeight;
                this.size = Math.random() * 3 + 1;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.offsetWidth) this.x = 0;
                if (this.x < 0) this.x = canvas.offsetWidth;
                if (this.y > canvas.offsetHeight) this.y = 0;
                if (this.y < 0) this.y = canvas.offsetHeight;
            }

            draw() {
                ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Initialize particles
        const initParticles = () => {
            particles = [];
            const particleCount = Math.min(50, Math.floor(canvas.offsetWidth / 20));
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        initParticles();

        // Gradient mesh animation
        const drawMeshGradient = () => {
            const gradient = ctx.createLinearGradient(
                0,
                0,
                canvas.offsetWidth,
                canvas.offsetHeight
            );

            // Animated color stops
            const hue1 = (time * 0.1) % 360;
            const hue2 = (time * 0.1 + 120) % 360;
            const hue3 = (time * 0.1 + 240) % 360;

            gradient.addColorStop(0, `hsla(${hue1}, 70%, 50%, 0.3)`);
            gradient.addColorStop(0.5, `hsla(${hue2}, 70%, 50%, 0.2)`);
            gradient.addColorStop(1, `hsla(${hue3}, 70%, 50%, 0.3)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        };

        // Wave animation
        const drawWaves = () => {
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
            ctx.lineWidth = 2;

            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const amplitude = 50 + i * 20;
                const frequency = 0.01 + i * 0.005;
                const phase = time * 0.02 + i * Math.PI / 3;

                for (let x = 0; x < canvas.offsetWidth; x += 5) {
                    const y = canvas.offsetHeight / 2 +
                        Math.sin(x * frequency + phase) * amplitude;
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }
        };

        // Main animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

            if (variant === 'mesh') {
                drawMeshGradient();
            }

            if (variant === 'waves' || variant === 'mesh') {
                drawWaves();
            }

            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            time++;
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [variant]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.6 }}
        />
    );
};

export default AnimatedBackground;
