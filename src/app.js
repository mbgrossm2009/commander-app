import React, { useEffect, useRef, useState } from "react";
import "./style.css";

// --- Scryfall helpers ---
async function scryfallAutocomplete(q) {
  const url = `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Scryfall autocomplete failed");
  return res.json();
}

async function scryfallNamedImage(cardName) {
  const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Scryfall card lookup failed");
  const data = await res.json();
  const img =
    data?.image_uris?.normal ||
    data?.card_faces?.[0]?.image_uris?.normal ||
    data?.image_uris?.large ||
    data?.card_faces?.[0]?.image_uris?.large;
  return img || null;
}

// --- Commander Spellbook combos via proxy ---
async function fetchCombosForCard(cardName) {
  const query = `
    query($name: String!) {
      combos(where: {cards: {name: {_ilike: $name}}}, limit: 50) {
        permalink
        cards { name }
      }
    }
  `;

  try {
    const res = await fetch("/api/spellbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { name: `%${cardName}%` },
      }),
    });

    if (!res.ok) throw new Error("Proxy request failed");
    const json = await res.json();
    const combos = json?.data?.combos || [];
    return { combos, source: "graphql-proxy" };
  } catch (err) {
    console.error("GraphQL proxy error:", err);
    return { combos: [], source: "none" };
  }
}

const SUGGEST_LIMIT = 10;

export default function App() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const debRef = useRef(0);

  // autocomplete
  useEffect(() => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }
    const id = ++debRef.current;
    const run = async () => {
      try {
        const data = await scryfallAutocomplete(input);
        if (debRef.current !== id) return;
        setSuggestions((data?.data || []).slice(0, SUGGEST_LIMIT));
      } catch {
        /* ignore autocomplete errors */
      }
    };
    const t = setTimeout(run, 150);
    return () => clearTimeout(t);
  }, [input]);

  async function onSubmit(e) {
    e?.preventDefault?.();
    const cardName = input.trim();
    if (!cardName) return;

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const { combos } = await fetchCombosForCard(cardName);
      if (!combos || combos.length === 0) {
        throw new Error("No combos found for that card.");
      }

      const randomCombo = combos[Math.floor(Math.random() * combos.length)];

      let otherCardName = null;
      const names = randomCombo.cards.map((c) => c.name);
      const filtered = names.filter(
        (n) => n.toLowerCase() !== cardName.toLowerCase()
      );
      if (filtered.length) {
        otherCardName =
          filtered[Math.floor(Math.random() * filtered.length)];
      }

      const [img1, img2] = await Promise.all([
        scryfallNamedImage(cardName).catch(() => null),
        otherCardName
          ? scryfallNamedImage(otherCardName).catch(() => null)
          : Promise.resolve(null),
      ]);

      setResult({
        cardName,
        combo: randomCombo,
        otherCardName,
        images: { input: img1, other: img2 },
      });
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>MTG Random Combo Finder</h1>
        <form onSubmit={onSubmit} className="search-form">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Start typing a card name…"
          />
          <button disabled={loading} type="submit">
            {loading ? "Searching…" : "Find Combo"}
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="results">
            <h2>Your Card</h2>
            {result.images.input && (
              <img src={result.images.input} alt={result.cardName} />
            )}
            <p>{result.cardName}</p>

            <h2>Random Partner</h2>
            {result.images.other && (
              <img src={result.images.other} alt={result.otherCardName} />
            )}
            <p>{result.otherCardName || "Hidden until opening combo page"}</p>

            <h2>Combo Details</h2>
            <a href={result.combo.permalink} target="_blank" rel="noreferrer">
              Open on Commander Spellbook →
            </a>
            <ul>
              {result.combo.cards.map((c, idx) => (
                <li key={idx}>{c.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
