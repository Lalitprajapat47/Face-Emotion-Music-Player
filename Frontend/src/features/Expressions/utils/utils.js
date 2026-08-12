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
            // attempt to play, then wait for metadata/playing to ensure dimensions are available
            await videoRef.current.play();

            // helper to wait until video has non-zero dimensions
            const waitForDimensions = () => new Promise((resolve, reject) => {
                const v = videoRef.current;
                if (!v) return reject(new Error('no-video-element'));

                const cleanup = () => {
                    v.removeEventListener('loadedmetadata', onReady);
                    v.removeEventListener('playing', onReady);
                };

                function onReady() {
                    if ((v.videoWidth || v.clientWidth) > 0 && (v.videoHeight || v.clientHeight) > 0) {
                        cleanup();
                        resolve(true);
                    }
                }

                // immediate check
                if ((v.videoWidth || v.clientWidth) > 0 && (v.videoHeight || v.clientHeight) > 0) {
                    resolve(true);
                    return;
                }

                v.addEventListener('loadedmetadata', onReady);
                v.addEventListener('playing', onReady);

                // timeout after 3s
                const t = setTimeout(() => {
                    cleanup();
                    reject(new Error('video-dim-timeout'));
                }, 3000);

            });

            await waitForDimensions();
            status.videoPlaying = true;
        } catch (err) {
            console.warn("video play interrupted or dimensions missing:", err);
            status.videoPlaying = false;
            status.error = { type: 'video-play', message: err.message || String(err) };
        }

        // only mark ok when we have model, camera and playing video
        status.ok = Boolean(status.modelLoaded && status.cameraEnabled && status.videoPlaying);
        return status;
    } catch (e) {
        console.error("init failed:", e);
        status.error = { type: 'init', message: e.message || String(e) };
        return status;
    }
};

let _lastDetectError = 0;
export const detect = ({ landmarkerRef, videoRef, setExpression }) => {
    if (!landmarkerRef.current || !videoRef.current) return;

    // ensure video frame available and dimensions are > 0
    const v = videoRef.current;
    if (typeof v.readyState === 'number' && v.readyState < 2) return; // HAVE_CURRENT_DATA
    const width = v.videoWidth || v.clientWidth || 0;
    const height = v.videoHeight || v.clientHeight || 0;
    // require a minimum frame size to avoid ROI==0 errors
    if (width < 20 || height < 20) return;

    try {
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

            let currentExpression = "Neutral";

            if (smileLeft > 0.5 && smileRight > 0.5) {
                currentExpression = "happy";
            } else if (jawOpen > 0.2 && browUp > 0.2) {
                currentExpression = "surprised";
            } else if (frownLeft > 0.0001 && frownRight > 0.0001) {
                currentExpression = "sad";
            }

            setExpression(currentExpression);
            return currentExpression;
        }
    } catch (err) {
        // throttle error logging to avoid console spam
        const now = Date.now();
        if (now - _lastDetectError > 5000) {
            console.warn('detect loop error', err);
            _lastDetectError = now;
        }
        return;
    }
};