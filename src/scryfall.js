// src/scryfall.js
export async function getCardByName(name) {
  const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error('Card not found.')
  return res.json()
}
