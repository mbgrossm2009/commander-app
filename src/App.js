import { useState } from 'react'
import { getCardByName } from './scryfall'

function App() {
  const [name, setName] = useState('')
  const [card, setCard] = useState(null)

  async function search() {
    const data = await getCardByName(name)
    setCard(data)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Scryfall Search</h1>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={search}>Search</button>

      {card && (
        <div>
          <h2>{card.name}</h2>
          <img
            src={
              card.image_uris?.normal || // one faced cards
              card.card_faces?.[0]?.image_uris?.normal //if card has 2 sides
              // show the card’s normal image if it exists, otherwise show the
              // first face’s normal image. if neither exist, nothing will render.
            }
            alt={card.name}
          />
        </div>
      )}
    </div>
  )
}

export default App
