// /js/services/dealsService.js

const DEALS_PATH = '/data/deals.json'
let dealsCache = null

export async function loadDeals() {
  let deals = []
  if (dealsCache) {
    deals = dealsCache
  } else {
    try {
      const res = await fetch(`${DEALS_PATH}?v=${Date.now()}`)
      if (res.ok) {
        deals = await res.json()
      }
    } catch (e) {
      console.warn('Could not load deals.json', e)
    }
    dealsCache = deals
  }

  const custom = JSON.parse(localStorage.getItem('deals_custom') || '[]')
  const deletedIds = JSON.parse(localStorage.getItem('deals_deleted_ids') || '[]')

  deals = deals.filter(d => !deletedIds.includes(d.id))

  custom.forEach(c => {
    const idx = deals.findIndex(d => d.id === c.id)
    if (idx > -1) {
      deals[idx] = c
    } else {
      deals.push(c)
    }
  })

  return deals
}

function isDealActive(deal) {
  const now = new Date()
  const start = new Date(deal.startDate)
  const end = new Date(deal.endDate)
  return now >= start && now <= end
}

export function getDealsForBusiness(businessId) {
  if (!dealsCache) {
    return []
  }
  return dealsCache.filter(deal => String(deal.businessId) === String(businessId))
}

export function getActiveDeals() {
  if (!dealsCache) {
    return []
  }
  return dealsCache.filter(isDealActive)
}
