# Fork the Bill

A modern, anonymous, itemized bill-splitting app inspired by Splitwise. Fork the Bill lets you scan a restaurant bill, create an expense, and share a human-friendly link or QR code so friends can claim what they ate—no accounts or logins required.

---

## 🚀 Features
- **Scan or upload a bill** (AI-based scanning planned)
- **Itemized editing:** Add, edit, and delete items
- **Claim items:** Each person claims what they ate (supports multiple claimants per item)
- **Tax/tip splitting:** By each person’s subtotal percentage
- **Completion tracking:** Each person marks themselves as finished or pending
- **Anonymous, account-free:** No signups, just a shareable link
- **Human-friendly URLs:** Share links like `/brave-blue-tiger` (easy to say, type, or scan)
- **Share via QR code or link**
- **Mobile-optimized UI**
- **Real-time updates:** (Mocked in UI; backend will use polling)

---

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Python (Flask), PostgreSQL (planned)
- **AI Integration:** OpenAI Vision API (planned)

---

## 📦 Project Structure
- `fork-the-bill-ui/` — React frontend (this repo)
- `context.md` — Full project context and design summary
- `fork-the-bill-api.yaml` — OpenAPI 3.0 spec for backend

---

## 🏁 Getting Started (Frontend)

1. **Install dependencies:**
   ```sh
   cd fork-the-bill-ui
   npm install
   ```
2. **Run the app:**
   ```sh
   npm start
   ```
3. **Open in browser:**
   [http://localhost:3000](http://localhost:3000)

---

## 🔗 Shareable Links
- Every bill gets a unique, human-friendly slug (e.g., `/brave-blue-tiger`)
- Share the link or QR code with friends—no login needed

---

## 📝 API & Backend
- See [`fork-the-bill-api.yaml`](./fork-the-bill-api.yaml) for the full OpenAPI spec
- See [`context.md`](./context.md) for project goals, data model, and design decisions
- Backend will provide stateless, anonymous REST endpoints (see OpenAPI spec)

