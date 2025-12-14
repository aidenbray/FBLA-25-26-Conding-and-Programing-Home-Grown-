// /js/services/credibilityService.js

import { daysSince } from '../utils/dateUtils.js'

function getCommentsCount(review) {
  if (Array.isArray(review.comments)) {
    return review.comments.length
  }
  if (typeof review.comments === 'number') {
    return review.comments
  }
  return 0
}

function getRecencyWeight(review) {
  const days = daysSince(review.date)
  if (days < 7) return 5
  if (days < 30) return 3
  return 1
}

export function calculateCredibility(reviewObj) {
  const likes = Number(reviewObj.likes) || 0
  const comments = getCommentsCount(reviewObj)
  const recencyWeight = getRecencyWeight(reviewObj)
  return likes * 2 + comments + recencyWeight
}

export function sortReviewsByCredibility(reviews) {
  return [...reviews].sort((a, b) => {
    const scoreA = calculateCredibility(a)
    const scoreB = calculateCredibility(b)
    if (scoreB !== scoreA) {
      return scoreB - scoreA
    }
    const dateDiff = new Date(b.date) - new Date(a.date)
    if (dateDiff !== 0) {
      return dateDiff
    }
    return (Number(b.rating) || 0) - (Number(a.rating) || 0)
  })
}
