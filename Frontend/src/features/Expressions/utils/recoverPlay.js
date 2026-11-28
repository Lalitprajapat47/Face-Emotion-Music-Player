// React StrictMode (development only) starts the camera twice in a row. The two
// start-ups race for the same <video>, and the loser's play() is rejected with
// "The play() request was interrupted by a new load request" — even though the
// camera and the model are fine. init() then reports the camera as failed and
// the "Make my mix" button stays disabled.
//
// If that is the ONLY thing wrong (model loaded, camera open, play interrupted),
// just play again. Anything else is returned untouched, and the input is never
// modified.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitUntil(check, timeoutMs, stepMs = 50) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (check()) return true
    await sleep(stepMs)
  }
  return check()
}

export async function recoverFromInterruptedPlay(
  status,
  video,
  { tries = 3, waitMs = 150, dimensionsTimeoutMs = 1500 } = {}
) {
  const recoverable =
    status &&
    !status.ok &&
    status.error?.type === 'video-play' &&
    status.modelLoaded &&
    status.cameraEnabled

  if (!recoverable || !video || !video.srcObject) return status

  for (let i = 0; i < tries; i++) {
    await sleep(waitMs)
    try {
      await video.play()
      if (await waitUntil(() => video.videoWidth > 0, dimensionsTimeoutMs)) {
        return { ...status, videoPlaying: true, ok: true, error: null }
      }
    } catch {
      /* interrupted again — try once more */
    }
  }
  return status
}