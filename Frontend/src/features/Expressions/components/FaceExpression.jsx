import { useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";
import "../style/face-expression.scss";


export default function FaceExpression({ onClick = () => { } }) {
    const videoRef = useRef(null);
    const landmarkerRef = useRef(null);
    const streamRef = useRef(null);

    const [expression, setExpression] = useState("Detecting...");

    useEffect(() => {
        init({ landmarkerRef, videoRef, streamRef });

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
        onClick(expression);
    }

    return (
        <div className="expression-page">
            <div className="expression-card">
                <div className="expression-hero">
                    <h1>Detecting...</h1>
                    <p className="muted">Point your camera to your face and press the button</p>
                </div>

                <div className="expression-content">
                    <div className="video-wrap">
                        <video ref={videoRef} className="video-element" playsInline />
                        <div className="expression-badge">{expression}</div>
                    </div>

                    <div className="controls">
                        <button className="btn-primary" onClick={handleClick}>Detect expression</button>
                    </div>
                </div>
            </div>
        </div>
    );
}