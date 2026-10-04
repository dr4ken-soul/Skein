# Skein — App Blueprint

## Product Summary

Skein is a neutral on-chain registry that stops one invoice from being financed twice. A lender runs an invoice through the reader. The AI pipeline extracts the fields, `canonicalise.ts` normalises them into a canonical form that survives renaming, reformatting, rounding and rescanning, and five salted keys combine into a fingerprint root. The contract turns that root into an `invoiceId`, checks whether it is already pledged, and if it is free the lender funds the seller and records the pledge in one atomic transaction. A second attempt to finance the same receivable reverts with `AlreadyPledged` and names the lender and block that got there first.

Only hashes go on-chain. No invoice text, no party names, no amounts.

Built for Arc Microgrants | Circle on DoraHacks, deadline 14 October 2026 23:59 ET, review rolling, decisions by 21 October. Arc is not a convenience here. First-writer-wins is only meaningful if the write that lands first cannot be reorganised, and Arc gives deterministic sub-second finality with USDC as the native asset, so funding the seller and recording the pledge are one transaction in one currency with no approval step.

---

## Market Context

**Who this is for:**

1. Invoice financiers and factors who currently verify a receivable against their own portfolio only, because no shared register exists. Their exposure is the same invoice arriving twice, from two different sellers or from one seller twice
2. Marketplaces and platforms that list tokenised receivables, including Luminest, which needs a trust layer it does not have. Luminest is integrator number one, and the integration is a read call plus one write call
3. Agent lenders and treasury agents that fund receivables programmatically. An agent cannot read a PDF and cannot ask a human, so it needs a `check()` it can call before it moves USDC

**What they use today:** their own loan book, a UCC or equivalent filing where one exists, and manual review of borrower-supplied schedules. Filings are at debtor level, not invoice level, and none of them deduplicate across lenders.

**Why they switch:** the failure is structural, not careless. Receivables can be copied exactly, so the same document with the same reference can be presented to several funders at once and each one believes it holds exclusive rights to that cash flow. First Brands and Tricolor are the recent alleged cases, and in both the common thread is that each funder checked the collateral against its own records and never against a shared one.

**Why no fee in MVP:** a neutral registry that takes a cut of every pledge invites a rival registry, and a rival registry defeats the purpose. MVP has no owner, no treasury and no fee. Monetisation is a post-microgrant decision, most likely a paid reader API rather than a toll on the register itself.

---

## MVP Feature Set

### Feature 1: First-Writer-Wins Receivable Registry

**User story:** As a lender I want the first pledge on a receivable to be the only pledge, so that a second financier cannot fund the same invoice behind my back.

**How it works:** `invoiceId = keccak256(salt, fingerprintRoot)` where `salt` is a public immutable set at deploy. `pledges[id]` holds lender, seller, advance, evidence hash, verdict hash, block number and settled flag. `fundAndPledge` writes the record and sends the advance in the same call. If the slot is taken it reverts with `AlreadyPledged(id, firstLender, blockNumber)`. There is no owner, no pause and no upgrade path, so nobody can rewrite the ordering after the fact.

**Acceptance criteria:** on `arc-anvil --network arc`, a second `fundAndPledge` for the same id reverts with the first lender's address and block number in the error data. On mainnet, the seeded demo shows one successful pledge and one refusal with a receipt for each. `check(id)` returns the same answer a `fundAndPledge` would enforce, verified by a fuzz test that never lets the two disagree.

**Complexity:** Medium

---

### Feature 2: AI Invoice Reader With Canonical Fingerprints

**User story:** As a lender I want a reformatted, renamed or rescanned copy of the same invoice to produce the same fingerprint, so that cosmetic changes cannot create a second financeable receivable.

**How it works:** `extract.ts` calls the provider behind an interface and returns a typed field set with a per-field confidence. `canonicalise.ts` is pure and deterministic: party names are lowercased, stripped of punctuation and of legal-form suffixes, amounts become integer minor units with an ISO currency code, dates become ISO 8601 dates, references are uppercased and stripped to alphanumerics, line items are sorted by canonical description with quantities in 1e6 fixed point. Five salted keys come out of that: `partyKey`, `amountKey`, `periodKey`, `refKey`, `contentKey`. The root is their hash.

Near-match scoring is advisory only. If four of five keys match an existing pledge, the reader says "probable duplicate" in the UI and shows which key differs. It never blocks on-chain, because a partial-key block would lock out genuinely distinct invoices that share a payer and a period. The on-chain gate is the full root.

**Acceptance criteria:** the benchmark runs 100 mutations across five classes and reports per-class detection for Skein and for a plain SHA-256 of the document text. Replay mode produces byte-identical output with no API key. A committed fixture set of 20 distinct invoices that share one payer produces zero false positives.

**Complexity:** High

---

### Feature 3: Atomic Fund And Pledge

**User story:** As a lender I want my USDC to reach the seller and my claim to be recorded in the same transaction, so that neither can happen without the other.

**How it works:** `fundAndPledge` is `payable` and takes the advance as `msg.value` in native USDC, 18 decimals. It records the pledge, then sends the value to the seller with a checked low-level call. On Arc a native value transfer to a contract is not guaranteed to succeed and a blocklisted recipient reverts at runtime, so the call result is checked and the whole transaction reverts if the send fails. No approval, no allowance, no second token for gas.

**Acceptance criteria:** a seller address that rejects value leaves the registry slot empty, proven by a test with a rejecting receiver contract. A zero seller reverts before any value moves. The client refuses to broadcast below the 20 Gwei fee floor and refuses to show a settled state without a receipt.

**Complexity:** Medium

---

### Feature 4: Mutation Benchmark With Committed Fixtures

**User story:** As a judge or an integrating lender I want to see how often the fingerprint actually catches a disguised duplicate, without paying for an API key to find out.

**How it works:** `reader/fixtures/invoices` holds 20 base invoices as field sets plus document text. `reader/fixtures/mutations` holds 100 variants across five classes: rename, reformat, round, rescan, reissue. `benchmark.ts` runs both pipelines and writes `reader/result/benchmark.json`. That file is committed, and the Proof section on the landing page reads it. `canonicalise.ts` and `fingerprint.ts` are mirrored into the browser bundle so the Mutation Lab runs the real code client-side with no network call.

**Acceptance criteria:** `npm run benchmark` in `reader/` with `SKEIN_REPLAY=1` and no API key reproduces the committed JSON exactly, checked in CI by hashing the output. Every number shown in the UI traces to a field in that file.

**Complexity:** Medium

---

### Feature 5: Public Registry Feed And Check Workspace

**User story:** As a seller, an auditor or a curious builder I want to read what has been pledged without connecting a wallet, and as a lender I want one place to run a document and fund it.

**How it works:** `/registry` is public and reads an ordered `ids` array plus `pledgeCount` from the contract, so it never needs a wide `eth_getLogs` against a public RPC that caps the range at 10,000 blocks. `/app/check` is wallet-gated and runs upload, extract, canonicalise, verdict, fund, receipt. `/app/pledges` reads the lender index `idsByLender[msg.sender]`.

**Acceptance criteria:** `/registry` renders with no wallet and no API key, showing live rows. `/app/check` in a fresh disconnected session shows the branded landing page, never a host 404. Every number on both pages is a contract read or a committed fixture.

**Complexity:** Medium

**What makes this the one that matters for judging:** the refusal is the product. A lender funds an invoice, a second lender presents a cosmetically altered copy, and a live mainnet transaction reverts naming the first lender and block. Everything else exists to make that moment credible.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 App Router, TypeScript | SSR for the landing page, a server-only route for the reader so the API key never reaches the browser, wagmi providers work cleanly |
| Styling | Tailwind CSS v4 | Matches FRONTEND_SPEC.md exactly. No unlayered reset, see the cascade rule |
| Component animation | motion/react | Correct import path for v11+, used for entrances, hovers and the wallet menu |
| Scroll choreography | GSAP ScrollTrigger | The pinned catch story needs a scrubbed timeline. MOTION_INTENSITY is 7, which is the threshold where GSAP is the right tool |
| 3D | three, @react-three/fiber, @react-three/drei | The skein is procedural, no model files, so bundle cost stays near the library floor |
| Wallet | wagmi v2 + viem | Best-in-class EVM library, viem-native chain config, cookie storage available for the no-localStorage rule |
| Contracts | Solidity 0.8.28, Foundry, OpenZeppelin v5 | Foundry gives fast fuzz and invariant tests, which is what a first-writer-wins gate needs |
| Local chain | Arc Foundry, `arc-anvil --network arc` | Plain anvil runs a standard EVM and cannot reproduce Arc's USDC, blocklist or fee behaviour |
| AI reader | OpenAI structured outputs plus vision | Handles PDFs and phone photos of paper invoices. Behind `extract.ts` so the provider is one file |
| Fixtures | Committed JSON | Judges reproduce the benchmark with no key. Replay mode is the default in CI |
| Database | None for MVP | The register is the chain. An off-chain copy could disagree with it, and disagreement is the entire problem this product exists to end |
| Hosting | Vercel | Standard for Next.js, `vercel.json` rewrites cover deep links |

---

## Reader Pipeline Detail

### Canonicalisation and fingerprints

```typescript
/**
 * Normalises one extracted invoice into the canonical field set that the
 * fingerprint keys are derived from. Pure and deterministic, no network,
 * no AI, no randomness beyond the committed salt.
 * @param raw - the field set returned by extract.ts
 * @returns the canonical form, safe to hash
 */
export function canonicalise(raw: ExtractedInvoice): CanonicalInvoice {
  return {
    drawer: canonicalParty(raw.drawer),
    payer: canonicalParty(raw.payer),
    currency: raw.currency.toUpperCase(),
    totalMinor: toMinorUnits(raw.total, raw.currency),
    issuedOn: toIsoDate(raw.issuedOn),
    dueOn: toIsoDate(raw.dueOn),
    reference: canonicalReference(raw.reference),
    lineHash: canonicalLineHash(raw.lines),
  }
}

/**
 * Derives the five salted keys and the fingerprint root. Every key is
 * salted so a low-entropy field such as a short invoice number cannot be
 * enumerated by an outsider who does not hold the salt.
 * @param invoice - the canonical form
 * @param salt - the deployed registry salt, keccak256("skein.v1")
 * @returns the five keys plus the root that the contract hashes again
 */
export function fingerprint(invoice: CanonicalInvoice, salt: `0x${string}`): Fingerprint {
  const partyKey = keccak(salt, invoice.drawer, invoice.payer)
  const amountKey = keccak(salt, invoice.currency, invoice.totalMinor)
  const periodKey = keccak(salt, invoice.issuedOn, invoice.dueOn)
  const refKey = keccak(salt, invoice.reference)
  const contentKey = keccak(salt, invoice.lineHash)

  return {
    partyKey,
    amountKey,
    periodKey,
    refKey,
    contentKey,
    root: keccak(salt, partyKey, amountKey, periodKey, refKey, contentKey),
  }
}
```

Party canonicalisation strips legal-form suffixes in a committed list, so "Northgate Freight Ltd", "NORTHGATE FREIGHT LIMITED" and "Northgate Freight" produce one key. Rounding canonicalisation is exact on minor units, so a document restated to the nearest whole unit still matches. The reissue class changes the reference only, which is why `refKey` is one key of five rather than the identity of the invoice.

### Registry contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title SkeinRegistry
/// @notice First-writer-wins receivable registry. Records the first pledge on
///         a fingerprinted invoice and pays the seller in the same call.
///         Holds no owner, no treasury and no fee. Amounts are native USDC,
///         18 decimals, because USDC is Arc's native asset.
contract SkeinRegistry {
    /// @notice Public salt. invoiceId is keccak256(salt, fingerprintRoot).
    bytes32 public immutable salt;

    struct Pledge {
        address lender;
        address seller;
        uint256 advance;
        bytes32 evidenceHash;
        bytes32 verdictHash;
        uint64 pledgedAt;
        uint256 blockNumber;
        bool settled;
    }

    mapping(bytes32 => Pledge) internal pledges;
    mapping(address => bytes32[]) internal idsByLender;
    bytes32[] public ids;
    uint256 public pledgeCount;

    /// @notice The receivable is already financed. Carries the first claim.
    error AlreadyPledged(bytes32 invoiceId, address lender, uint256 blockNumber);
    error ZeroSeller();
    error ZeroAmount();
    error NotLender();
    error NotSeller();
    error NotOpen();
    error AlreadySettled();
    error WrongRepayment(uint256 expected);
    error TransferFailed();

    event Pledged(
        bytes32 indexed invoiceId, address indexed lender, address indexed seller,
        uint256 advance, bytes32 evidenceHash, bytes32 verdictHash, uint256 blockNumber
    );
    event PledgeReleased(bytes32 indexed invoiceId, address indexed lender);
    event Repaid(bytes32 indexed invoiceId, address indexed seller, uint256 amount);

    constructor(bytes32 salt_) {
        salt = salt_;
    }

    /// @notice Turns a fingerprint root into the registry key.
    function invoiceId(bytes32 fingerprintRoot) public view returns (bytes32) {
        return keccak256(abi.encode(salt, fingerprintRoot));
    }

    /// @notice Free pre-flight read. Any address, any agent, no gas beyond the call.
    function check(bytes32 id)
        external view
        returns (bool pledged, address lender, uint256 blockNumber, bool settled)
    {
        Pledge storage p = pledges[id];
        pledged = p.lender != address(0);
        return (pledged, p.lender, p.blockNumber, p.settled);
    }

    /// @notice Funds the seller and records the pledge atomically.
    /// @param id Registry key from invoiceId()
    /// @param seller Receives the advance. Must not be the zero address
    /// @param evidenceHash Hash of the document set the reader saw
    /// @param verdictHash Hash of the reader verdict, keys and confidence
    function fundAndPledge(
        bytes32 id, address seller, bytes32 evidenceHash, bytes32 verdictHash
    ) external payable {
        if (seller == address(0)) revert ZeroSeller();
        if (msg.value == 0) revert ZeroAmount();

        Pledge storage existing = pledges[id];
        if (existing.lender != address(0)) {
            revert AlreadyPledged(id, existing.lender, existing.blockNumber);
        }

        pledges[id] = Pledge({
            lender: msg.sender,
            seller: seller,
            advance: msg.value,
            evidenceHash: evidenceHash,
            verdictHash: verdictHash,
            pledgedAt: uint64(block.timestamp),
            blockNumber: block.number,
            settled: false
        });
        idsByLender[msg.sender].push(id);
        ids.push(id);
        pledgeCount++;

        // Arc reverts a native value transfer to a blocklisted address or to a
        // contract that rejects it, so the result is checked and the whole call
        // rolls back with it. The record above never survives a failed send.
        (bool ok, ) = seller.call{value: msg.value}("");
        if (!ok) revert TransferFailed();

        emit Pledged(id, msg.sender, seller, msg.value, evidenceHash, verdictHash, block.number);
    }

    /// @notice Voids a mistaken pledge so the receivable can be financed again.
    ///         Lender only, and only while unsettled. The advance has already
    ///         reached the seller, so this is the lender's own recovery decision.
    function releasePledge(bytes32 id) external {
        Pledge storage p = pledges[id];
        if (p.lender == address(0)) revert NotOpen();
        if (msg.sender != p.lender) revert NotLender();
        if (p.settled) revert AlreadySettled();

        address lender = p.lender;
        delete pledges[id];
        emit PledgeReleased(id, lender);
    }

    /// @notice Seller repays the exact advance. Marks the receivable settled.
    function repay(bytes32 id) external payable {
        Pledge storage p = pledges[id];
        if (p.lender == address(0)) revert NotOpen();
        if (msg.sender != p.seller) revert NotSeller();
        if (p.settled) revert AlreadySettled();
        if (msg.value != p.advance) revert WrongRepayment(p.advance);

        p.settled = true;
        (bool ok, ) = p.lender.call{value: msg.value}("");
        if (!ok) revert TransferFailed();

        emit Repaid(id, msg.sender, msg.value);
    }

    /// @notice Ordered id list for the public feed. Avoids wide log queries.
    function recentIds(uint256 from, uint256 count) external view returns (bytes32[] memory page) {
        uint256 end = from + count;
        if (end > ids.length) end = ids.length;
        page = new bytes32[](end > from ? end - from : 0);
        for (uint256 i = from; i < end; i++) {
            page[i - from] = ids[i];
        }
    }

    /// @notice Pledge history for one lender, for the My Pledges screen.
    function lenderIds(address lender) external view returns (bytes32[] memory) {
        return idsByLender[lender];
    }

    function getPledge(bytes32 id) external view returns (Pledge memory) {
        return pledges[id];
    }
}
```

---

## Data Structures

```typescript
interface ExtractedInvoice {
  drawer: string
  payer: string
  currency: string
  total: string
  issuedOn: string
  dueOn: string
  reference: string
  lines: Array<{ description: string; quantity: string; unitPrice: string }>
  confidence: Record<string, number>
  sourceKind: 'pdf' | 'image' | 'email' | 'fixture'
}

interface CanonicalInvoice {
  drawer: string
  payer: string
  currency: string
  totalMinor: bigint
  issuedOn: string
  dueOn: string
  reference: string
  lineHash: `0x${string}`
}

interface Fingerprint {
  partyKey: `0x${string}`
  amountKey: `0x${string}`
  periodKey: `0x${string}`
  refKey: `0x${string}`
  contentKey: `0x${string}`
  root: `0x${string}`
}

interface Verdict {
  invoiceId: `0x${string}`
  fingerprint: Fingerprint
  matchedKeys: number
  state: 'clear' | 'probable-duplicate' | 'pledged'
  existing?: { lender: `0x${string}`; blockNumber: bigint; settled: boolean }
  evidenceHash: `0x${string}`
  verdictHash: `0x${string}`
}

interface PledgeRow {
  invoiceId: `0x${string}`
  lender: `0x${string}`
  seller: `0x${string}`
  advance: bigint
  blockNumber: bigint
  pledgedAt: number
  settled: boolean
}

interface BenchmarkResult {
  generatedAt: string
  replay: boolean
  classes: Array<{
    name: 'rename' | 'reformat' | 'round' | 'rescan' | 'reissue'
    count: number
    skeinCaught: number
    plainHashCaught: number
  }>
  falsePositives: { distinctInvoices: number; collisions: number }
  totals: { mutations: number; skeinCaught: number; plainHashCaught: number }
}
```

---

## Contract Interface

| Function | Caller | Payable | Description |
|---|---|---|---|
| `invoiceId(fingerprintRoot)` | anyone, view | no | Registry key from a fingerprint root |
| `check(id)` | anyone, view | no | Pre-flight read, free, agent-callable |
| `fundAndPledge(id, seller, evidenceHash, verdictHash)` | lender | yes, advance | Funds the seller and records the pledge, or reverts `AlreadyPledged` |
| `releasePledge(id)` | the lender | no | Voids an unsettled mistaken pledge |
| `repay(id)` | the seller | yes, exact advance | Settles the receivable |
| `recentIds(from, count)` | anyone, view | no | Paged id list for the public feed |
| `lenderIds(lender)` | anyone, view | no | One lender's history |
| `getPledge(id)` | anyone, view | no | Full pledge record |

---

## Environment Variables

```
# web
NEXT_PUBLIC_CHAIN_ID=5042
NEXT_PUBLIC_RPC_URL=https://rpc.mainnet.arc.io
NEXT_PUBLIC_FALLBACK_RPC_URL=https://arc.drpc.org
NEXT_PUBLIC_REGISTRY_ADDRESS=
NEXT_PUBLIC_SALT=
NEXT_PUBLIC_EXPLORER_URL=https://explorer.arc.io
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
OPENAI_API_KEY=
SKEIN_REPLAY=1

# contracts
ARC_RPC_URL=https://rpc.mainnet.arc.io
DEPLOYER_PRIVATE_KEY=
SKEIN_SALT=
```

`OPENAI_API_KEY` is read by `web/src/app/api/reader/route.ts` and `reader/` only. It is never prefixed `NEXT_PUBLIC_` and never reaches the bundle. `SKEIN_REPLAY=1` forces fixture replay, which is the default in CI and in the deployed demo so a judge cannot exhaust a key. `DEPLOYER_PRIVATE_KEY` belongs to a dedicated deployer wallet funded with 10 to 15 USDC bridged through CCTP, never a personal wallet.

---

## App Routes

- `/` the FRONTEND_SPEC.md landing page, public, no wallet required
- `/registry` public read-only feed, no wallet, no API key
- `/app/check` wallet-gated check workspace, follows the ProtectedRoute contract in FRONTEND_SPEC.md section 2.1
- `/app/pledges` wallet-gated pledge history for the connected lender
- `/api/reader` server-only POST, multipart document in, verdict JSON out

---

## User Flows And Screens

**Lender flow:** upload a document, skeleton shimmer while the reader runs, verdict panel with the five keys and their match state, fund field prefilled with the invoice total, one signature, receipt with the transaction hash, block number and explorer link.

**Refusal flow:** the same document arrives from a second wallet, the verdict panel shows `pledged` with the first lender and block, the fund button is disabled at 0.42 opacity with `not-allowed`, and the reason sits under it in one line.

**Seller flow:** `/registry` shows the pledge against their receivable, and `repay` is available from the row when the connected wallet is the seller.

**States every screen carries:**
- Empty: `/registry` with no pledges yet shows one line and a link to the contract, never a blank panel
- Loading: skeleton shimmer on every async read, no spinners
- Error: RPC failure names the endpoint and offers retry, a reader failure names the stage, a revert shows the decoded custom error

---

## What Is Not Being Built In MVP

- Protocol fee or treasury. A toll on the register invites a rival register
- On-chain blocking on partial key matches. Advisory only, because false positives lock out legitimate distinct invoices
- Lender-to-lender pledge transfer or a secondary market in pledges
- Multi-currency receivables and StableFX settlement. StableFX is permissioned, so this is a later conversation with Circle, not a hackathon dependency
- ERC-8183 job settlement for agent lenders. The reference implementation is published on testnet only
- ERC-8004 validation attestations for reader verdicts. The registries are live on mainnet and this is the first post-MVP addition
- Memo predeploy integration on repayment. EOA-only callers make this a wallet-integration question
- Hosted reader API with accounts and rate limits
- Mobile app
- Gas abstraction or a paymaster. Arc does not support multi-token gas at launch

---

## Hackathon Deliverables Checklist

- Live Arc mainnet deployment with a link that opens
- Public GitHub repository with complete code and a README carrying install and usage instructions
- Short description of what it does and what it uses Arc for
- Public builder profile on GitHub, X or Farcaster
- Nothing already funded by a Circle or Arc programme

### To maximise your odds

- Put the verified mainnet contract address and 5+ real transaction links at the top of the README.
- Add a short friction log of Arc surprises (as Legwork does) and an honest limitations section.
- Ship a benchmark and recorded fixtures, so judges can reproduce results without API keys.
- Fund the deployer with $10-15 of real USDC. Mainnet has no faucet and fake bridge sites exist. Review is rolling, so submit early.

Where each of those lives: the address and transaction table is the first block of `README.md`, seeded by `contracts/script/SeedDemo.s.sol`. The friction log is `docs/FRICTION_LOG.md`, filled in as Arc surprises appear, in the shape of a table with what was measured and what changed in the repo. The limitations section is `docs/LIMITATIONS.md`. The benchmark is `reader/result/benchmark.json` with `reader/fixtures` committed beside it.

---

## Build Priority

Judged on relevance to Arc, technical credibility, quality of what was built and whether it is worth taking further. Promise counts more than traction.

1. `SkeinRegistry.sol` passing the full suite on `arc-anvil --network arc`, including the rejecting-receiver and fee-floor cases
2. `canonicalise.ts` and `fingerprint.ts` with the 20 base fixtures and 100 mutations, benchmark committed
3. Mainnet deployment with runtime bytecode proof, then `SeedDemo.s.sol` producing the five README transactions
4. `/registry` public feed reading live rows with no wallet
5. `/app/check` end to end with the wallet gate, connect modal and receipt
6. Landing page per FRONTEND_SPEC.md, sections 1 to 10, with the catch story driven by real verdict data
7. `docs/FRICTION_LOG.md` and `docs/LIMITATIONS.md` written from what actually happened
8. Demo video and DoraHacks submission, early, because review is rolling
