"use client";
import React, { useRef } from "react";
const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const openWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam: ", err);
    }
  };
  const takePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL("image/png");
        console.log(image);
      } else {
        console.error("No se pudo obtener el contexto 2D del canvas.");
      }
    } else {
      console.error("Canvas o video no están definidos.");
    }
  };
  return (
    <main
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div>
        <button onClick={openWebcam}>Abrir camara</button>
        <button onClick={takePhoto} style={{ marginLeft: "10px" }}>
          Tomar foto
        </button>
      </div>
      <section style={{ display: "flex", gap: "10px" }}>
        <video ref={videoRef} autoPlay />
        <canvas ref={canvasRef} width={640} height={480} />
      </section>
    </main>
  );
};
export default App;
