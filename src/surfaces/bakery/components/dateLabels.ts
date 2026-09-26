export function weekdayLabel(date = new Date()) {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(date).toUpperCase()
}

export function weekdayDateLabel(date = new Date()) {
  const dayMonth = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long' }).format(date).toUpperCase()
  return `${weekdayLabel(date)} · ${dayMonth}`
}

/** HH:MM:SS remaining until `targetIso`, or the same format prefixed for an overdue ticket. */
export function countdownParts(targetIso: string, nowMs = Date.now()) {
  const remainingMs = new Date(targetIso).getTime() - nowMs
  const overdue = remainingMs < 0
  const totalSeconds = Math.floor(Math.abs(remainingMs) / 1000)
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return { overdue, label: `${hours}:${minutes}:${seconds}` }
}
