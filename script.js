async function processVideo() {
  console.log('Starting video processing...');
  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a video file');
    console.log('No file selected');
    return;
  }

  console.log('File selected:', file.name);

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await new Promise(resolve => video.onloadedmetadata = resolve);
  console.log('Video metadata loaded');

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
    gif.addFrame(ctx.getImageData(0, 0, canvas.width, canvas.height), { copy: true, delay: 1000 / fps });
    console.log(`Frame ${i} captured and added to zip and gif`);
  }

  console.log('Generating zip file...');
  zip.generateAsync({ type: 'blob' }).then(content => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'frames.zip';
    link.click();
    console.log('Zip file generated and download triggered');
  });

  gif.on('finished', function(blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'frames.gif';
    link.click();
    console.log('GIF generated and download triggered');
  });

  console.log('Rendering GIF...');
  gif.render();

  URL.revokeObjectURL(video.src);
  console.log('Video processing completed');
}