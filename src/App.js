import { useState } from "react";
import { getCardByName } from "./scryfall";

function App() {
  const [name, setName] = useState(""); //inout text
  const [card, setCard] = useState(null); // card object
  const [loading, setLoading] = useState(false); // returns true or false when fetching
  const [error, setError] = useState(""); //error message to display if something goes wrong

  async function search() {
      const img =
    card?.image_uris?.normal || card?.card_faces?.[0]?.image_uris?.normal || ''

    if (!name.trim()) return;
    setLoading(true);
    setError("");
    setCard(null);
    try {
      const data = await getCardByName(name.trim());
      setCard(data);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault() 
      search()
    }
  }

  const img =
    card?.image_uris?.normal || card?.card_faces?.[0]?.image_uris?.normal || ""; //checks if the card has 1 or 2 sides

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Scryfall Search</h1>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a card name"
          style={{ padding: 8, flex: 1 }}
        />
        <button onClick={search} disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'crimson', marginTop: 12 }}>
          {error}
        </p>
      )}

      {card && (
        <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {img && (
            <img
              src={img}
              alt={card.name}
              style={{ width: 300, height: 'auto', borderRadius: 8 }}
            />
          )}
          <div>
            <h2 style={{ margin: '0 0 8px' }}>{card.name}</h2>
            <p style={{ margin: 0 }}>{card.type_line}</p>
            {card.oracle_text && (
              <p style={{ whiteSpace: 'pre-wrap' }}>{card.oracle_text}</p>
            )}
            {!card.oracle_text && card.card_faces?.[0]?.oracle_text && (
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {card.card_faces[0].oracle_text}
              </p>
            )}
            <p style={{ marginTop: 8 }}>
              <a href={card.scryfall_uri} target="_blank" rel="noreferrer">
                View on Scryfall
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App;


