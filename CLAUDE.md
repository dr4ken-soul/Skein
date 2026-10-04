# Skein — Agent Context

## What This Is

Skein is a neutral on-chain registry that stops one invoice from being financed twice. A lender runs an invoice through the reader, the AI pipeline normalises the fields and derives a fingerprint root, the contract checks whether that fingerprint is already pledged, and if it is free the lender funds the seller and records the pledge in one atomic transaction. A second attempt to finance the same receivable reverts with `AlreadyPledged` and names the lender and block that got there first.

Only hashes go on-chain. No invoice text, no amounts, no party names.

Built for Arc Microgrants | Circle on DoraHacks. Twenty microgrants of 500 USDC from a 10,000 USDC pool. Submissions opened 16 September 2026, deadline 14 October 2026 23:59 ET, review is rolling and decisions close 21 October.

---

## One-Line Pitch

An invoice can only be financed once.

---

## MVP Features

1. First-writer-wins receivable registry on Arc mainnet. One contract, no owner, no treasury, no fee in MVP
2. AI invoice reader that normalises messy documents into a canonical field set and a fingerprint root that survives renaming, reformatting, rounding and rescanning
3. Atomic fund and pledge. The lender's USDC reaches the seller and the pledge is recorded in the same transaction, or neither happens
4. Mutation benchmark with committed fixtures. 100 mutated invoices run against Skein and against a plain document hash, results committed to the repo so judges reproduce them with no API key
5. Public registry feed and a check workspace. Anyone can read the registry without a wallet. Only the check and fund flow needs one

Post-microgrant, not in MVP: a protocol fee and treasury, lender-to-lender pledge transfer, multi-currency receivables through StableFX, ERC-8183 job settlement for agent lenders, a hosted reader API with rate limits, ERC-8004 validation attestations.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS v4 |
| Animation | motion/react for components, GSAP ScrollTrigger for the pinned catch story |
| 3D | React Three Fiber, @react-three/drei, procedural geometry, no model files |
| Wallet | wagmi v2 + viem, cookie storage, never localStorage or sessionStorage |
| Contracts | Solidity 0.8.28, Foundry with Arc Foundry, OpenZeppelin v5 |
| Local chain | `arc-anvil --network arc`, plain anvil cannot reproduce Arc behaviour |
| AI reader | OpenAI structured outputs plus vision, behind a provider-agnostic interface |
| Fixtures | `fixtures/invoices/*.json` and `fixtures/mutations/*.json`, committed, deterministic |
| Chain | Arc mainnet, chain ID 5042 |
| Database | None. Every read comes from the contract, the RPC or committed fixtures |
| Hosting | Vercel with `vercel.json` rewrites for deep links |

No off-chain index in MVP. If a number is not readable from the contract, the RPC or a committed fixture, it does not appear in the product.

---

## Project Structure

```
skein/
├── contracts/
│   ├── src/
│   │   └── SkeinRegistry.sol        (invoiceId, check, fundAndPledge, releasePledge, repay)
│   ├── test/
│   │   ├── SkeinRegistry.t.sol      (unit, arc-anvil)
│   │   └── ArcBehaviour.t.sol       (decimals, fee floor, dual Transfer logs, zero-address revert)
│   ├── script/
│   │   ├── Deploy.s.sol
│   │   └── SeedDemo.s.sol           (the five demo transactions for the README)
│   ├── foundry.toml
│   └── remappings.txt
├── reader/
│   ├── src/
│   │   ├── extract.ts               (provider-agnostic interface, OpenAI implementation)
│   │   ├── canonicalise.ts          (THE PRODUCT LOGIC, no network, no AI)
│   │   ├── fingerprint.ts           (five salted keys + fingerprint root)
│   │   ├── benchmark.ts             (100 mutations, Skein vs plain hash)
│   │   ├── mcp/check.ts             (agent surface, labelled a stub)
│   │   └── providers/
│   │       ├── openai.ts
│   │       └── fixtures.ts          (replay mode, no API key)
│   ├── fixtures/
│   │   ├── invoices/                (20 base invoices, fields + document text)
│   │   ├── mutations/               (100 mutated variants, 5 classes x 20)
│   │   └── distinct/                (20 distinct invoices sharing one payer, false positives)
│   ├── result/
│   │   ├── benchmark.json           (committed output the Proof section reads)
│   │   └── benchmark.json.sha256    (CI fails if a rerun does not match)
│   └── package.json
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             (landing, ten sections)
│   │   │   ├── registry/page.tsx    (public read-only feed, no wallet)
│   │   │   ├── app/
│   │   │   │   ├── check/page.tsx   (wallet-gated check workspace)
│   │   │   │   └── pledges/page.tsx (wallet-gated pledge history)
│   │   │   ├── api/reader/route.ts  (server-only reader endpoint)
│   │   │   ├── layout.tsx           (providers, SkeinScene mount, error boundary)
│   │   │   └── not-found.tsx
│   │   ├── components/
│   │   │   ├── three/
│   │   │   │   ├── SkeinScene.tsx   (single fixed canvas, isolines + strands)
│   │   │   │   ├── IsolinePlane.tsx
│   │   │   │   ├── SkeinStrands.tsx
│   │   │   │   ├── CameraRig.tsx    (6b walkthrough, driven by the pinned story)
│   │   │   │   ├── buildStrands.ts  (fingerprint keys to seeded curves)
│   │   │   │   └── StillFallback.tsx
│   │   │   ├── layout/
│   │   │   │   ├── RulerNav.tsx     (B1 scroll-progress nav)
│   │   │   │   ├── AppRail.tsx      (interior sidebar >= 1024px, bottom bar below)
│   │   │   │   ├── WalletPill.tsx
│   │   │   │   ├── WalletMenu.tsx
│   │   │   │   ├── ConnectModal.tsx
│   │   │   │   ├── DisconnectToast.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   └── sections/
│   │   │       ├── Hero.tsx
│   │   │       ├── Statement.tsx
│   │   │       ├── CatchStory.tsx
│   │   │       ├── MutationLab.tsx
│   │   │       ├── Comparison.tsx
│   │   │       ├── Proof.tsx
│   │   │       ├── OnArc.tsx
│   │   │       ├── PlugsIn.tsx
│   │   │       ├── FinalCta.tsx
│   │   │       └── Footer.tsx
│   │   ├── hooks/
│   │   │   ├── useScrollProgress.ts
│   │   │   ├── useSkeinState.ts     (idle, reading, matched, collision)
│   │   │   ├── useRegistryFeed.ts
│   │   │   ├── useFundAndPledge.ts
│   │   │   ├── usePrefersReducedMotion.ts
│   │   │   └── useMediaQuery.ts
│   │   ├── lib/
│   │   │   ├── wagmi.ts             (arcMainnet chain, cookie storage)
│   │   │   ├── arc.ts               (chain constants, decimal guards, fee floor)
│   │   │   ├── canonicalise.ts      (browser-safe mirror of reader/src/canonicalise.ts)
│   │   │   ├── fingerprint.ts       (browser-safe mirror of reader/src/fingerprint.ts)
│   │   │   └── abi.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── public/
│   │   ├── logo.svg                 (not yet provided, comment slot until then)
│   │   ├── favicon.ico              (not yet provided, comment slot until then)
│   │   ├── skein-still.webp         (captured from the scene by scripts/capture-still.ts)
│   │   └── og.png                   (captured by scripts/capture-og.ts)
│   ├── scripts/
│   │   ├── capture-still.ts         (the mobile and reduced-motion background)
│   │   └── capture-og.ts            (1200x630 open graph card)
│   ├── vercel.json                  (rewrites, required for deep links)
│   ├── tailwind.config.ts
│   └── package.json
├── docs/
│   ├── FRICTION_LOG.md              (Arc behaviour the docs did not say, seeded with ten entries)
│   ├── LIMITATIONS.md               (honest gaps, seeded)
│   └── demo-transactions.json       (written by SeedDemo.s.sol, feeds the README table)
├── APP_BLUEPRINT.md
├── FRONTEND_SPEC.md
├── BUILD_GUIDE.md
├── MARKETING.md
├── CLAUDE.md
└── README.md
```

---

## Design System

All seven gates confirmed. Do not deviate from any value below.

**Aesthetic (Gate 1):** Bento grid operational
**Nav (Gate 2):** B1 scroll-progress line
**Background and motion (Gate 3):** 3D WebGL scene (6a + 6b + 6c) with parallax and mouse tracking (2a + 2b + 2c) over a coded isoline canvas, transitions A + B + D
**Fonts (Gate 4):** Schibsted Grotesk, Fragment Mono
**Palette (Gate 5):** Cold Paper
**Hero (Gate 6):** Top-left lead, bottom-right support
**Sections (Gate 7):** Ten sections, ten layout families

**Identity fingerprint:** top-left lead, bottom-right support / Swiss rational / pristine light / coded isoline canvas with procedural skein / editorial stagger / scroll-driven narrative

**Dials:** landing DESIGN_VARIANCE 7, MOTION_INTENSITY 7, VISUAL_DENSITY 5. App interior DESIGN_VARIANCE 4, MOTION_INTENSITY 2, VISUAL_DENSITY 8.

**Trend routing:** Blueprint Design primary, Surveillance Design supporting, used only inside the catch story. Colour strategy Restrained.

```css
@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;700&family=Fragment+Mono:ital@0;1&display=swap');
```

Full variable block, z-index scale, motion primitives, the SkeinScene specification and every section spec live in FRONTEND_SPEC.md. This list is the map, not the territory.

---

## Logo and Favicon

Neither exists yet. The owner is generating both. Leave both as plain comment slots:

```tsx
{/* Logo slot: replace with public/logo.svg once provided */}
```

```html
<!-- Favicon slot: replace with public/favicon.ico once provided -->
```

Never substitute a hardcoded placeholder, an AI-generated icon, a generated mark derived from the skein, or an emoji in either slot. The skein is a scene inside the page. It is not a brand mark and it never renders as a logo.

---

## Arc Integration

Arc mainnet, chain ID 5042, RPC `https://rpc.mainnet.arc.io`, explorer `https://explorer.arc.io`. Testnet is chain ID 5042002 with `https://rpc.testnet.arc.io` and the faucet at `https://faucet.circle.com`. Mainnet has no faucet.

Read `https://docs.arc.io/arc/references/evm-differences` before writing any contract or client code that touches balances, gas or events. The five behaviours that break a naive port:

| Arc behaviour | What Skein does |
|---|---|
| USDC is 18 decimals as native value and 6 decimals through the ERC-20 interface at `0x3600000000000000000000000000000000000000` | Every contract amount is native wei. `web/src/lib/arc.ts` exposes `toNativeUsdc` and `fromNativeUsdc` and nothing else converts. `balanceOf` is never used for a native movement |
| `maxFeePerGas` below 20 Gwei is dropped silently, no receipt, no error | Every sender asserts `maxFeePerGas >= 25n * 10n ** 9n` before broadcast and refuses to report success without a receipt |
| One ERC-20 USDC transfer emits two Transfer logs, 18 decimals from the system emitter `0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE` and 6 decimals from the token | The registry feed matches on emitter address and ignores the system emitter, so nothing is double counted |
| A value transfer to `address(0)` reverts, and the blocklist reverts at runtime while still consuming gas | `fundAndPledge` rejects a zero seller before any value moves, and the client surfaces a blocklist revert as a named state rather than a generic failure |
| `eth_estimateGas` is unreliable and the explorer API sits behind a Cloudflare challenge | Explicit gas limits on every write. Contract proof is runtime bytecode comparison against the local build, not an explorer API call |

Deterministic sub-second finality is what makes first-writer-wins meaningful. A recorded pledge cannot be reorganised, so the ordering the contract commits to is the ordering that holds.

```
read (client)      check(invoiceId) -> pledged, lender, blockNumber
fund (contract)    fundAndPledge{value: advance}(invoiceId, seller, amount, evidenceHash, verdictHash)
                   native USDC to seller + pledge recorded, or the whole call reverts
refuse (contract)  revert AlreadyPledged(invoiceId, firstLender, blockNumber)
release (lender)   releasePledge(invoiceId) voids a mistaken pledge before any repayment
repay (seller)     repay(invoiceId) sends the exact advance back and marks the receivable settled
```

The Memo predeploy at `0x5294E9927c3306DcBaDb03fe70b92e01cCede505` is available for attaching the invoice reference to a repayment, and it requires a direct EOA caller. It is listed under post-microgrant work, not MVP.

---

## Code Rules (follow without exception)

**Solidity:**
- NatSpec on every external, public and custom error
- No owner, no treasury, no pausable, no upgradeability in MVP. The registry is neutral by construction
- Amounts are native USDC in 18 decimals. Never mix `msg.value` with `IERC20.balanceOf`
- First-writer-wins is enforced by storage, not by a check-then-write in two transactions
- Custom errors, not `require` strings, so the refusal carries the first lender and block
- Tests run on `arc-anvil --network arc`. A test that only passes on plain anvil does not count

**TypeScript and React:**
- camelCase for all variables and functions
- JSDoc on every function and custom hook
- CSS variables from the design system used directly, never hardcoded hex in a component file
- CSS class-based hover states only, no inline `onMouseEnter` or `onMouseLeave` setting styles
- motion/react for component animation, GSAP ScrollTrigger only for the pinned catch story
- `useMotionValue` and `useSpring` for anything cursor-driven, never `useState`
- Blur-in entrance as the default: `initial={{ filter: 'blur(8px)', opacity: 0, y: 16 }}` to `{ filter: 'blur(0px)', opacity: 1, y: 0 }`
- Every `whileInView` uses `viewport={{ once: false, amount: 0.1 }}`. `once: true` is banned
- Loading states use skeleton shimmer, never spinners
- Never use `localStorage` or `sessionStorage`. wagmi uses `cookieStorage`, and the disconnect intent lives in a cookie
- No unlayered `*` reset in `globals.css`. Tailwind v4 preflight already covers it and an unlayered reset kills every spacing utility
- Sections are full width with an inner container. Never put `max-w-7xl mx-auto` on the `<section>` itself

**Reader pipeline:**
- `canonicalise.ts` is pure. No network, no AI, no randomness beyond the committed salt
- `extract.ts` is the only file that touches a provider. Swapping providers changes one file
- Replay mode reads committed fixtures, so the benchmark and the Mutation Lab run with no API key
- Fixtures are committed. Never commit a real invoice, a real party name or a real document

**Writing rules (all copy, labels, comments, JSDoc, README, docs):**
- British English throughout
- No em dashes anywhere
- Periods only when necessary
- Commas only when necessary
- Short direct sentences, no filler such as "seamlessly", "powerful", "cutting-edge", "unlock", "elevate", "leverage", "streamline"
- Logs are factual only, no celebration emoji, no ASCII art
- No lorem ipsum and no placeholder copy. Every headline and label in FRONTEND_SPEC.md is final text
- No invented numbers in UI copy. Live values come from the contract, benchmark values come from `reader/result/benchmark.json`

---

## Never Do These

- Never put invoice text, party names, amounts or due dates on-chain. Hashes only
- Never let a pledge be recorded without the funds moving, or funds move without the pledge. Both live in one transaction
- Never expose `OPENAI_API_KEY` to the browser. The reader runs in `web/src/app/api/reader/route.ts` only
- Never write a second pledge path. `fundAndPledge` is the only writer
- Never claim a detection rate that `benchmark.json` does not contain
- Never report a transaction as settled without a receipt
- Never deploy to mainnet from a script that has not run the full suite on `arc-anvil`
- Never commit a private key, and never log one

---

## Hackathon Checklist

- Project name: Skein
- Hackathon: Arc Microgrants | Circle, DoraHacks, `https://dorahacks.io/hackathon/arc-microgrants/detail`
- Deadline 14 October 2026 23:59 ET. Review is rolling, so submit as soon as the mainnet deployment is live
- Live Arc mainnet deployment with a link that opens
- Public GitHub repository with complete code
- Short description of what it does and what it uses Arc for
- Public builder profile on GitHub, X or Farcaster
- Ineligible: mockups, slide decks, testnet-only builds, anything with no Arc component, anything already funded by a Circle or Arc programme

### To maximise your odds

- Put the verified mainnet contract address and 5+ real transaction links at the top of the README.
- Add a short friction log of Arc surprises (as Legwork does) and an honest limitations section.
- Ship a benchmark and recorded fixtures, so judges can reproduce results without API keys.
- Fund the deployer with $10-15 of real USDC. Mainnet has no faucet and fake bridge sites exist. Review is rolling, so submit early.

---

## Documents Not Generated Yet

CRYPTO_SKILL.md asks a Category A on-chain product for PRODUCT.md, WHITEPAPER.md, FAQ.md, TEAM_OPS.md and DOCS.md. Four are deferred on purpose, because the microgrant window is thirteen days and the judging criteria are relevance to Arc, technical credibility, quality of what was built and whether it is worth taking further.

| Document | Status | Reason |
|---|---|---|
| PRODUCT.md | Covered | Its content lives in APP_BLUEPRINT.md, MVP Feature Set and User Flows |
| WHITEPAPER.md | Deferred | Write it after the microgrant, once mainnet numbers are real |
| FAQ.md | Deferred | Needs live fee and access answers that do not exist yet |
| TEAM_OPS.md | Deferred | No treasury and no review process in MVP |
| DOCS.md | Deferred | CRYPTO_SKILL.md says generate at the start of the mainnet phase. The MCP tool stub in BUILD_GUIDE.md Phase 5 is the first slice |
