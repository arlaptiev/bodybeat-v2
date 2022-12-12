class Player {
  constructor(options) {
    this.context = new AudioContext();
    this.tracks = {};
    this.isPlaying = false;
    this.startTime = null;
    this.bpm = options.bpm;
    this.libraryUrl = options.libraryUrl;
    this.nextBar = 0;
    this.lastBar = 0;
  }

  async loadTrack(trackData) {
    return fetch(this.libraryUrl + trackData.filename)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => this.context.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
          const track = {
            buffer: audioBuffer,
            params: {},
            source: null,
            ...trackData
          } 
          this.tracks[trackData.filename] = track
          return track
        });
  }

  start(track, time) {
    if (track.source) {
      track.source.stop();
    }
    track.source = this.context.createBufferSource();
    track.source.buffer = track.buffer;

    // add effects
    const gainNode = this.context.createGain()
    track.params.gain = gainNode.gain

    track.source
      .connect(gainNode)
      .connect(this.context.destination);

    gainNode.gain.value = 0.5
    track.source.loop = true;
    track.source.playbackRate.value = 1;
    track.source.start(time);  // there might be a problem with tracks started at different times: move this after all are prepared 
  }

  setParamFunction(trackName, paramName, value, overNBars, func_name='linear') {
    const track = this.tracks[trackName]
    let setValueFunctions = {
      'set': track.params[paramName].setValueAtTime,
      'linear': track.params[paramName].linearRampToValueAtTime,
      'exponential': track.params[paramName].exponentialRampToValueAtTime
    }
    track.params[paramName].cancelScheduledValues(this.context.currentTime)
    const paramChangeTime = this.context.currentTime + (this.nextBar - this.lastBar) * overNBars
    setValueFunctions[func_name].call(track.params[paramName], value, paramChangeTime)
  }

  startOnBar(name) {
    const track = this.tracks[name]
    this.start(track, this.nextBar)
  }

  stopOnBar(name) {
    const track = this.tracks[name]
    track.source.stop(this.nextBar)
  }

  startAll() {
    const time = this.context.currentTime
    this.isPlaying = true
    this.startTime = time
    const secPerBeat = 1.0 / (this.bpm / 60.0)
    const secPerBar = secPerBeat * 4
    const that = this
    this.timer = setInterval(function () {
      if (that.context.currentTime > that.nextBar) {
            that.lastBar = that.nextBar
            that.nextBar = that.lastBar + secPerBar
          }
    }, 10);

    const constantNode = this.context.createConstantSource();
    constantNode.connect(this.context.destination);
    constantNode.start();
  }

  stopAll() {
    this.startTime = null;
    this.isPlaying = false;
    this.lastBar = 0;
    this.nextBar = 0;
    for (const [, track] of Object.entries(this.tracks)) {
      track.source.stop();
    }
    clearInterval(this.timer);
  }
}