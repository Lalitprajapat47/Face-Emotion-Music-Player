import { useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";
import "../style/face-expression.scss";


export default function FaceExpression({ onClick = () => { } }) {
    const videoRef = useRef(null);
    const landmarkerRef = useRef(null);
    const streamRef = useRef(null);

    const [expression, setExpression] = useState("Detecting...");
    const [badgePulse, setBadgePulse] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        init({ landmarkerRef, videoRef, streamRef });

        // trigger entrance animation
        setMounted(true);

        return () => {
            if (landmarkerRef.current) {
                landmarkerRef.current.close();
            }

            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, []);

    async function handleClick() {
        const expression = detect({ landmarkerRef, videoRef, setExpression });

            // pulse badge on expression change
            useEffect(() => {
                if (!expression) return;
                setBadgePulse(true);
                const t = setTimeout(() => setBadgePulse(false), 650);
                return () => clearTimeout(t);
            }, [expression]);
        onClick(expression);
    }

    return (
        <section className={`expression-hero-wrap ${mounted ? 'mounted' : ''}`}>
            <nav className="ef-nav">
                <div className="brand">Moodify</div>
                <div className="nav-actions">
                    <button className="nav-btn">Sign up</button>
                </div>
            </nav>

            <div className="hero-spot">
                <div className="hero-content">
                    <div className="hero-text">
                        <h2>Detect expression</h2>
                        <p className="lead">Realtime face expression detection powered by MediaPipe — try it now.</p>
                    </div>

                    <div className="expression-card">
                        <div className="video-wrap">
                            <video ref={videoRef} className="video-element" playsInline />
                            <div className={`expression-badge ${badgePulse ? 'pulse' : ''}`} aria-live="polite">{expression}</div>
                        </div>

                        <div className="controls">
                            <button className="btn-primary" onClick={handleClick}>Detect expression</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="decor-grid" aria-hidden="true" />
        </section>
    );
}