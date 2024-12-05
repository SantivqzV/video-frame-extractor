async function processVideo() {
  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a video file');
    return;
  }

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await new Promise(resolve => video.onloadedmetadata = resolve);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const zip = new JSZip();

  const gif = new GIF({
    workers: 2,
    quality: 10
  });

  const fps = 30; // Assuming 30 fps, adjust as needed
  const interval = 1; // Extract one frame every second

  for (let i = 0; i < video.duration; i += interval) {
    video.currentTime = i;
    await new Promise(resolve => video.onseeked = resolve);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    const base64Data = dataUrl.split(',')[1];
    zip.file(`frame${i}.jpg`, base64Data, { base64: true });
  }

  zip.generateAsync({ type: 'blob' }).then(content => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'frames.zip';
    link.click();
  });

  gif.on('finished', function(blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'frames.gif';
    link.click();
  });

  gif.render();

  URL.revokeObjectURL(video.src);
}