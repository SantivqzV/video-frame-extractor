async function extractFrames(interval, totalFrames) {
  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a video file');
    console.log('No file selected');
    return null;
  }

  console.log('File selected:', file.name);

  const videoTitle = file.name.split('.').slice(0, -1).join('.'); // Extract the title from the file name

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await new Promise(resolve => video.onloadedmetadata = resolve);
  console.log('Video metadata loaded');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const frames = [];
  for (let i = 0; i < totalFrames; i++) {
    const currentTime = i * interval;
    video.currentTime = currentTime;
    await new Promise(resolve => video.onseeked = resolve);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    const base64Data = dataUrl.split(',')[1];
    frames.push({ index: i, base64Data });
    console.log(`Frame ${i} captured`);
  }

  URL.revokeObjectURL(video.src);
  console.log('Frame extraction completed');
  return { frames, videoTitle };
}

async function downloadAllFrames() {
  console.log('Starting download of all frames...');
  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a video file');
    console.log('No file selected');
    return;
  }

  const videoTitle = file.name.split('.').slice(0, -1).join('.'); // Extract the title from the file name

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await new Promise(resolve => video.onloadedmetadata = resolve);
  const interval = 1; // Extract one frame every second
  const totalFrames = Math.floor(video.duration / interval);
  const { frames } = await extractFrames(interval, totalFrames);

  if (frames) {
    const zip = new JSZip();
    const frameProgress = document.getElementById('frameProgress');

    frames.forEach((frame, index) => {
      zip.file(`${videoTitle}_frame${frame.index}.jpg`, frame.base64Data, { base64: true });
      frameProgress.value = ((index + 1) / totalFrames) * 100;
      console.log(`Added frame ${frame.index} to zip`);
    });

    console.log('Generating zip file...');
    zip.generateAsync({ type: 'blob' }).then(content => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${videoTitle}_frames.zip`;
      link.click();
      console.log('Zip file generated and download triggered');
    }).catch(error => {
      console.error('Error generating zip file:', error);
    });
  } else {
    console.log('No frames extracted');
  }
}
async function download30Frames() {
  console.log('Starting download of 30 frames...');
  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];
  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await new Promise(resolve => video.onloadedmetadata = resolve);
  const interval = video.duration / 30; // Interval to get 30 frames
  const { frames, videoTitle } = await extractFrames(interval, 30);

  const thirtyFrameProgress = document.getElementById('thirtyFrameProgress');

  if (frames) {
    const zip = new JSZip();
    frames.forEach((frame, index) => {
      zip.file(`${videoTitle}_frame${frame.index}.jpg`, frame.base64Data, { base64: true });
      thirtyFrameProgress.value = ((index + 1) / 30) * 100;
    });

    console.log('Generating zip file...');
    zip.generateAsync({ type: 'blob' }).then(content => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${videoTitle}_30frames.zip`;
      link.click();
      console.log('Zip file generated and download triggered');
    });
  }
}

async function downloadGIF() {
  console.log('Starting GIF generation...');
  const interval = 1; // Extract one frame every second
  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a video file');
    console.log('No file selected');
    return;
  }

  const videoTitle = file.name.split('.').slice(0, -1).join('.'); // Extract the title from the file name

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await new Promise(resolve => video.onloadedmetadata = resolve);
  const totalFrames = Math.floor(video.duration / interval);
  const { frames } = await extractFrames(interval, totalFrames);

  if (frames) {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: 'gif.worker.js' // Reference the local worker script
    });

    const addFramePromises = frames.map(frame => {
      return new Promise(resolve => {
        const img = new Image();
        img.src = `data:image/jpeg;base64,${frame.base64Data}`;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          gif.addFrame(ctx.getImageData(0, 0, canvas.width, canvas.height), { copy: true, delay: 1000 / 30 });
          resolve();
        };
      });
    });

    await Promise.all(addFramePromises);

    gif.on('progress', function(p) {
      const gifProgress = document.getElementById('gifProgress');
      gifProgress.value = p * 100;
    });

    gif.on('finished', function(blob) {
      console.log('GIF rendering finished');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${videoTitle}.gif`;
      link.click();
      console.log('GIF generated and download triggered');
    });

    console.log('Rendering GIF...');
    gif.render();
  }
}