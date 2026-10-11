import "../style/sensor.scss";

/**
 * The camera view. One instance lives for the whole page: it is a big
 * viewfinder on the "look at the camera" screen and shrinks into a small
 * FaceTime-style window once the mix is made (CSS + view-transition does the
 * morph), so the <video> element is never remounted.
 */
export default function Sensor({ sensor, variant = "hero" }) {
  const { videoRef, frameRef, isLive, error, turnFlash, headEnabled } = sensor;
  const showCues = variant === "pip" && headEnabled;

  return (
    <div
      ref={frameRef}
      className={`sensor sensor--${variant} ${isLive ? "is-live" : ""} ${showCues ? "has-head-cues" : ""}`}
    >
      <video ref={videoRef} className="sensor__video" playsInline autoPlay muted />

      {!isLive && (
        <div className="sensor__status" role="status">
          {error || "Starting camera…"}
        </div>
      )}

      <span
        className={`sensor__cue sensor__cue--prev ${turnFlash === "prev" ? "flash" : ""}`}
        aria-hidden="true"
      >‹</span>
      <span
        className={`sensor__cue sensor__cue--next ${turnFlash === "next" ? "flash" : ""}`}
        aria-hidden="true"
      >›</span>
    </div>
  );
}