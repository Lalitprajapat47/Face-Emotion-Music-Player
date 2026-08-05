import { useEffect, useRef, useState } from "react";
import { init } from "../utils/utils";

export default function FaceExpression() {
    const videoRef = useRef(null);
    const landmarkerRef = useRef(null);
    const streamRef = useRef(null);

    const [expression, setExpression] = useState("Detecting...");

    useEffect(() => {
        init({
            videoRef,
            landmarkerRef,
            streamRef,
            setExpression,
        });

        return () => {

            if (landmarkerRef.current) {
                landmarkerRef.current.close();
            }

            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
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
        </div>
    );
}