# Skein — Build Guide

Thirteen days from today to the deadline. Review is rolling, so a working mainnet deployment on day eight beats a perfect one on day fourteen.

## Before You Write a Single Line of Code

Read `CLAUDE.md` and `FRONTEND_SPEC.md` section 0 in full. The token block, the z-scale and the layout primitives are not suggestions. Then read `https://docs.arc.io/arc/references/evm-differences` once, end to end. It is short and it is the reason a working Ethereum prototype fails on Arc.

## Prerequisites

| Requirement | Version or note |
|---|---|
| Node.js | 20 LTS or newer |
| pnpm | 9 or newer, used for `web/` and `reader/` |
| Foundry | latest, plus Arc Foundry from `circlefin/arc-foundry` |
| `arc-anvil` | must be on PATH. Plain `anvil` cannot reproduce Arc behaviour |
| Solidity | 0.8.28 |
| OpenZeppelin | v5, contracts only, no upgradeable packages |
| Playwright | dev dependency in `web/`, for the still capture script |

### Fund the deployer first

Mainnet has no faucet. Before anything deploys:

1. Create a dedicated deployer wallet. Never a personal wallet, never a wallet that holds anything else
2. Buy 10 to 15 USDC on an exchange that lists a direct Arc withdrawal, or bridge through Circle CCTP with Arc as domain `26`, or through Across
3. Do not search for "Arc bridge". Fake bridge sites exist and they are indexed. Use only `https://www.circle.com/cctp` and `https://docs.arc.io`
4. Confirm the balance with `cast balance --rpc-url https://rpc.mainnet.arc.io $DEPLOYER` and remember that native balance is USDC in 18 decimals
5. Send one 1 USDC transfer to yourself and confirm it lands. If that works, the deployer works

Budget: deployment under 0.05 USDC in gas, each demo transaction around 0.0004 USDC for a transfer and a little more for `fundAndPledge`. Fifteen USDC leaves ample headroom for redeployments.

### Keys

`DEPLOYER_PRIVATE_KEY` lives in `contracts/.env`, which is gitignored. `OPENAI_API_KEY` lives in `web/.env.local` and `reader/.env`, both gitignored. Neither is ever prefixed `NEXT_PUBLIC_`. Add `.env` and `.env.local` to `.gitignore` in the same commit that creates them, not later.

## Repository Setup

```bash
mkdir skein && cd skein
git init -b main

mkdir -p contracts reader web docs

cat > .gitignore <<'EOF'
node_modules/
dist/
.next/
out/
coverage/
.env
.env.local
*.log
contracts/out/
contracts/cache/
web/public/skein-still.webp.tmp
EOF

cat > .editorconfig <<'EOF'
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
EOF
```

---

## Phase 1 — Smart Contracts

### Step 1.1: Foundry project

```bash
cd contracts
forge init --no-git --force
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0
```

`foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"
optimizer = true
optimizer_runs = 200
evm_version = "osaka"
ffi = false

[fuzz]
runs = 512

[invariant]
runs = 128
depth = 32
```

`remappings.txt`:

```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
forge-std/=lib/forge-std/src/
```

`evm_version = "osaka"` matters. Arc's baseline is Osaka, and `PREVRANDAO` always returns zero there, so no contract logic may depend on it.

### Step 1.2: SkeinRegistry

Write `src/SkeinRegistry.sol` exactly as specified in `APP_BLUEPRINT.md`. NatSpec on every external, every public and every custom error.

Four rules that are Arc specific and easy to miss:

- Amounts are native USDC in 18 decimals. `msg.value` is the advance. Never call `IERC20.balanceOf` to size a native movement
- A value transfer to `address(0)` reverts, so `ZeroSeller` is checked before any state change
- A native value transfer to a contract is not guaranteed to succeed, so the low-level call result is checked and the whole call reverts with it
- `delete pledges[id]` in `releasePledge` is deliberate. It reopens the slot, and the history survives in the event log

### Step 1.3: Tests

`test/SkeinRegistry.t.sol` cases, all on `arc-anvil`:

| Case | Asserts |
|---|---|
| First pledge succeeds | Slot written, seller balance up by `msg.value`, `pledgeCount` incremented, `ids` appended |
| Second pledge reverts | `AlreadyPledged` with the first lender and the first block number in the error data |
| Fuzz: check agrees with write | For any random id, `check` never says free when `fundAndPledge` would revert, and never says pledged when it would succeed |
| Rejecting seller | A receiver contract that reverts on receive leaves the slot empty |
| Zero seller | Reverts `ZeroSeller` before any value moves |
| Zero amount | Reverts `ZeroAmount` |
| Release reopens | After `releasePledge`, a different lender can fund the same id |
| Release access control | A non-lender caller reverts `NotLender` |
| Repay exact | `WrongRepayment` on any amount other than the advance, `settled` true on the exact amount |
| Repay access control | A non-seller caller reverts `NotSeller` |
| Invariant: one lender per id | No sequence of calls ever produces two live pledges for one id |

`test/ArcBehaviour.t.sol` proves the chain assumptions rather than the product logic:

- A native transfer of `1e18` moves exactly one USDC as reported by the token's 6-decimal view, showing the truncation is expected and not a bug
- One ERC-20 USDC transfer emits two Transfer logs, and the system emitter `0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE` carries 18 decimals
- `maxFeePerGas` at `19 gwei` produces no receipt

```bash
arc-anvil --network arc &
forge test --network arc -vv
```

Do not proceed to deployment on a red suite. Do not proceed on a suite that has only ever run on plain `anvil`.

### Step 1.4: Deployment

`script/Deploy.s.sol` reads `SKEIN_SALT`, defaulting to `keccak256("skein.v1")`, deploys with explicit `maxFeePerGas` of `25 gwei`, waits for the receipt, and writes the address and salt to `contracts/deployments/mainnet.json`.

The explorer API sits behind a Cloudflare challenge, so verification is not an API call. Verify locally instead:

```bash
DEPLOYED=$(cast code $REGISTRY --rpc-url https://rpc.mainnet.arc.io)
LOCAL=$(jq -r '.deployedBytecode.object' out/SkeinRegistry.sol/SkeinRegistry.json)
[ "0x$LOCAL" = "$DEPLOYED" ] && echo "bytecode match" || echo "MISMATCH"
```

Record the constructor arguments beside the address in `deployments/mainnet.json` so anyone can reproduce the bytecode from source. Put the address into `web/.env.local` as `NEXT_PUBLIC_REGISTRY_ADDRESS` immediately.

### Step 1.5: Seed the demo

`script/SeedDemo.s.sol` produces the five transactions the README leads with, using two funded wallets so the refusal is genuine rather than simulated:

| # | Transaction | Purpose |
|---|---|---|
| 1 | `fundAndPledge` from lender A on fixture invoice NG-2291 | The first pledge |
| 2 | `fundAndPledge` from lender B on the `reissue` mutation of NG-2291 | The refusal, `AlreadyPledged` |
| 3 | `check` on the same id | The free pre-flight read, logged as a call |
| 4 | `fundAndPledge` from lender A on a genuinely distinct invoice NG-2402 | Proves the registry does not over-block |
| 5 | `repay` from the seller on NG-2291 | Proves the lifecycle closes |

Transaction 2 reverts, so it will not appear as a successful receipt. Capture its hash anyway from the client error and record it in the README with the note that it reverted, which is the point. Write all five to `docs/demo-transactions.json` as the script runs.

---

## Phase 2 — Reader Pipeline

### Step 2.1: Package setup

```bash
cd reader
pnpm init
pnpm add viem openai
pnpm add -D typescript tsx vitest
```

`tsconfig.json` targets `ES2022` with `"module": "NodeNext"` and `"strict": true`. Add scripts: `"benchmark": "tsx src/benchmark.ts"`, `"test": "vitest run"`.

### Step 2.2: Extract behind an interface

`src/extract.ts` defines the interface. `src/providers/openai.ts` implements it. `src/providers/fixtures.ts` implements the same interface by replaying committed JSON. Nothing outside `src/providers/` imports a provider.

The OpenAI implementation uses structured outputs with a strict JSON schema matching `ExtractedInvoice`, and vision for image and PDF input. Every field carries a confidence from 0 to 1, and a field below `0.6` is flagged in the verdict so the lender sees what the reader was unsure about.

`SKEIN_REPLAY=1` selects the fixture provider. It is the default in CI, in the deployed demo and in the benchmark, so a judge never needs a key.

### Step 2.3: Canonicalise and fingerprint

`src/canonicalise.ts` and `src/fingerprint.ts` are pure. Unit test them directly:

- "Northgate Freight Ltd", "NORTHGATE FREIGHT LIMITED" and "Northgate Freight" produce one `partyKey`
- `84200.00` and `84200` and `84,200.00` produce one `amountKey`
- `04/03/2026` and `2026-03-04` produce one `periodKey`
- `NG-2291`, `ng 2291` and `NG/2291` produce one `refKey`
- Two line-item lists in a different order with the same contents produce one `contentKey`

The legal-suffix list and the currency exponent table are committed constants, never fetched.

### Step 2.4: Fixtures

`fixtures/invoices/` holds 20 base invoices. `fixtures/mutations/` holds 100 variants, five classes across those twenty:

| Class | What changes | Why it is the hard case |
|---|---|---|
| `rename` | Party legal form and casing | A suffix change is the cheapest disguise |
| `reformat` | Template, field order, layout, letterhead text | A document hash changes completely, the receivable does not |
| `round` | Total restated to whole units | Common when a reseller re-keys a schedule |
| `rescan` | OCR noise, spacing, character substitutions | Every real pipeline sees this |
| `reissue` | New invoice reference, same parties, amount and period | The classic double-pledge disguise |

Plus `fixtures/distinct/`, twenty genuinely different invoices that share one payer, for the false-positive measurement. These are synthetic. Never commit a real invoice, a real party name or a real document, and never generate fixtures from a client engagement.

### Step 2.5: Benchmark

`src/benchmark.ts` runs both pipelines over all fixtures and writes `result/benchmark.json` in the `BenchmarkResult` shape from `APP_BLUEPRINT.md`. It also prints a table to stdout.

```bash
SKEIN_REPLAY=1 pnpm benchmark
sha256sum result/benchmark.json
```

Commit both the JSON and its hash. CI reruns the benchmark and fails if the hash differs, which is what makes "reproducible without an API key" a claim the repo can defend rather than a sentence in a README.

---

## Phase 3 — Frontend

### Step 3.1: Project setup

```bash
cd web
pnpm create next-app@14 . --typescript --tailwind --app --src-dir --eslint --no-import-alias
pnpm add wagmi viem @tanstack/react-query motion gsap three @react-three/fiber @react-three/drei
pnpm add -D @types/three playwright sharp
```

Tailwind v4: `globals.css` holds the `@import "tailwindcss"` line, then the `:root` variables, then `@theme inline`, then `@layer base` and `@layer utilities`, in that order, exactly as in `FRONTEND_SPEC.md` section 1. Confirm no unlayered `*` reset survived the scaffold. Delete it if it did.

### Step 3.2: Chain and wallet

`src/lib/arc.ts`:

```typescript
import { defineChain } from 'viem'

/** Arc mainnet. USDC is the native asset and carries 18 decimals. */
export const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  network: 'arc-mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.arc.io'] },
    public: { http: ['https://rpc.mainnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' },
  },
})

/** Arc drops a transaction below this floor silently, with no receipt. */
export const MIN_MAX_FEE_PER_GAS = 25_000_000_000n

/** Converts a decimal string to native USDC wei. The only converter in the app. */
export function toNativeUsdc(value: string): bigint { ... }

/** Converts native USDC wei to a display string with up to six decimals. */
export function fromNativeUsdc(wei: bigint): string { ... }
```

`src/lib/wagmi.ts` uses `createStorage({ storage: cookieStorage })` with `ssr: true`, one HTTP transport plus one fallback transport, and no coinbase or injected-only connector list. Cookie storage is what satisfies the no-localStorage rule while keeping the wallet connected across reloads.

### Step 3.3: Build order

Follow `FRONTEND_SPEC.md` section 8 exactly. Tokens and wallet plumbing first, then the scene, then the cheap sections, then the capture script, then the two hard sections, then the app screens.

Three things to check as you go:

- The scene mounts once. Navigate between `/`, `/registry` and `/app/check` and confirm the WebGL context count stays at one
- Every `whileInView` reads `once: false`. Grep for it
- `grep -rn "onMouseEnter" src/` returns nothing that sets style

### Step 3.4: The reader route

`src/app/api/reader/route.ts` accepts multipart, caps the body at 10 MB, calls `extract.ts` server-side, then `canonicalise` and `fingerprint`, then reads `check(invoiceId)` from the chain, and returns the `Verdict`. It runs with `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'`. The API key never leaves the server. When `SKEIN_REPLAY=1` the route uses the fixture provider, which is the deployed default so a judge cannot exhaust a key by uploading documents.

### Step 3.5: Vercel

`vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Next.js handles most routing, but the rewrite covers any deep link that reaches the edge before a route match, which is what stops `/app/check` from showing a host 404 in a fresh disconnected session. Set `OPENAI_API_KEY`, `SKEIN_REPLAY`, `NEXT_PUBLIC_REGISTRY_ADDRESS`, `NEXT_PUBLIC_SALT`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_FALLBACK_RPC_URL`, `NEXT_PUBLIC_EXPLORER_URL` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in the Vercel project settings.

---

## Phase 4 — Public Reads Without An Index

The public RPC caps `eth_getLogs` at a 10,000-block range and 429s under burst, and there is no public WebSocket. So:

- `/registry` reads `pledgeCount()` and `recentIds(from, count)` and then `getPledge(id)` per row, batched through Multicall3 at `0xcA11bde05977b3631167028862bE2a173976CA11`
- Event listening is polling at 4s with `viem`'s `watchEvent` over a fallback transport, never a socket
- Contract proof is runtime bytecode comparison, never an explorer API call
- No page depends on a range wider than the Multicall3 batch

If the public RPC 429s during a demo, the fallback transport takes over and the UI shows a one-line notice naming the endpoint. That behaviour is worth keeping visible; it is honest and it is a friction-log entry.

---

## Phase 5 — Agent Surface And Docs

The MCP tool stub ships as a single file, `reader/src/mcp/check.ts`, exposing `skein.check(invoiceId)` and `skein.fingerprint(canonicalInvoice)` over stdio. It wraps the same free view call the web app uses. It is a stub, and it is labelled as one in the README, because an agent lender integration cannot be finished inside the window. Do not oversell it in the submission.

Create `docs/FRICTION_LOG.md` and `docs/LIMITATIONS.md` on day one and fill them in as things happen. A friction log written from memory at the end reads as marketing. Each entry is a table row: what was expected, what Arc actually did, how it was measured, what changed in the repo.

Seed entries, all verified during research:

| Expected | Actual | Change made |
|---|---|---|
| A mainnet faucet exists | It does not. Testnet has one at `faucet.circle.com`, mainnet needs real USDC | Deployer funded through CCTP domain 26 |
| USDC is 6 decimals everywhere | 18 as native value, 6 through the ERC-20 interface, and `balanceOf` truncates | One converter in `lib/arc.ts` |
| One transfer emits one log | Two, from the system emitter and from the token | Feed matches on emitter address |
| A low gas price fails loudly | Below 20 gwei it is dropped with no receipt | Client asserts 25 gwei before broadcast |
| `eth_estimateGas` is reliable | It is not, especially on testnet | Explicit gas limits on every write |
| The explorer has a public API | `/api` sits behind a Cloudflare challenge | Runtime bytecode comparison instead |
| `anvil` is enough locally | It cannot reproduce Arc behaviour | `arc-anvil --network arc` |

---

## Phase 6 — Quality Audit

Run every check before submitting.

```bash
cd contracts && forge test --network arc -vv && forge snapshot
cd ../reader && SKEIN_REPLAY=1 pnpm test && SKEIN_REPLAY=1 pnpm benchmark && sha256sum result/benchmark.json
cd ../web && pnpm lint && pnpm build && pnpm exec tsc --noEmit
cd .. && grep -rn -- "--" --include="*.ts" --include="*.tsx" --include="*.sol" --include="*.md" . | grep -v "node_modules" || echo "no em dashes"
grep -rn "localStorage\|sessionStorage\|animate-spin\|once: true\|onMouseEnter" web/src || echo "clean"
grep -rn "#[0-9a-fA-F]\{6\}" web/src/components || echo "no hardcoded hex in components"
```

Then by hand:

- Load `/` on a 375px viewport and confirm the still renders and no canvas mounts
- Toggle reduced motion and confirm the catch story becomes four stacked panels
- Load `/app/check` in a fresh private window with no wallet and confirm the branded connect panel, never a 404
- Load `/registry` with the RPC blocked in devtools and confirm the error names the endpoint and offers retry
- Run the full lender flow on mainnet with 1 USDC and confirm the receipt shows in the explorer
- Confirm the Proof section numbers match `benchmark.json` byte for byte

---

## Final Checklist

- Live Arc mainnet deployment, contract address in `README.md` at the top, five transaction links beside it
- Runtime bytecode match recorded in `contracts/deployments/mainnet.json`
- Public repository, complete code, README with install and usage instructions
- `reader/result/benchmark.json` committed with its hash, reproducible with no API key
- `docs/FRICTION_LOG.md` and `docs/LIMITATIONS.md` filled in from real events
- Builder profile public on GitHub, X or Farcaster
- `vercel.json` rewrites in place and the deployed site serving deep links
- Submission filed early, because review is rolling

### To maximise your odds

- Put the verified mainnet contract address and 5+ real transaction links at the top of the README.
- Add a short friction log of Arc surprises (as Legwork does) and an honest limitations section.
- Ship a benchmark and recorded fixtures, so judges can reproduce results without API keys.
- Fund the deployer with $10-15 of real USDC. Mainnet has no faucet and fake bridge sites exist. Review is rolling, so submit early.
