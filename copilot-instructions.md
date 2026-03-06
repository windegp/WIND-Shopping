# WIND Shopping - Copilot Instructions

Welcome to WIND Shopping! This guide helps you navigate the codebase and work effectively with Copilot AI sessions.

## Quick Start Commands

### Build & Development
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm start            # Run production server
npm run lint         # ESLint check
```

### Running Tests
Currently, no test suite exists. Consider adding Jest/Vitest for:
- Cart calculations and state management
- Payment workflow (Kashier webhook verification)
- Firebase queries and real-time listeners

---

## High-Level Architecture

### 🏗️ Project Structure
```
WIND Shopping (Next.js 15 + React 19)
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (public)/        # Customer-facing pages
│   │   │   ├── page.js      # Homepage
│   │   │   ├── collections/[slug]/ # Dynamic collection pages
│   │   │   ├── product/[id]/       # Product detail
│   │   │   ├── checkout/          # Checkout flow
│   │   │   └── [other routes]     # Cart, thank-you, policies, auth
│   │   ├── admin/           # Admin dashboard (UID-protected)
│   │   │   ├── products/    # Inventory management
│   │   │   ├── collections/ # Category management
│   │   │   ├── menu/        # Hierarchical menu builder
│   │   │   ├── home-manager/# Homepage section customization
│   │   │   ├── orders/      # Order management
│   │   │   ├── reviews/     # Review moderation
│   │   │   ├── customers/   # Customer details
│   │   │   └── settings/    # Store configuration
│   │   └── api/             # Next.js API routes (webhooks, token generation)
│   ├── components/          # React components
│   │   ├── layout/          # Navbar, Footer, CartDrawer
│   │   ├── products/        # ProductCard, galleries
│   │   ├── sections/        # HeroSection, CollectionsSection
│   │   └── [utilities]/     # ImageUploader, CheckoutButton, etc.
│   ├── context/             # Global state (CartContext)
│   └── lib/                 # Utilities and config
│       ├── firebase.js      # Firebase/Firestore initialization
│       ├── kashier.js       # Payment gateway helpers
│       └── [other]          # Constants, product data
├── middleware.js            # Request rewriting for dynamic slugs
├── next.config.mjs          # Next.js configuration
├── jsconfig.json            # Path aliases (@/* → src/*)
└── public/                  # Static assets

```

### 🔄 Data Flow

#### **Customer Journey**
1. User browses collections (dynamic `:slug` → `/collections/[slug]`)
2. Views product details (`/product/[id]`)
3. Adds items to **CartContext** (persists to localStorage as `wind_cart`)
4. Proceeds to checkout (`/checkout`)
5. Creates order via `POST /api/create-order` (includes payment)
6. Redirected to **Kashier payment gateway**
7. Kashier callback hits `POST /api/webhooks/kashier`
8. Order status updated in Firestore, email sent via **Resend**
9. User lands on `/thank-you` confirmation page

#### **Admin Dashboard**
1. Auth guard redirects to `/admin/login` (Google OAuth)
2. Authorized users (hardcoded UID) access `/admin` dashboard
3. Real-time Firestore listeners fetch data:
   - Products, Collections, Orders, Reviews, Menu, HomeSections
4. Admin can:
   - Create/edit products (bulk import via CSV)
   - Manage collections and hierarchical menu
   - Customize homepage sections
   - Moderate reviews and customer inquiries
   - View real-time order status
5. Changes sync immediately via Firebase real-time updates

### 🌍 Key Integrations

| Service | Purpose | Environment Variables |
|---------|---------|----------------------|
| **Firebase** | Real-time Firestore DB, Authentication, Storage | `NEXT_PUBLIC_FIREBASE_*` (public), `FIREBASE_ADMIN_*` (private) |
| **Kashier** | Payment gateway (HMAC-SHA256 webhook verification) | `NEXT_PUBLIC_KASHIER_*` |
| **ImageKit** | Image optimization & delivery | `NEXT_PUBLIC_IMAGEKIT_*`, `IMAGEKIT_PRIVATE_KEY` |
| **Resend** | Email notifications (order confirmations) | `RESEND_API_KEY` |

---

## Key Conventions

### 📁 File Organization
- **Page files** (`page.js`) export default React component
- **API routes** are under `src/app/api/[route]/route.js`
- **Components** use PascalCase filenames, functional components with hooks
- **Context** files define Provider and custom hooks (e.g., `useCart()`)
- **Lib files** export utility functions (no default exports)

### 🛒 Cart & State Management
- **Single source of truth**: `CartContext` (not Redux/Zustand)
- **Cart items structure**:
  ```js
  { id, name, price, quantity, selectedSize, selectedColor, image }
  ```
- **Unique item ID**: `${product.id}-${size}-${color}` (not just product ID!)
- **Calculations**:
  - `subtotal = sum(item.price * item.quantity)`
  - `shipping = subtotal > threshold ? 0 : shippingCost` (or "free" promo)
  - `total = subtotal + shipping`
- **Persistence**: Auto-syncs to localStorage key `wind_cart`

### 🔐 Authentication
- **Public pages**: No auth required
- **Admin pages**: Google OAuth via Firebase, UID check required
- **Hardcoded admin UID**: `jGb9wBMHZfRIQgR9yfbb3rkvzRw2`
- Pattern: All `/admin/*` routes redirect unauthorized users to `/admin/login`

### 💳 Payment Workflow
- **Order creation**: `POST /api/create-order` receives cart data
- **Payment hash**: Generated using Kashier HMAC-SHA256
- **Redirect**: User sent to Kashier payment page
- **Callback**: Kashier sends webhook to `POST /api/webhooks/kashier`
- **Signature verification**: Always verify `X-Kashier-Signature` header
- **Order number format**: `WND-YYYYMMDD-XXXX` (unique per day)

### 🖼️ Images & Media
- **ImageKit integration**: All product images served through ImageKit CDN
- **Token generation**: `GET /api/upload` returns auth token for client-side uploads
- **Use Next.js Image component** for optimization: `<Image src={url} alt="" fill />`
- **Firebase Storage**: Rarely used; prefer ImageKit for CDN benefits

### 📊 Firestore Collections
```
├── products/          # { id, name, description, price, sizes, colors, images }
├── collections/       # { id, name, slug, description }
├── orders/            # { id, orderNumber, status, items, total, timestamp }
├── reviews/           # { productId, rating, text, approved }
├── menu/              # Hierarchical tree of navigation items
├── homeSections/      # Dynamic homepage sections with content/layout
└── customers/         # Email-based customer profiles and history
```

### 🔤 Styling
- **Framework**: Tailwind CSS (utility-first)
- **Theme**: Dark mode with white text on dark backgrounds
- **Font**: Cairo (Arabic support, RTL-ready)
- **Utilities**: `clsx()` for conditional classes, `tailwind-merge` for safe class overrides

### 🌐 URL Routing
- **Dynamic collections**: Middleware rewrites `/:slug` → `/collections/:slug`
- **Bypasses rewriting**: `/_next`, `/api`, `/admin`, `/collections`, `/products`, and static routes
- **SEO-friendly URLs**: Collection slugs are customizable in admin
- **Example**: User navigates to `/women-abaya` → internally fetches `/collections/women-abaya`

### 📝 Content Patterns
- **Product descriptions**: Rich text via React Quill (WYSIWYG editor)
- **Policies**: Editable via admin, stored in Firestore
- **CSV import**: Papa Parse for bulk product uploads (validation in admin)
- **Email templates**: Nodemailer + Resend for order confirmations

### ⚠️ Common Pitfalls
1. **Cart state not persisting?** Check localStorage key is exactly `wind_cart` and CartContext provider wraps page
2. **Images not loading?** Verify ImageKit auth token is valid; check CORS settings
3. **Firebase errors?** Ensure Firestore security rules allow reads/writes for signed-in users
4. **Payment webhook failing?** Double-check HMAC signature and merchant ID in kashier.js
5. **Admin access denied?** Verify hardcoded UID is correct and user is signed in with that account

---

## Development Workflow

### Setting Up Locally
```bash
git clone <repo>
npm install
cp .env.example .env.local          # Add Firebase, Kashier, ImageKit keys
npm run dev
```

### Creating a New Feature
1. **Understand the data model** - Check if Firestore collection exists
2. **Create API route** if needed under `src/app/api/[feature]/route.js`
3. **Build components** in `src/components/[feature]/`
4. **Add route/page** under `src/app/[path]/page.js`
5. **Test in browser** - Check network tab, Firestore, console errors
6. **Update CartContext** if feature touches cart state

### Debugging
- **Network issues?** Check browser DevTools Network tab, API response
- **State issues?** Use React DevTools to inspect CartContext
- **Firebase issues?** Check Firestore console and security rules
- **Build errors?** Run `npm run lint` and fix ESLint warnings

### Deployment
- **Vercel**: Connected to main branch, auto-deploys
- **Environment variables**: Set in Vercel project settings (not in .env.local)
- **Edge functions**: Some routes can use Edge Runtime (lightweight, stateless)

---

## Key Dependencies Overview

| Package | Purpose |
|---------|---------|
| `next` 15.1.0 | React framework (App Router, SSR, SSG) |
| `react` 19.0.0 | UI library |
| `firebase` 12.9.0 | Client-side DB, Auth, Storage |
| `firebase-admin` 13.6.1 | Server-side Firebase operations (API routes) |
| `@imagekit/next` 2.1.5 | Image optimization & delivery |
| `tailwindcss` 3.4.1 | CSS utility framework |
| `react-quill` 2.0.0 | Rich text editor for descriptions/policies |
| `papaparse` 5.5.3 | CSV parsing for bulk imports |
| `axios` 1.13.5 | HTTP client for API calls |
| `nodemailer` 8.0.1 | Email sending (alternative to Resend) |
| `resend` 6.9.2 | Email API for order confirmations |
| `lucide-react` 0.468.0 | Icon library |
| `@hello-pangea/dnd` 18.0.1 | Drag-and-drop for menu/ordering |
| `react-nestable` 3.0.2 | Hierarchical tree component |
| `uuid` 13.0.0 | Unique ID generation |

---

## Important Notes for Copilot

✅ **Always clarify**: Which page/component scope before making changes  
✅ **Test cart flow**: If modifying CartContext, test add/remove/checkout  
✅ **Firestore rules matter**: Some endpoints fail silently due to security rules  
✅ **ImageKit auth**: Token expires; regenerate if image uploads fail  
✅ **Admin UID**: Check hardcoded admin check before adding admin features  
✅ **RTL considerations**: Arabic text and layout direction may require special handling  
✅ **Performance**: Use `next/image` for product images, avoid unoptimized images  

---

## Questions? 
Refer to this file, check the Firestore schema, or review recent commits for context.
