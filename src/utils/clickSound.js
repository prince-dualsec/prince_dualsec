let audioCtx = null
let permitted = false
let pendingSound = false

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function playCyberClick() {
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        permitted = true
        if (pendingSound) {
          pendingSound = false
          triggerClick(ctx)
        }
      })
      return
    }

    permitted = true
    triggerClick(ctx)
  } catch {
    // Audio not supported — fail silently
  }
}

function triggerClick(ctx) {
  const now = ctx.currentTime

  // Short high-frequency oscillator burst (the "click")
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(3200, now)
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.06)
  oscGain.gain.setValueAtTime(0.08, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  osc.connect(oscGain)
  oscGain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.07)

  // Filtered noise burst (digital texture)
  const bufferSize = ctx.sampleRate * 0.04
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3
  }
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer

  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 2500
  bandpass.Q.value = 2

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.04, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

  noise.connect(bandpass)
  bandpass.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noise.start(now)
  noise.stop(now + 0.05)
}

export function initClickSound() {
  document.addEventListener('click', () => {
    if (permitted) {
      playCyberClick()
    } else {
      // First interaction — request permission, queue this click
      pendingSound = true
      playCyberClick()
    }
  }, { capture: true })
}
