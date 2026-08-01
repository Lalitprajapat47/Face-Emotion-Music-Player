import { useEffect, useRef, useState } from "react";

export default function FaceExpression() {
    const videoRef = useRef(null);
    const landmarkerRef = useRef(null);
    const animationRef = useRef(null);
    let stream;

    const [expression, setExpression] = useState("Detecting...");
    
    useEffect(() => {
        let stream;



        init();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            if (landmarkerRef.current) {
                landmarkerRef.current.close();
            }

            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                    width: "450px",
                    borderRadius: "12px",
                    border: "2px solid #ccc",
                }}
            />

            <h2>{expression}</h2>
            <button onClick={detect} >Detect Expression</button>
        </div>
    );
}