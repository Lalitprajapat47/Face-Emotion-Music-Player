 import {
     FaceLandmarker,
     FilesetResolver,
 } from "@mediapipe/tasks-vision";
 
 const init = async () => {
        try {
            // Load MediaPipe WASM
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            // Load Face Landmarker Model
            landmarkerRef.current = await FaceLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1,
                }
            );

            // Start Camera
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            detect();
        } catch (error) {
            console.error("Initialization Error:", error);
        }
    };

    const detect = () => {
        if (
            !landmarkerRef.current ||
            !videoRef.current ||
            videoRef.current.readyState < 2
        ) {
            animationRef.current = requestAnimationFrame(detect);
            return;
        }

        const results = landmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
        );

        if (results.faceBlendshapes?.length > 0) {
            const blendshapes = results.faceBlendshapes[0].categories;

            const getScore = (name) =>
                blendshapes.find((b) => b.categoryName === name)?.score || 0;

            const smileLeft = getScore("mouthSmileLeft");
            const smileRight = getScore("mouthSmileRight");

            const jawOpen = getScore("jawOpen");
            const browUp = getScore("browInnerUp");

            const frownLeft = getScore("mouthFrownLeft");
            const frownRight = getScore("mouthFrownRight");

            let currentExpression = "😐 Neutral";

            if (smileLeft > 0.5 && smileRight > 0.5) {
                currentExpression = "😄 Happy";
            } else if (jawOpen > 0.2 && browUp > 0.2) {
                currentExpression = "😲 Surprised";
            } else if (frownLeft > 0.0001 && frownRight > 0.0001) {
                currentExpression = "😢 Sad";
            }

            setExpression(currentExpression);
        } else {
            setExpression("No Face Detected");
        }

        animationRef.current = requestAnimationFrame(detect);
    };