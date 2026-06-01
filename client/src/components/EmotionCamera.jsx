import "@tensorflow/tfjs";
import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";

const MODEL_URL =
  import.meta.env.VITE_FACE_API_MODEL_URL ||
  "https://justadudewhohacks.github.io/face-api.js/models";

const EMOTION_LABELS = {
  happy: "Happy",
  neutral: "Neutral",
  sad: "Sad",
  angry: "Angry",
  surprised: "Surprised",
};

const EMPTY_METRICS = {
  confidenceScore: 0,
  eyeContactScore: 0,
  faceVisibilityScore: 0,
  emotion: "Unknown",
};

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

const getDominantEmotion = (expressions = {}) => {
  const allowed = ["happy", "neutral", "sad", "angry", "surprised"];
  const [emotion = "neutral"] = allowed.reduce(
    (best, current) =>
      (expressions[current] || 0) > best[1] ? [current, expressions[current]] : best,
    ["neutral", 0]
  );

  return EMOTION_LABELS[emotion] || "Neutral";
};

const calculateEyeContact = (detection) => {
  const box = detection?.detection?.box;
  const landmarks = detection?.landmarks;

  if (!box || !landmarks) {
    return 0;
  }

  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const eyePoints = [...leftEye, ...rightEye];

  if (!eyePoints.length || !nose.length) {
    return 0;
  }

  const eyeCenterX =
    eyePoints.reduce((sum, point) => sum + point.x, 0) / eyePoints.length;
  const noseCenterX = nose.reduce((sum, point) => sum + point.x, 0) / nose.length;
  const offsetRatio = Math.abs(eyeCenterX - noseCenterX) / Math.max(box.width, 1);

  return clamp(100 - offsetRatio * 420);
};

const calculateConfidence = ({ emotion, eyeContactScore, faceVisibilityScore }) => {
  const emotionBoost = {
    Happy: 16,
    Neutral: 10,
    Surprised: 4,
    Sad: -8,
    Angry: -10,
    Unknown: -16,
  };

  return clamp(
    faceVisibilityScore * 0.35 +
      eyeContactScore * 0.45 +
      35 +
      (emotionBoost[emotion] || 0)
  );
};

const average = (items, key) => {
  if (!items.length) return 0;
  return clamp(items.reduce((sum, item) => sum + item[key], 0) / items.length);
};

const getMostCommonEmotion = (items) => {
  if (!items.length) return "Unknown";

  const counts = items.reduce((acc, item) => {
    acc[item.emotion] = (acc[item.emotion] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
};

function EmotionCamera({ onMetricsChange }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const samplesRef = useRef([]);
  const onMetricsChangeRef = useRef(onMetricsChange);

  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [status, setStatus] = useState("Starting camera");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    onMetricsChangeRef.current = onMetricsChange;
  }, [onMetricsChange]);

  useEffect(() => {
    if (!cameraEnabled) {
      onMetricsChangeRef.current?.(metrics);
    }
  }, [cameraEnabled, metrics]);

  useEffect(() => {
    let cancelled = false;

    const stopCamera = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const publishMetrics = (nextMetrics) => {
      samplesRef.current = [...samplesRef.current.slice(-89), nextMetrics];

      const finalMetrics = {
        confidenceScore: average(samplesRef.current, "confidenceScore"),
        eyeContactScore: average(samplesRef.current, "eyeContactScore"),
        faceVisibilityScore: average(samplesRef.current, "faceVisibilityScore"),
        emotion: getMostCommonEmotion(samplesRef.current),
      };

      setMetrics(finalMetrics);
      onMetricsChangeRef.current?.(finalMetrics);
    };

    const startCamera = async () => {
      if (!cameraEnabled) {
        stopCamera();
        setStatus("Camera paused");
        return;
      }

      try {
        setCameraError("");
        setStatus("Loading face models");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        if (cancelled) return;

        setStatus("Requesting camera access");

        const existingDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = existingDevices.filter((device) => device.kind === "videoinput");
        const preferredDevice =
          selectedDeviceId ||
          videoDevices.find((device) => !/phone|link|virtual|obs/i.test(device.label))?.deviceId ||
          videoDevices[0]?.deviceId ||
          "";

        const stream = await navigator.mediaDevices.getUserMedia({
          video: preferredDevice
            ? {
                deviceId: { exact: preferredDevice },
                width: { ideal: 640 },
                height: { ideal: 480 },
              }
            : {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const updatedDevices = await navigator.mediaDevices.enumerateDevices();
        const updatedVideoDevices = updatedDevices.filter((device) => device.kind === "videoinput");
        const activeDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId || preferredDevice;

        setDevices(updatedVideoDevices);
        setSelectedDeviceId(activeDeviceId);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("Analyzing face");

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            return;
          }

          const detection = await faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.45,
              })
            )
            .withFaceLandmarks(true)
            .withFaceExpressions();

          if (!detection) {
            publishMetrics({
              confidenceScore: 0,
              eyeContactScore: 0,
              faceVisibilityScore: 0,
              emotion: "Unknown",
            });
            setStatus("Face not visible");
            return;
          }

          const emotion = getDominantEmotion(detection.expressions);
          const faceVisibilityScore = clamp(detection.detection.score * 100);
          const eyeContactScore = calculateEyeContact(detection);
          const confidenceScore = calculateConfidence({
            emotion,
            eyeContactScore,
            faceVisibilityScore,
          });

          publishMetrics({
            confidenceScore,
            eyeContactScore,
            faceVisibilityScore,
            emotion,
          });
          setStatus("Live analysis active");
        }, 1200);
      } catch (error) {
        console.error(error);
        const message =
          error.name === "NotAllowedError"
            ? "Camera permission blocked"
            : error.name === "NotFoundError"
            ? "No camera found"
            : error.name === "NotReadableError"
            ? "Camera is already in use"
            : "Camera unavailable";

        setStatus(message);
        setCameraError(
          `${message}. Choose another camera, close other camera apps, or allow camera permission in the browser.`
        );
        publishMetrics(EMPTY_METRICS);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraEnabled, selectedDeviceId]);

  const indicatorColor =
    metrics.faceVisibilityScore < 30
      ? "#f87171"
      : metrics.confidenceScore >= 70
      ? "#22c55e"
      : metrics.confidenceScore >= 45
      ? "#f59e0b"
      : "#fb7185";

  return (
    <div
      style={{
        marginTop: "22px",
        padding: "18px",
        borderRadius: "24px",
        background: "rgba(15, 23, 42, 0.72)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#7dd3fc",
              fontSize: "12px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Emotion Detection
          </p>
          <p style={{ margin: "6px 0 0", color: "#e2e8f0", fontWeight: 800 }}>
            {status}
          </p>
        </div>

        <button
          onClick={() => setCameraEnabled((enabled) => !enabled)}
          style={{
            padding: "10px 14px",
            borderRadius: "999px",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            background: cameraEnabled
              ? "rgba(14, 165, 233, 0.16)"
              : "rgba(127, 29, 29, 0.28)",
            color: cameraEnabled ? "#bae6fd" : "#fecaca",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {cameraEnabled ? "Pause Camera" : "Start Camera"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        <select
          value={selectedDeviceId}
          onChange={(event) => {
            setSelectedDeviceId(event.target.value);
            setCameraEnabled(true);
          }}
          style={{
            flex: "1 1 220px",
            padding: "10px 12px",
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(2, 6, 23, 0.74)",
            color: "#cbd5e1",
            outline: "none",
          }}
        >
          <option value="">Auto select camera</option>
          {devices.map((device, index) => (
            <option key={device.deviceId || index} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            samplesRef.current = [];
            setMetrics(EMPTY_METRICS);
            setCameraEnabled(false);
            window.setTimeout(() => setCameraEnabled(true), 120);
          }}
          style={{
            padding: "10px 14px",
            borderRadius: "999px",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            background: "rgba(34, 197, 94, 0.12)",
            color: "#bbf7d0",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Retry Camera
        </button>
      </div>

      {cameraError && (
        <div
          style={{
            marginBottom: "14px",
            padding: "12px 14px",
            borderRadius: "16px",
            background: "rgba(127, 29, 29, 0.24)",
            border: "1px solid rgba(248, 113, 113, 0.24)",
            color: "#fecaca",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          {cameraError}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: "172px",
            overflow: "hidden",
            borderRadius: "20px",
            background: "rgba(2, 6, 23, 0.88)",
            border: `1px solid ${indicatorColor}55`,
          }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              minHeight: "172px",
              objectFit: "cover",
              transform: "scaleX(-1)",
              opacity: cameraEnabled ? 1 : 0.35,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "12px",
              bottom: "12px",
              padding: "8px 10px",
              borderRadius: "999px",
              background: "rgba(2, 6, 23, 0.78)",
              border: `1px solid ${indicatorColor}55`,
              color: "#f8fafc",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            {metrics.emotion}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px",
          }}
        >
          <MetricCard
            label="Confidence"
            value={metrics.confidenceScore}
            color={indicatorColor}
          />
          <MetricCard
            label="Eye Contact"
            value={metrics.eyeContactScore}
            color="#38bdf8"
          />
          <MetricCard
            label="Face Visible"
            value={metrics.faceVisibilityScore}
            color="#22c55e"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "18px",
        background: "rgba(2, 6, 23, 0.58)",
        border: `1px solid ${color}33`,
      }}
    >
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>{label}</p>
      <p style={{ margin: "8px 0 10px", color: "#f8fafc", fontSize: "26px", fontWeight: 900 }}>
        {value}
        <span style={{ fontSize: "12px", color: "#cbd5e1" }}>/100</span>
      </p>
      <div
        style={{
          height: "7px",
          borderRadius: "999px",
          overflow: "hidden",
          background: "rgba(15, 23, 42, 0.95)",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            borderRadius: "999px",
            background: color,
            transition: "width 300ms ease",
          }}
        />
      </div>
    </div>
  );
}

export default EmotionCamera;
