
export function normalize(query) {
  return query.toLowerCase().trim();
}

export function extractNumbers(query) {
  const matches = query.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

export function containsAny(query, keywordArray) {
  const normalized = normalize(query);
  return keywordArray.some(keyword => normalized.includes(keyword.toLowerCase()));
}
