export async function getCardByName(name) {
  const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${name}`)
  return res.json()
}
