import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:5000", {
    transports: ["websocket"],
});

/* ================= ENERGY ================= */
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

/* ================= HUD ================= */
export default function HUD() {
    const { energy, setEnergy } = useEnergy();
    const [snap, setSnap] = useState(false);
    const [dust, setDust] = useState([]);

    /* ================= SNAP PARTICLES (CSS DUST) ================= */
    useEffect(() => {
        if (!snap) return;

        const particles = Array.from({ length: 180 }).map(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 220;

            return {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
            };
        });

        setDust(particles);

        const t = setTimeout(() => {
            setDust([]);
        }, 1200);

        return () => clearTimeout(t);
    }, [snap]);

    /* ================= SOCKET ================= */
    useEffect(() => {
        const onSpeak = () => setEnergy(1);
        const onStop = () => setEnergy(0);

        const onSnap = () => {
            console.log("💥 SNAP TRIGGERED");

            setEnergy(0);
            setSnap(true);

            setTimeout(() => setSnap(false), 2500);
        };

        socket.on("jarvis_speaking", onSpeak);
        socket.on("jarvis_finished", onStop);
        socket.on("thanos_snap", onSnap);

        return () => {
            socket.off("jarvis_speaking", onSpeak);
            socket.off("jarvis_finished", onStop);
            socket.off("thanos_snap", onSnap);
        };
    }, [setEnergy]);

    return (
        <div className={`hud ${snap ? "snap" : ""}`}>

            {/* ================= ARC REACTOR ================= */}
            <div className={`reactor ${snap ? "snap" : ""}`}>
                <div className="outer" />
                <div className="inner" />
                <div className="core" />
                <div className="glow" />
            </div>

            {/* ================= SNAP DUST ================= */}
            {snap &&
                dust.map((p, i) => (
                    <div
                        key={i}
                        className="dust"
                        style={{
                            "--x": `${p.x}px`,
                            "--y": `${p.y}px`,
                        }}
                    />
                ))}

            {/* ================= SNAP WAVE ================= */}
            {snap && <div className="snap-wave" />}
        </div>
    );
}