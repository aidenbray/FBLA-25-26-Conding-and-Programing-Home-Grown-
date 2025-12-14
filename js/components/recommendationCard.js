export function recommendationCard(recommendation) {
  const { business, reasons } = recommendation
  
  const card = document.createElement('div')
  card.className = 'recommendation-card'
  card.setAttribute('role', 'article')
  card.setAttribute('aria-label', `Recommended: ${business.name}`)
  
  const reasonText = reasons.slice(0, 2).join(' • ')
  const imageUrl = business.image.startsWith('http') ? business.image : `/assets/${business.image}`

  card.innerHTML = `
    <div class="badge badge-primary" style="position: absolute; top: 10px; right: 10px; z-index: 1;">Recommended</div>
    <img src="${imageUrl}" alt="${business.name}" loading="lazy">
    <div class="mt-sm">
      <h3 class="mb-sm">${business.name}</h3>
      <p class="text-light text-sm mb-sm">${business.category}</p>
      <p class="text-sm text-main" style="font-style: italic;">💡 ${reasonText}</p>
    </div>
  `

  card.onclick = () => {
    location.hash = `#/business/${business.id}`
  }
  
  card.tabIndex = 0
  card.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      location.hash = `#/business/${business.id}`
    }
  }

  return card
}
