# Jambites – Replit AI Enhancement PRD (Phase 2)
**Feed this document directly to Replit AI to upgrade the existing Jambites app.**

---

## Context: What Already Works

The following screens are functional with mock data:
- Home Screen (traffic jam detection banner, vendor list, categories)
- Menu Screen (browse items, add to cart)
- Checkout Screen (order summary, car number plate, promo code, price breakdown, UPI/Card/Cash)
- My Orders Screen (active orders list with Track button)
- Live Tracking Screen (order status timeline, rider info — BUT map is a placeholder)
- Jammy Chatbot Screen (Claude AI chatbot — working)
- Profile Screen (guest user, saved locations, payment methods, coupons)

---

## What Needs to Be Built (This PRD)

### PRIORITY 1 — Fix the Map in Live Tracking

**Problem:** The Live Tracking screen currently shows a grey placeholder box that says "Live map tracking – available in native app". This must be replaced with a real interactive map.

**Requirements:**
- Replace the placeholder with an embedded Google Maps (or Leaflet.js/OpenStreetMap if Google Maps API key is unavailable) map component
- The map must show:
  - A **blue car pin** at the customer's location (use mock coordinates: `28.6139, 77.2090` for Delhi NH-48 Toll Plaza)
  - An **orange cyclist/rider pin** that is positioned a short distance away from the car
  - A **dotted route line** connecting the rider pin to the car pin
  - A **"6 min away"** ETA chip displayed on the map (orange pill badge, top-center of map)
- The rider pin should animate/move slightly every 5 seconds to simulate real-time movement (move it 0.0005 degrees closer to the car each tick)
- Map should be non-interactive (no zoom/pan controls) to keep the UI clean — or show minimal controls
- Map height: fill the top card area (approx 220px tall)
- Use the same light blue card background (`#EBF4FB`) that currently wraps the placeholder

**Tech approach for Replit:**
- If using React/React Native Web: use `react-leaflet` with OpenStreetMap tiles (no API key needed)
- If using HTML/JS: embed Leaflet.js via CDN
- Leaflet CDN: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- Leaflet CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`

---

### PRIORITY 2 — Jammy AI Chatbot Enhancements

Jammy is already connected to the Claude API. Now upgrade its intelligence and UI.

#### 2A — Smarter System Prompt for Jammy

Update Jammy's system prompt sent to the Claude API to be:

```
You are Jammy, an upbeat and helpful AI food assistant for Jambites — an app that delivers snacks, drinks, and medicines to people stuck in traffic jams. Keep responses short (2-4 sentences max), friendly, and use 1-2 emojis per message. You know the following vendors are nearby:
1. Sharma Ji Ke Samose — Snacks (Aloo Samosa ₹15, Paneer Kachori ₹20, Pyaaz Kachori ₹15, Combo Pack ₹55)
2. Chai Point Express — Drinks (Masala Chai ₹20, Cold Coffee ₹35, Mango Drink ₹30)
3. Quick Meds — Medicines (ORS Packet ₹25, Paracetamol ₹15, Antacid ₹20)
4. Burger Bros — Snacks (Mini Fries ₹40, Veg Burger ₹65, Shake ₹55)
You can recommend items, suggest combos, and tell the user what's available. If asked about order status, say the order is being prepared and will arrive in about 6 minutes. Do not make up items not listed above. Always end with a helpful follow-up question or offer.
```

#### 2B — Quick Reply Suggestion Chips

Below the chat input bar, show 3 horizontal scrollable suggestion chips that the user can tap to send as messages instantly. Default chips:
- "What's popular? 🔥"
- "Good for kids? 👶"
- "Quick medicine? 💊"

After Jammy responds, show 3 contextually relevant new chips based on the last response (use simple keyword matching — if last response mentioned food, show food-related chips; if medicine, show medicine chips).

#### 2C — Typing Indicator

When waiting for Jammy's response from the Claude API, show an animated typing indicator (3 pulsing dots, orange color `#E85D04`) in a chat bubble on the left side. Remove it once the response arrives.

#### 2D — Mood-Based Order Suggestion (New Feature)

Add a **"How are you feeling?"** banner at the top of the Jammy screen (above the chat, below the header). It should show 4 emoji mood buttons in a horizontal row:

| Emoji | Label | Auto-message sent to Jammy |
|-------|-------|---------------------------|
| 😴 | Tired | "I'm feeling tired and drowsy, what should I order to stay awake?" |
| 😤 | Stressed | "I'm stressed in this traffic jam, what comfort food can cheer me up?" |
| 🤒 | Unwell | "I'm not feeling well, what medicines or light food do you recommend?" |
| 😄 | Happy | "I'm in a great mood! Suggest something fun and delicious!" |

Tapping a mood button sends the corresponding message to Jammy automatically and scrolls to the chat.

---

### PRIORITY 3 — AI-Powered Personalized Menu Ranking

On the **Menu Screen** (vendor menu page), add a "🤖 Recommended for You" horizontal scroll section at the TOP of the menu, above the category chips.

**How it works:**
- Make a single Claude API call when the menu screen loads with this prompt:
  ```
  A user is stuck in traffic in Delhi at 4:30 PM. They previously ordered Aloo Samosa and Paneer Kachori. From the following menu items: [list all items with prices], return a JSON array of the top 3 recommended item names with a one-word reason each. Format: [{"name": "item name", "reason": "one word reason"}]
  ```
- Parse the JSON response and display 3 horizontal cards showing: item name, price, one-word AI badge (e.g. "Popular", "Comfort", "Quick"), and an ADD button
- Show a small ✨ "AI Pick" orange label on each card
- If the API call fails or takes >3 seconds, silently skip this section (don't show an error)

---

### PRIORITY 4 — Voice Input for Jammy (Basic)

Add a **microphone icon button** next to the text input field in the Jammy chat screen.

- On tap, use the **Web Speech API** (`SpeechRecognition`) which is available in most mobile browsers
- Show a pulsing orange animation on the mic button while listening
- Once speech is detected, fill the text input with the transcribed text
- User can then tap Send to submit, or edit first
- If speech API is not supported in the browser, hide the mic button silently

```javascript
// Basic implementation
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-IN'; // Indian English
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setInputText(transcript);
};
recognition.start();
```

---

### PRIORITY 5 — Smart Traffic Jam Alert Banner

On the **Home Screen**, the existing orange banner says "Jam detected near you! Order now — delivery in under 7 min."

Upgrade this to call the Claude API once on home screen load to generate a **dynamic, witty jam message**. Use this prompt:

```
Generate a single short, witty, empathetic message (max 12 words) for someone stuck in Delhi traffic at peak hours. Make it feel friendly and slightly funny. Don't use exclamation marks. Examples of tone: "Looks like the road decided to take a nap today" or "Traffic's bad but your snacks don't have to wait". Return only the message text, nothing else.
```

- Replace the static subtitle text "Order now — delivery in under 7 min" with the AI-generated message
- Show a loading shimmer on the subtitle while the API call is in progress
- Fall back to the original text if the API call fails

---

## Design Constraints (Do Not Change)

Keep the existing design system intact:
- **Primary Orange**: `#E85D04`
- **Amber**: `#FFB700`
- **Dark Navy**: `#1A1A2E`
- **Background**: White `#FFFFFF` with light grey cards `#F8F9FA`
- **Font**: Current font family (keep as-is)
- **Bottom Navigation**: Home, Orders, Jammy, Profile (keep exactly as-is)
- **Border radius**: rounded cards (12-16px), pill buttons (50px)
- Material 3 style card shadows

---

## API Configuration

All Claude API calls should use:
- **Model**: `claude-sonnet-4-20250514`
- **Max tokens**: `300` (keep responses short to save cost)
- **API endpoint**: `https://api.anthropic.com/v1/messages`
- Store the API key in an environment variable called `CLAUDE_API_KEY` — never hardcode it
- Add a global `try/catch` around every API call with a silent fallback (never crash the UI)

---

## Mock Data to Use (if backend is not connected)

```javascript
const MOCK_VENDORS = [
  { id: 1, name: "Sharma Ji Ke Samose", category: "Snacks", rating: 4.7, eta: "5 min", distance: "300m", deliveryFee: 15 },
  { id: 2, name: "Chai Point Express", category: "Drinks", rating: 4.5, eta: "4 min", distance: "500m", deliveryFee: 10 },
  { id: 3, name: "Quick Meds", category: "Medicines", rating: 4.8, eta: "6 min", distance: "800m", deliveryFee: 20 },
  { id: 4, name: "Burger Bros", category: "Snacks", rating: 4.3, eta: "7 min", distance: "1100m", deliveryFee: 0 }
];

const MOCK_LOCATION = { lat: 28.6139, lng: 77.2090, label: "Near Toll Plaza, NH-48 · 3rd lane" };

const MOCK_RIDER = { name: "Rajesh Kumar", rating: 4.8, vehicle: "DL-01-ZY-4567", eta: "6 min",
  location: { lat: 28.6160, lng: 77.2105 } // starts ~300m away from customer
};
```

---

## Summary of Changes by Screen

| Screen | Change |
|--------|--------|
| Live Tracking | Replace map placeholder with real Leaflet.js map showing car + moving rider pin |
| Jammy Chat | Better system prompt, quick reply chips, typing indicator, mood selector |
| Menu Screen | "Recommended for You" AI section at top |
| Jammy Chat | Voice input mic button using Web Speech API |
| Home Screen | Dynamic AI-generated witty traffic jam message |

---

**Implementation order: Priority 1 → 2A → 2B → 2C → 2D → 3 → 4 → 5**

Start with Priority 1 (the map fix) as it is the most visually broken element of the current app.
