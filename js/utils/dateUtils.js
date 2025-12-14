// /js/utils/dateUtils.js

export function daysSince(dateInput) {
  const target = new Date(dateInput)
  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((now - target) / msPerDay)
}

export function formatDateHuman(dateInput) {
  const date = new Date(dateInput)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}
