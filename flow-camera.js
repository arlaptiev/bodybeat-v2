let height = 240
let width = 320

// exp weighted moving average param
let beta = 0.7
let mean_mag = 0
let ewma_mag = 0


function run_camera_flow(outputFunc) {

  let video = document.getElementById("videoInput"); // video is the id of video tag
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(function(stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function(err) {
        console.log("An error occurred! " + err);
      });


  let canvasFrame = document.getElementById("canvasFrame"); // canvasFrame is the id of <canvas>
  let context = canvasFrame.getContext("2d");
  let src = new cv.Mat(height, width, cv.CV_8UC4);
  let dst = new cv.Mat(height, width, cv.CV_8UC1);
  const FPS = 30;

  // take first frame of the video
  let frame1 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  let cap = new cv.VideoCapture(video);
  cap.read(frame1);

  let prvs = new cv.Mat();
  cv.cvtColor(frame1, prvs, cv.COLOR_RGBA2GRAY);
  frame1.delete();
  let hsv = new cv.Mat();
  let hsv0 = new cv.Mat(video.height, video.width, cv.CV_8UC1);
  let hsv1 = new cv.Mat(video.height, video.width, cv.CV_8UC1, new cv.Scalar(255));
  let hsv2 = new cv.Mat(video.height, video.width, cv.CV_8UC1);
  let hsvVec = new cv.MatVector();
  hsvVec.push_back(hsv0); hsvVec.push_back(hsv1); hsvVec.push_back(hsv2);

  let frame2 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  let next = new cv.Mat(video.height, video.width, cv.CV_8UC1);
  let flow = new cv.Mat(video.height, video.width, cv.CV_32FC2);
  let flowVec = new cv.MatVector();
  let mag = new cv.Mat(video.height, video.width, cv.CV_32FC1);
  let ang = new cv.Mat(video.height, video.width, cv.CV_32FC1);
  let rgb = new cv.Mat(video.height, video.width, cv.CV_8UC3);

  let streaming = true;

  function processVideo() {
    try {
      if (!streaming) {
        // clean and stop.
        prvs.delete(); hsv.delete(); hsv0.delete(); hsv1.delete(); hsv2.delete();
        hsvVec.delete(); frame2.delete(); flow.delete(); flowVec.delete(); next.delete();
        mag.delete(); ang.delete(); rgb.delete();
        return;
      }
      let begin = Date.now();

      // start processing.
      cap.read(frame2);
      cv.cvtColor(frame2, next, cv.COLOR_RGBA2GRAY);
      cv.calcOpticalFlowFarneback(prvs, next, flow, 0.5, 3, 15, 3, 5, 1.2, 0);
      cv.split(flow, flowVec);
      let u = flowVec.get(0);
      let v = flowVec.get(1);
      cv.cartToPolar(u, v, mag, ang);
      mean_mag = cv.mean(mag)[0]
      ewma_mag = beta * ewma_mag + (1 - beta) * mean_mag

      // pass the output
      outputFunc(ewma_mag)
    
      u.delete(); v.delete();
      ang.convertTo(hsv0, cv.CV_8UC1, 180/Math.PI/2);
      cv.normalize(mag, hsv2, 0, 255, cv.NORM_MINMAX, cv.CV_8UC1);
      cv.merge(hsvVec, hsv);
      cv.cvtColor(hsv, rgb, cv.COLOR_HSV2RGB);
      cv.imshow('canvasOutput', rgb);
      next.copyTo(prvs);

      // schedule the next one.
      let delay = 1000/FPS - (Date.now() - begin);
      setTimeout(processVideo, delay);
    } catch (err) {
      console.log("ERROR")
      console.error(err)
      // utils.printError(err);
    }
  };

  // schedule the first one.
  setTimeout(processVideo, 0);
}