# Skein

An invoice can only be financed once.

## On Arc Mainnet

| | |
|---|---|
| **Contract** | `<REGISTRY_ADDRESS>` |
| **Chain** | Arc mainnet, ID `5042` |
| **RPC** | `https://rpc.mainnet.arc.io` |
| **Explorer** | `https://explorer.arc.io/address/<REGISTRY_ADDRESS>` |
| **Bytecode** | Runtime bytecode verified against the local Foundry build, recorded in `contracts/deployments/mainnet.json` |

### Live transactions

| # | What happened | Hash | Result |
|---|---|---|---|
| 1 | Lender A funds invoice NG-2291 and records the pledge | `<TX_1>` | Confirmed |
| 2 | Lender B presents a reissued copy of NG-2291 | `<TX_2>` | Reverted, `AlreadyPledged` |
| 3 | Free pre-flight `check()` on the same id | `<TX_3>` | Call, no gas |
| 4 | Lender A funds a genuinely distinct invoice, NG-2402 | `<TX_4>` | Confirmed |
| 5 | Seller repays NG-2291 | `<TX_5>` | Confirmed, settled |

Transaction 2 is the product. It reverted, and the revert names the lender and block that got there first.

Both hashes are filled in by `contracts/script/SeedDemo.s.sol`, which writes `docs/demo-transactions.json` as it runs. The values above are placeholders until that script has run on mainnet.

---

## What It Does

Receivables can be copied. An invoice is a document, and a document can be renamed, reformatted, rounded and rescanned into something that looks new. Financing registers sit inside each lender's own book, and filings where they exist are at debtor level rather than invoice level, so no lender can see what another lender has already funded. First Brands and Tricolor are the recent alleged cases, and in both the reported scale runs into the billions.

Skein is the shared register that was missing.

1. A lender uploads an invoice
2. The reader extracts the fields, and `canonicalise.ts` normalises them so that cosmetic changes collapse to the same values
3. Five salted keys combine into a fingerprint root, and the contract hashes it into an `invoiceId`
4. `check(invoiceId)` is a free view call that says whether the slot is taken
5. If it is free, `fundAndPledge` pays the seller and records the pledge in one transaction
6. If it is taken, the call reverts with `AlreadyPledged(invoiceId, lender, blockNumber)`

Only hashes go on-chain. No invoice text, no party names, no amounts.

## Why Arc

USDC is Arc's native asset, so the advance moves as `msg.value` and the pledge is recorded in the same call, with no approval, no allowance and no second token for gas. Finality is deterministic, which is the only reason a first-writer-wins rule means anything. The contract suite runs on `arc-anvil --network arc`, because plain anvil cannot reproduce Arc's decimal duality, blocklist reverts or 20 gwei fee floor. Reads batch through the Multicall3 predeploy, so the public feed never needs a wide log range against a capped RPC.

`docs/FRICTION_LOG.md` records what Arc did that the docs did not say.

## Install

```bash
git clone <REPO_URL> && cd skein
pnpm install --dir reader
pnpm install --dir web
cd contracts && forge install && cd ..
```

Requirements: Node 20 or newer, pnpm 9 or newer, Foundry with Arc Foundry on PATH, Solidity 0.8.28.

## Run It

```bash
# 1. local chain that behaves like Arc
arc-anvil --network arc

# 2. contracts
cd contracts && forge test --network arc -vv

# 3. reader and benchmark, no API key needed
cd ../reader && SKEIN_REPLAY=1 pnpm test && SKEIN_REPLAY=1 pnpm benchmark

# 4. web
cd ../web && cp .env.example .env.local && pnpm dev
```

`SKEIN_REPLAY=1` replays committed fixtures instead of calling a provider. It is the default in CI and in the deployed demo.

## Reproduce The Benchmark

```bash
cd reader
SKEIN_REPLAY=1 pnpm benchmark
sha256sum result/benchmark.json
```

The output must match the committed hash in `result/benchmark.json.sha256`. If it does not, the fingerprint is not deterministic and the claim on the landing page is wrong.

100 mutated invoices across five classes, plus 20 distinct invoices that share one payer for the false-positive measurement:

| Class | What changes |
|---|---|
| `rename` | Party legal form and casing |
| `reformat` | Template, field order, layout, letterhead |
| `round` | Total restated to whole units |
| `rescan` | OCR noise, spacing, character substitutions |
| `reissue` | New invoice reference, same parties, amount and period |

The results rendered on the landing page are read from `reader/result/benchmark.json`. Nothing in the UI is typed by hand.

## Contract Interface

| Function | Caller | Payable | Description |
|---|---|---|---|
| `invoiceId(fingerprintRoot)` | anyone | no | Registry key from a fingerprint root |
| `check(id)` | anyone | no | Free pre-flight read, safe for an agent to call in a loop |
| `fundAndPledge(id, seller, evidenceHash, verdictHash)` | lender | advance | Pays the seller and records the pledge, or reverts |
| `releasePledge(id)` | the lender | no | Voids an unsettled mistaken pledge |
| `repay(id)` | the seller | exact advance | Settles the receivable |
| `recentIds(from, count)` | anyone | no | Paged id list for the public feed |
| `lenderIds(lender)` | anyone | no | One lender's history |
| `getPledge(id)` | anyone | no | Full pledge record |

No owner, no treasury, no pause, no upgrade path, no fee in MVP.

## Integrate

Two calls. Read before you list or lend, write when you fund.

```typescript
const { pledged, lender, blockNumber } = await client.readContract({
  ...skeinRegistry,
  functionName: 'check',
  args: [invoiceId],
})

if (pledged) return { ok: false, reason: 'AlreadyPledged', lender, blockNumber }

const hash = await walletClient.writeContract({
  ...skeinRegistry,
  functionName: 'fundAndPledge',
  args: [invoiceId, seller, evidenceHash, verdictHash],
  value: parseUnits('84200', 18),        // native USDC on Arc is 18 decimals
  maxFeePerGas: 25_000_000_000n,         // below 20 gwei Arc drops it silently
})
```

Luminest is integrator number one: `check()` before listing a receivable, `fundAndPledge()` when a bid is accepted.

The MCP tool at `reader/src/mcp/check.ts` exposes `skein.check` and `skein.fingerprint` over stdio for agent lenders. It is a stub, and it is labelled as one.

## Routes

| Route | Wallet | What it is |
|---|---|---|
| `/` | no | The landing page, ten sections |
| `/registry` | no | Public read-only feed of live pledges |
| `/app/check` | yes | Upload, fingerprint, verdict, fund, receipt |
| `/app/pledges` | yes | The connected lender's pledge history |

## Repository

```
contracts/   SkeinRegistry.sol, tests, deploy and seed scripts
reader/      extract, canonicalise, fingerprint, benchmark, fixtures, MCP stub
web/         Next.js app, landing page, workspace, R3F scene
docs/        FRICTION_LOG.md, LIMITATIONS.md, demo-transactions.json
```

Design and build documentation: `CLAUDE.md`, `APP_BLUEPRINT.md`, `FRONTEND_SPEC.md`, `BUILD_GUIDE.md`, `MARKETING.md`.

## Limitations

Read `docs/LIMITATIONS.md` before integrating. The short version: partial key matches are advisory and never block on-chain, `releasePledge` reopens a slot after the advance has already reached the seller, there is no dispute mechanism, and the reader depends on a third-party model whose output the contract cannot verify.

## Built For

Arc Microgrants | Circle on DoraHacks. Submissions opened 16 September 2026, deadline 14 October 2026 23:59 ET, review rolling, decisions by 21 October.
