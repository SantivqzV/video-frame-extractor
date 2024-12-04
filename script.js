async function processVideo() {
  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];
  if (!file) {
      alert('Please select a video file');
      return;
  }

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await video.load();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const zip = new JSZip();
  const fps = 30; // Assuming 30 fps, adjust as needed
  const interval = 1; // Extract one frame every second

  for (let i = 0; i < video.duration; i += interval) {
      video.currentTime = i;
      await new Promise(resolve => video.oncanplay = resolve);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const frameName = `frame_${String(Math.round(i * fps)).padStart(6, '0')}.jpg`;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      zip.file(frameName, blob);
  }

  const content = await zip.generateAsync({type: 'blob'});
  saveAs(content, 'video_frames.zip');
}