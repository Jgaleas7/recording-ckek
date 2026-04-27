import React, { useRef, useState } from 'react';

const ScreenShareRecorder = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Asignar el stream al video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Preparar grabación
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error capturing screen:', error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    videoRef.current?.srcObject?.getTracks().forEach(track => track.stop());
    setRecording(false);
  };

  // const downloadRecording = () => {
  //   const blob = new Blob(recordedChunks, { type: 'video/webm' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'grabacion-pantalla.webm';
  //   a.click();
  //   URL.revokeObjectURL(url);
  //   setRecordedChunks([]);
  // };

  return (
    <div style={{ padding: '1rem', maxWidth: '700px', margin: 'auto' }}>
      <video
        ref={videoRef}
        autoPlay
        controls
        style={{ width: '100%', border: '2px solid #ccc', borderRadius: '10px', marginBottom: '1rem' }}
      />
      <div style={{ display: 'flex', gap: '1rem' }}>
        {!recording && (
          <button onClick={startRecording} style={btnStyle}>
            cargar preview capturer
          </button>
        )}
        {recording && (
          <button onClick={stopRecording} style={btnStyle}>
            Detener preview
          </button>
        )}
        {/* {recordedChunks.length > 0 && (
          <button onClick={downloadRecording} style={btnStyle}>
            Descargar Grabación
          </button>
        )} */}
      </div>
    </div>
  );
};

const btnStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#4F46E5',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

export default ScreenShareRecorder;
