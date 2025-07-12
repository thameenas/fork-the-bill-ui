# Fork the Bill — Project Context

## Project Goal
Fork the Bill is a web app inspired by Splitwise, designed to simplify splitting restaurant bills with itemized expenses. The app allows the payer to scan a bill, create an expense, share a URL or QR code, and let others claim items they consumed. The app is designed for anonymous, account-free, URL-based access.

---

## Tech Stack
- **Frontend:** React (with React Router), Tailwind CSS, TypeScript
- **Backend:** Python (Flask), PostgreSQL (planned)
- **AI Integration:** OpenAI Vision API for receipt scanning (planned)
- **State Management:** In-memory mock data for frontend development
- **Shareable Links:** Human-friendly slugs (e.g., `/brave-blue-tiger`)

---

## Key Features (UI)
- **Bill Creation:** Upload a receipt, enter payer name, and create a new bill
- **Itemized Editing:** Add, edit, and delete items; mobile-optimized UI
- **Claiming Items:** Users claim items they consumed; supports multiple claimants per item
- **Tax/Tip Splitting:** Tax and tip are split by each person’s subtotal percentage
- **Completion Tracking:** Each person can mark themselves as finished or pending (user-controlled, not automatic)
- **Anonymous Usage:** No accounts or logins; access is via shareable URL
- **Share/Join:** Share bill via link or QR code; anyone with the link can join and interact
- **Real-Time Updates:** (Mocked) UI simulates real-time updates; backend will use polling for updates

---

## Shareable Link Design
- **Format:** `/brave-blue-tiger` (3-word, human-friendly slug)
- **Purpose:** Easy to read, say, and share verbally or via QR code
- **Routing:** All bill access and sharing is via the slug

---

## Backend API Requirements (from UI perspective)
- **Create Expense:** `POST /api/expenses` — returns full expense with slug
- **Get Expense:** `GET /api/expenses/{slug}` — fetch by slug
- **Update Expense:** `PUT /api/expenses/{slug}` — edit items, tax, tip, etc.
- **Claim/Unclaim Item:** `POST /api/expenses/{slug}/claim` — claim or unclaim an item for a person
- **Mark as Finished:** `POST /api/expenses/{slug}/finish` — set a person’s finished status
- **Delete Expense:** `DELETE /api/expenses/{slug}` (optional, for admin/testing)
- **All endpoints are stateless and anonymous**
- **Polling:** UI will poll the GET endpoint for updates (no WebSockets for now)

---

## Data Model
- **Expense:**
  - `id`, `slug`, `createdAt`, `payerName`, `totalAmount`, `subtotal`, `tax`, `tip`
  - `items`: array of `{ id, name, price, claimedBy: [personName, ...] }`
  - `people`: array of `{ name, itemsClaimed, amountOwed, subtotal, taxShare, tipShare, totalOwed, isFinished }`

---

## Key Design Decisions
- **No accounts:** All usage is anonymous and stateless
- **Human-friendly slugs:** For easy sharing and joining
- **User-controlled completion:** Each person marks themselves as finished when ready
- **Polling for updates:** Chosen for simplicity and reliability; can upgrade to WebSockets later if needed
- **Mock data:** Used for frontend development; backend will implement the same API

---

## OpenAPI Spec
See `fork-the-bill-api.yaml` in the repo for a full OpenAPI 3.0 spec covering all endpoints and schemas.

---

## Next Steps
- Build the backend API in Flask using the provided OpenAPI spec
- Integrate OpenAI Vision API for receipt scanning (optional/future)
- Deploy and test with real users

---

*This file is intended to provide full project context for future contributors, backend developers, or AI tools.* 