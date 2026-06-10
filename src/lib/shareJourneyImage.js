export async function generateJourneyShareImage(stats) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#0d0d0d')
  gradient.addColorStop(1, '#1e1e1e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#3a7352'
  ctx.fillRect(0, 0, canvas.width, 12)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px Inter, sans-serif'
  ctx.fillText('Oppa V-Line', 72, 120)

  ctx.font = 'bold 88px Inter, sans-serif'
  ctx.fillText('42 DAYS COMPLETE', 72, 260)

  ctx.fillStyle = '#a0a0a0'
  ctx.font = '36px Inter, sans-serif'
  ctx.fillText('My 42-day transformation journey', 72, 330)

  const lines = [
    `Streak: ${stats.streakLength} days`,
    `Total steps: ${stats.totalSteps.toLocaleString()}`,
    `Photos taken: ${stats.photosTaken}`,
    stats.puffinessStart != null && stats.puffinessEnd != null
      ? `Puffiness: ${stats.puffinessStart}/5 → ${stats.puffinessEnd}/5`
      : 'Puffiness trend: logged',
  ]

  let y = 460
  lines.forEach((line) => {
    ctx.fillStyle = '#ffffff'
    ctx.font = '42px Inter, sans-serif'
    ctx.fillText(line, 72, y)
    y += 90
  })

  ctx.fillStyle = '#3a7352'
  ctx.font = '32px Inter, sans-serif'
  ctx.fillText('oppa-v-line.vercel.app', 72, canvas.height - 80)

  return canvas.toDataURL('image/png')
}

export async function downloadJourneyShareImage(stats) {
  const dataUrl = await generateJourneyShareImage(stats)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = 'oppa-v-line-42-day-journey.png'
  link.click()
  return dataUrl
}
