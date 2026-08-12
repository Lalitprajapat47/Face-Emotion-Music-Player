import {
    FaceLandmarker,
    FilesetResolver
} from "@mediapipe/tasks-vision";


export const init = async ({ landmarkerRef, videoRef, streamRef }) => {
    const status = {
        ok: false,
        modelLoaded: false,
        cameraEnabled: false,
        videoPlaying: false,
        error: null,
    };

    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        landmarkerRef.current = await FaceLandmarker.createFromOptions(
            vision,
            {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1
            }
        );
        status.modelLoaded = true;

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
            status.cameraEnabled = true;
        } catch (err) {
            console.error("getUserMedia failed:", err);
            status.error = { type: 'camera', message: err.message || String(err) };
            return status;
        }

        if (!videoRef.current) {
            status.error = { type: 'video-element', message: 'video element missing' };
            return status;
        }

        videoRef.current.srcObject = streamRef.current;
        try {
            await videoRef.current.play();
            status.videoPlaying = true;
        } catch (err) {
            console.warn("video play interrupted:", err);
            status.videoPlaying = false;
            status.error = { type: 'video-play', message: err.message || String(err) };
        }

        status.ok = true;
        return status;
    } catch (e) {
        console.error("init failed:", e);
        status.error = { type: 'init', message: e.message || String(e) };
        return status;
    }
};

export const detect = ({ landmarkerRef, videoRef, setExpression }) => {
    if (!landmarkerRef.current || !videoRef.current) return;

    const results = landmarkerRef.current.detectForVideo(
        videoRef.current,
        performance.now()
    );

    if (results.faceBlendshapes?.length > 0) {
        const blendshapes = results.faceBlendshapes[ 0 ].categories;

        const getScore = (name) =>
            blendshapes.find((b) => b.categoryName === name)?.score || 0;

        const smileLeft = getScore("mouthSmileLeft");
        const smileRight = getScore("mouthSmileRight");
        const jawOpen = getScore("jawOpen");
        const browUp = getScore("browInnerUp");
        const frownLeft = getScore("mouthFrownLeft");
        const frownRight = getScore("mouthFrownRight");

        console.log(getScore("mouthFrownLeft"))

        let currentExpression = "Neutral";

        if (smileLeft > 0.5 && smileRight > 0.5) {
            currentExpression = "happy";
        } else if (jawOpen > 0.2 && browUp > 0.2) {
            currentExpression = "surprised";
        } else if (frownLeft > 0.0001 && frownRight > 0.0001) {
            currentExpression = "sad";
        }

        setExpression(currentExpression);

        return currentExpression
    }
};