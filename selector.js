class Selector {
  constructor(player, library, options) {
    this.ready = false
    this.player = player
    this.library = library
    this.o = options
    this.composition = {
      energy: 0,
      tracks: {
        0: [],
        1: [],
        2: [],
        3: [],
        4: []
      }
    }
  }

  init(initTracks) {
    /* initTracks = 0 energy tracks
    */
    if (this.ready === false) {
      this.composition.tracks[0] = initTracks
      for (let i = initTracks.length - 1; i >= 0; i -= 1) {
        this.addLoop(initTracks[i])
      }
      this.ready = true
      console.log('initted selector')
    }
  }

  calcEnergy(input) {
    return input
  }

  incrementEnergyLevel() {
    this.composition.energy++
    const options = this.library.tracks[this.composition.energy]
    const track = options[Math.floor(Math.random() * options.length)]
    this.composition.tracks[this.composition.energy].push(track)
    this.addLoop(track)
  }

  decrementEnergyLevel() {
    this.composition.energy--
    const playingTracks = this.composition.tracks[this.composition.energy + 1]
    for (let i = playingTracks.length - 1; i >= 0; i -= 1) {
      this.removeLoop(playingTracks[i])
      playingTracks.splice(i, 1);
    }
  }

  process(input) {
    // let updates = []
    // register events
    // maybe add randomness
    let inputEnergy = this.calcEnergy(input)
    if (this.composition.energy < this.o.MAX_ENERGY && inputEnergy > this.o.ENERGY_LEVEL_THRESHOLD[this.composition.energy]) { 
      this.incrementEnergyLevel()
    }
    if (this.composition.energy > this.o.MIN_ENERGY && inputEnergy < this.o.ENERGY_LEVEL_THRESHOLD[this.composition.energy - 1]) { 
      this.decrementEnergyLevel()
    }
    // process continuous input
  }

  addLoop(track) {
    if (track.filename in this.player.tracks) {
      this.player.startOnBar(track.filename)
    } else {
      this.player.loadTrack(track)
        .then(() => {
          this.player.startOnBar(track.filename)
        })
    }
  }

  removeLoop(track) {
    this.player.stopOnBar(track.filename)
  }
}
