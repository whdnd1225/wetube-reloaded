const startBtn = document.getElementById('startBtn');
const video = document.getElementById('preview');

let stream;
let recoder;
let videoFile;

const handleDownload = () => {
  const a = document.createElement('a');
  a.href = videoFile;
  a.download = 'MyRecording.webm';
  document.body.appendChild(a);
  a.click();
};

const handleStop = () => {
  startBtn.innerText = 'Download Recording';
  startBtn.removeEventListener('click', handleStop);
  startBtn.addEventListener('click', handleDownload);
  recoder.stop();
};

const handleStart = () => {
  startBtn.innerText = 'Stop Recording';
  startBtn.removeEventListener('click', handleStart);
  startBtn.addEventListener('click', handleStop);

  recoder = new MediaRecorder(stream);
  recoder.ondataavailable = (event) => {
    videoFile = URL.createObjectURL(event.data);
    video.srcObject = null;
    video.src = videoFile;
    video.loop = true;
    video.play();
  };
  recoder.start();
};

const init = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  video.srcObject = stream;
  video.play();
};

init();

startBtn.addEventListener('click', handleStart);
