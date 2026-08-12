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
    const [initStatus, setInitStatus] = useState(null);

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

    async function handleInitRetry() {
        setExpression("Retrying camera/model...");
        const status = await init({ landmarkerRef, videoRef, streamRef });
        setInitStatus(status);
        if (!status.ok) setExpression(status.error?.message || "Initialization failed");
    }

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

    return (
        <section className={`expression-hero-wrap ${mounted ? 'mounted' : ''}`}>
            <nav className="ef-nav">
                <div className="brand">Moodify</div>
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

            {/* Debug/status box */}
            <div className="debug-box" aria-live="polite">
                <div>Init: {initStatus ? String(initStatus.ok) : 'starting...'}</div>
                <div>Model: {initStatus ? String(initStatus.modelLoaded) : '...'}</div>
                <div>Camera: {initStatus ? String(initStatus.cameraEnabled) : '...'}</div>
                <div>VideoPlaying: {initStatus ? String(initStatus.videoPlaying) : '...'}</div>
                <div className="debug-error">{initStatus && initStatus.error ? initStatus.error.type + ': ' + initStatus.error.message : ''}</div>
                <div style={{ marginTop: 8 }}>
                    <button className="btn-primary" onClick={handleInitRetry}>Retry camera</button>
                </div>
            </div>

            <div className="decor-grid" aria-hidden="true" />
        </section>
    );
}