
export function recordView(businessId) {
  const history = getHistory()
  history.push({ businessId, timestamp: Date.now() })
  // Optional: Limit history size if needed, e.g., keep last 50
  if (history.length > 50) {
    history.shift()
  }
  localStorage.setItem('history', JSON.stringify(history))
}

export function getHistory() {
  return JSON.parse(localStorage.getItem('history') || '[]')
}

export function getMostViewedCategories(allBusinesses) {
  const history = getHistory()
  const categoryCounts = {}

  history.forEach(entry => {
    const business = allBusinesses.find(b => String(b.id) === String(entry.businessId))
    if (business && business.category) {
      categoryCounts[business.category] = (categoryCounts[business.category] || 0) + 1
    }
  })

  // Return categories sorted by view count descending
  return Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
}
