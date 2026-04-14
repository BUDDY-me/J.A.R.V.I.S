import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import reactorImg from "./assets/arcreactor.png";

/* ================= SOCKET ================= */
const socket = io("http://127.0.0.1:5000", {
    transports: ["websocket"],
});

/* ================= ENERGY ENGINE ================= */
function useEnergy() {
    const energy = useRef(0);
    const target = useRef(0);

    useEffect(() => {
        let frame;

        const loop = () => {
            energy.current += (target.current - energy.current) * 0.12;
            frame = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(frame);
    }, []);

    return {
        energy,
        setEnergy: (v) => (target.current = v),
    };
}

/* ================= SNAP PARTICLES ================= */
function useSnapParticles(active) {
    const particles = useRef([]);

    useEffect(() => {
        if (!active) return;

        particles.current = Array.from({ length: 160 }).map(() => ({
            x: 0,
            y: 0,
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.5) * 18,
            life: 1,
        }));

        let frame;

        const animate = () => {
            particles.current.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.92;
                p.vy *= 0.92;
                p.life -= 0.02;
            });

            particles.current = [...particles.current]; // force refresh

            frame = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(frame);
    }, [active]);

    return particles;
}

/* ================= APP ================= */
export default function App() {
    const { energy, setEnergy } = useEnergy();
    const [snap, setSnap] = useState(false);

    const particles = useSnapParticles(snap);

    /* ================= SOCKET ================= */
    useEffect(() => {
        socket.on("jarvis_speaking", () => setEnergy(1));
        socket.on("jarvis_finished", () => setEnergy(0));

        socket.on("thanos_snap", () => {
            console.log("💥 SNAP TRIGGERED");

            setEnergy(0);
            setSnap(true);

            setTimeout(() => setSnap(false), 2500);
        });

        return () => {
            socket.off("jarvis_speaking");
            socket.off("jarvis_finished");
            socket.off("thanos_snap");
        };
    }, [setEnergy]);

    return (
        <div className={`hud ${snap ? "snap" : ""}`}>
            {/* ================= PARTICLES ================= */}
            {snap &&
                particles.current.map((p, i) => (
                    <div
                        key={i}
                        className="dust"
                        style={{
                            "--x": `${p.x}px`,
                            "--y": `${p.y}px`,
                            opacity: p.life,
                        }}
                    />
                ))}

            {/* ================= ARC REACTOR ================= */}
            <div className={`reactor ${snap ? "snap" : ""}`}>
                <img src={reactorImg} className="reactor-img" alt="reactor" />
                <div className="reactor-glow" />

                {snap && <div className="snap-wave" />}
            </div>
        </div>
    );
}