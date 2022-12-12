// options
const playerOptions = { bpm: 130, libraryUrl: '/audio/' }
const selectorOptions = {
  MIN_ENERGY: 0,
  MAX_ENERGY: 3,
  ENERGY_LEVEL_THRESHOLD: { 0: 2, 1: 3, 2: 4 }
}

const libString = `
looperman-l-0000014-0000117-bentleyrhythmace-bra-punch-bass.wav 0
looperman-l-0158495-0051179-edge7-slither-8.wav 1
looperman-l-0002663-0049425-djfredval-fv-bass-line13-130.wav 3
looperman-l-1319133-0128084-fanto8bc-techno-kick.wav 2
looperman-l-2830941-0203999-pop-techno-style-ii-by-kidlas.wav 1
looperman-l-0303420-0021825-snloops-s-n-2step-of-looperman-piano-riff.wav 2
looperman-l-1319133-0100750-fanto8bc-the-commandery.wav 3
looperman-l-2612885-0229522-basic-techno-drum-loop.wav 2
looperman-l-1319133-0095203-fanto8bc-i-found-the-snare.wav 1
`
function libString2Lib(s, energy) {
  const tracks = s.split('\n').splice(1).slice(0, -1)
  const selected = []
  for (let i = 0; i < tracks.length; i++) {
    let track = tracks[i].split(' ')
    if (+ track[1] === energy) {
      selected.push({filename: track[0]})
    }
  }
  return selected
}
const library = {
  tracks: {
    0: libString2Lib(libString, 0),
    1: libString2Lib(libString, 1),
    2: libString2Lib(libString, 2),
    3: libString2Lib(libString, 3)
  }
}
const initTracks = [library.tracks[0][0]]
console.log(library)

// init sound module
const player = new Player(playerOptions)
const selector = new Selector(player, library, selectorOptions)

function initSound () {
  player.startAll()
  selector.init(initTracks)
}

function camera2selector (input) {
  console.log('energy', input)
  if (selector.ready) {
    selector.process(input)
  }
}

// init camera module
var Module = {
  // https://emscripten.org/docs/api_reference/module.html#Module.onRuntimeInitialized
  onRuntimeInitialized() {
    document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
    console.log('Runtime initialised')
    var mat = new cv.Mat()
    run_camera_flow(camera2selector)
  }
};