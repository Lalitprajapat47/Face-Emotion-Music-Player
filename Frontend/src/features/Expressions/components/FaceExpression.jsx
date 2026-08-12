import { useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";
import "../style/face-expression.scss";


export default function FaceExpression({ onClick = () => { }, compact = false }) {
    const videoRef = useRef(null);
    const landmarkerRef = useRef(null);
    const streamRef = useRef(null);

    const [expression, setExpression] = useState("Detecting...");
    const [badgePulse, setBadgePulse] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [initStatus, setInitStatus] = useState(null);
    const rafRef = useRef(null);

    useEffect(() => {
        let mountedFlag = true;

        (async () => {
            console.log("initializing face landmarker...");
            const status = await init({ landmarkerRef, videoRef, streamRef });
            console.log("init status:", status);
            if (mountedFlag) {
                setInitStatus(status);
                if (!status.ok) {
                    setExpression(status.error?.message || "Initialization failed");
                }
                setMounted(true);
            }
        })();

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

    // no manual retry UI — init runs automatically

    // start continuous detection loop when init OK
    useEffect(() => {
        let mounted = true;
        function frame() {
            try {
                detect({ landmarkerRef, videoRef, setExpression });
            } catch (e) {
                console.warn('detect loop error', e);
            }
            rafRef.current = requestAnimationFrame(frame);
        }

        if (initStatus?.ok && mounted) {
            // start loop
            rafRef.current = requestAnimationFrame(frame);
        }

        return () => {
            mounted = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [initStatus]);

    async function handleClick() {
        const expression = detect({ landmarkerRef, videoRef, setExpression });
        onClick(expression);
    }

    // pulse badge on expression change
    useEffect(() => {
        if (!expression) return;
        setBadgePulse(true);
        const t = setTimeout(() => setBadgePulse(false), 650);
        return () => clearTimeout(t);
    }, [expression]);

    // When `compact` is true we only render the card portion so the component
    // can be embedded inside other layouts (like Home) without duplicating
    // the page hero text or nav which was causing overlap.
    if (compact) {
        return (
            <div className={`expression-card-compact ${mounted ? 'mounted' : ''}`}>
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
        );
    }

    return (
        <section className={`expression-hero-wrap ${mounted ? 'mounted' : ''}`}>
            <nav className="ef-nav">
                <div className="brand">Moodify</div>
            </nav>

            <div className="hero-spot">
                <div className={`hero-content ${initStatus?.ok ? 'visible' : ''}`}>
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

            {/* debug UI removed */}

            <div className="decor-grid" aria-hidden="true" />
        </section>
    );
}