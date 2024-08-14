"use client";
import React from "react";
import useWebcam from "@/hooks/useWebcam";

const App: React.FC = () => {
  const { canvasRef, videoRef, openWebcam, takePhoto } = useWebcam();

  return (
    <main className="flex flex-col items-center justify-center gap-10 size-full">
      <div>
        <button
          onClick={openWebcam}
          className="border border-black rounded-xl p-2"
        >
          Abrir camara
        </button>
        <button
          onClick={takePhoto}
          className="border border-black rounded-xl p-2 ml-2"
        >
          Tomar foto
        </button>
      </div>
      <section className="flex flex-wrap justify-center gap-2 max-w-full">
        <video ref={videoRef} autoPlay />
        <canvas ref={canvasRef} className="max-w-full" />
      </section>
    </main>
  );
};
export default App;
