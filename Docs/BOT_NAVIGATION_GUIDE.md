# 🧭 Adding Bot Navigation Links

## Quick Guide to Add Bot Links to Navigation

### Option 1: Add to Prediction Page Navigation

Edit `apps/frontend/app/prediction/page.tsx`:

```typescript
const navItems: { name: string; path: Route }[] = [
    { name: "Home", path: "/" as Route },
    { name: "Sports", path: "/sports" as Route },
    { name: "Esports", path: "/esports" as Route },
    { name: "Casino", path: "/casino" as Route },
    { name: "Prediction", path: "/prediction" as Route },
    { name: "🤖 Bot", path: "/bot/dashboard" as Route },  // ADD THIS LINE
]
```

### Option 2: Add Direct Links in Layout

Create a simple header component:

```typescript
// apps/frontend/app/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  
  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            Bet Bazzar
          </Link>
          
          <div className="flex gap-6">
            <Link 
              href="/prediction" 
              className={`text-white hover:text-blue-400 transition-colors ${
                pathname.startsWith('/prediction') ? 'text-blue-400' : ''
              }`}
            >
              Markets
            </Link>
            <Link 
              href="/casino" 
              className={`text-white hover:text-blue-400 transition-colors ${
                pathname.startsWith('/casino') ? 'text-blue-400' : ''
              }`}
            >
              Casino
            </Link>
            <Link 
              href="/bot/dashboard" 
              className={`text-white hover:text-blue-400 transition-colors ${
                pathname.startsWith('/bot') ? 'text-blue-400' : ''
              }`}
            >
              🤖 Bot
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
```

Then add to layout:

```typescript
// apps/frontend/app/layout.tsx
import { Header } from "./components/Header";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Option 3: Add Floating Action Button

Add a floating bot button that appears on all pages:

```typescript
// apps/frontend/app/components/BotFAB.tsx
"use client";

import Link from "next/link";

export function BotFAB() {
  return (
    <Link
      href="/bot/dashboard"
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
      title="AI Bot Dashboard"
    >
      <span className="text-2xl">🤖</span>
    </Link>
  );
}
```

Add to layout:

```typescript
import { BotFAB } from "./components/BotFAB";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
          <BotFAB />
        </Providers>
      </body>
    </html>
  );
}
```

## Recommended Approach

Use **Option 3 (Floating Action Button)** because:
- ✅ Visible on all pages
- ✅ Doesn't require modifying existing navigation
- ✅ Eye-catching for hackathon demo
- ✅ Easy to implement
- ✅ Mobile-friendly

## Quick Implementation (2 minutes)

1. Create `apps/frontend/app/components/BotFAB.tsx` with the code above
2. Add `<BotFAB />` to `apps/frontend/app/layout.tsx` before closing `</body>`
3. Done! Bot button now appears on all pages

## Alternative: Add to Existing Pages

If you want to add bot links to specific pages only:

### Prediction Page
Add a banner at the top:

```typescript
<div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-center">
  <Link href="/bot/dashboard" className="text-white font-bold hover:underline">
    🤖 Try our AI Auto-Betting Bot - Never miss a market!
  </Link>
</div>
```

### Casino Page
Add a card in the games grid:

```typescript
<Link href="/bot/dashboard" className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-8 text-center hover:scale-105 transition-transform">
  <div className="text-6xl mb-4">🤖</div>
  <h3 className="text-2xl font-bold text-white mb-2">AI Bot</h3>
  <p className="text-white/80">Automate your betting</p>
</Link>
```

---

**Recommendation:** Start with the Floating Action Button (Option 3) for maximum visibility during the hackathon demo!
