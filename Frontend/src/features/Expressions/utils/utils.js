import {
    FaceLandmarker,
    FilesetResolver,
} from "@mediapipe/tasks-vision";

export const init = async ({
    videoRef,
    landmarkerRef,
    streamRef,
    animationRef,
    setExpression,
}) => {
    try {
        // Load WASM
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        // Load model
        landmarkerRef.current =
            await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
                },
                runningMode: "VIDEO",
                outputFaceBlendshapes: true,
                numFaces: 1,
            });

        // Start camera
        streamRef.current =
            await navigator.mediaDevices.getUserMedia({
                video: true,
            });

        if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            await videoRef.current.play();
        }

        // Start detection loop
        detect({
            videoRef,
            landmarkerRef,
            animationRef,
            setExpression,
        });
    } catch (err) {
        console.error("Initialization Error:", err);
    }
};

export const detect = ({
    videoRef,
    landmarkerRef,
    animationRef,
    setExpression,
}) => {
    if (
        !landmarkerRef.current ||
        !videoRef.current ||
        videoRef.current.readyState < 2
    ) {
        animationRef.current = requestAnimationFrame(() =>
            detect({
                videoRef,
                landmarkerRef,
                animationRef,
                setExpression,
            })
        );

        return;
    }

    const results = landmarkerRef.current.detectForVideo(
        videoRef.current,
        performance.now()
    );

    if (results.faceBlendshapes?.length > 0) {
        const blendshapes =
            results.faceBlendshapes[0].categories;

        const getScore = (name) =>
            blendshapes.find(
                (b) => b.categoryName === name
            )?.score || 0;

        const smileLeft = getScore("mouthSmileLeft");
        const smileRight = getScore("mouthSmileRight");

        const jawOpen = getScore("jawOpen");
        const browUp = getScore("browInnerUp");

        const frownLeft = getScore("mouthFrownLeft");
        const frownRight = getScore("mouthFrownRight");

        let currentExpression = "😐 Neutral";

        if (smileLeft > 0.5 && smileRight > 0.5) {
            currentExpression = "happy";
        } else if (jawOpen > 0.1 && browUp > 0.1) {
            currentExpression = "surprised";
        } else if (frownLeft > 0.0001 && frownRight > 0.0001) {
            currentExpression = "sad";
        }

        setExpression(currentExpression);
    } else {
        setExpression("No Face Detected");
    }

    animationRef.current = requestAnimationFrame(() =>
        detect({
            videoRef,
            landmarkerRef,
            animationRef,
            setExpression,
        })
    );
};