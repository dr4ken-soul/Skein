# Skein — Marketing And Submission

## Goal

One outcome: a judge opens the repo, sees a live Arc mainnet address and five real transactions at the top of the README, reproduces the benchmark without an API key, and understands in under two minutes that a second lender gets refused on-chain.

Judging is relevance to Arc, technical credibility, quality of what was built, and whether it is worth taking further. Traction is not judged and there are no tracks, so nothing here is about audience size. Everything is about verifiability.

The single claim to repeat everywhere: **an invoice can only be financed once.**

## Posting Style

- Short sentences. One idea per sentence
- No hype vocabulary. Never "seamlessly", "revolutionising", "unlocking", "the future of"
- Never overstate. The MCP tool is a stub and says so. The catch story uses fixture data and says so
- First Brands and Tricolor are described as alleged cases with reported scale, never as proven Skein-use-cases
- British English, no em dashes, in posts as well as in code
- Show the refusal. A reverted transaction hash is worth more than any paragraph
- Numbers only when they come from `benchmark.json` or from the contract

## Post Plan

### Post 1, build in public

Publish once the mainnet deployment is live and the demo transactions exist, which should be day eight at the latest.

> An invoice can only be financed once.
>
> Receivables can be copied. A financing register cannot be copied into existence, so nobody built a shared one. First Brands and Tricolor are the recent alleged cases, and the reported scale runs into the billions.
>
> Skein is that register. It reads an invoice, canonicalises the fields, and derives a fingerprint that survives renaming, reformatting, rounding and rescanning. The first lender funds the seller and records the pledge in one transaction on Arc. The second lender gets `AlreadyPledged` with the first lender's address and block number.
>
> Live on Arc mainnet, chain 5042.
> Contract: <address>
> The refusal: <tx hash>
>
> Only hashes on-chain. No invoice text, no amounts, no party names.
>
> Built for Arc Microgrants | Circle.

Attach the four-beat clip from the catch story, or a screen capture of the refusal transaction in the explorer. No slide images, no mockups, no generated art.

### Post 2, final submission

Publish the day the submission is filed.

> Skein is submitted to Arc Microgrants | Circle.
>
> What it does: stops one invoice from being financed twice.
>
> What it uses Arc for: USDC is the native asset, so funding the seller and recording the pledge are one transaction with no approval step. Finality is deterministic, so the first write is the write that holds. Tests run on `arc-anvil --network arc` because plain anvil cannot reproduce Arc's decimals, blocklist or fee floor.
>
> Measured, not asserted: 100 mutated invoices across five classes. Skein catches <n>. A plain SHA-256 of the document catches <m>. Zero false positives across twenty distinct invoices that share one payer.
>
> Reproduce it with no API key:
> `cd reader && SKEIN_REPLAY=1 npm run benchmark`
>
> Repo: <url>
> Live: <url>
> Contract: <address>
>
> Limitations are in `docs/LIMITATIONS.md` and the Arc surprises are in `docs/FRICTION_LOG.md`. Both are honest.

Fill `<n>` and `<m>` from the committed JSON. Never type them from memory.

### Post 3, optional, only if time allows

A single technical post on one friction entry. The two-decimal duality is the strongest candidate:

> USDC on Arc is 18 decimals as native value and 6 decimals through the ERC-20 interface, and `balanceOf` truncates twelve. One transfer emits two logs, one from the system emitter and one from the token.
>
> If you port an Ethereum stablecoin app to Arc without reading the EVM differences page, you will double count.
>
> This is entry four in Skein's friction log.

Technical posts like this are what makes a builder profile credible to a reviewer who is also an engineer.

## Demo Video

Ninety seconds, screen capture only, no voiceover required, captions in Fragment Mono at the bottom left.

| Time | Shot | Caption |
|---|---|---|
| 0:00 | The hero, still, two seconds | An invoice can only be financed once |
| 0:05 | Upload invoice NG-2291 in `/app/check` | Reader runs on the committed fixture |
| 0:15 | The five fingerprint keys resolve | Five salted keys, one root |
| 0:22 | Verdict reads clear, fund field prefilled | `check()` says the slot is free |
| 0:28 | Sign, receipt, explorer link opens | Funded and pledged in one transaction |
| 0:40 | Switch wallet, upload the reissued copy | Same receivable, new reference |
| 0:50 | The refusal card with `AlreadyPledged` | The chain refuses it |
| 1:00 | Mutation Lab, round tab, chips update | Cosmetics do not create new receivables |
| 1:12 | Proof section, benchmark numbers | Measured, not asserted |
| 1:20 | Terminal running `SKEIN_REPLAY=1 npm run benchmark` | Reproducible with no API key |
| 1:28 | Contract address and five transaction links | Live on Arc mainnet |

Cut the video before the landing page is finished if time is short. The terminal and the explorer shots carry the credibility, not the motion.

## Submission Notes

Fields on the DoraHacks form, drafted in advance so nothing is written under pressure.

**Project name:** Skein

**One line:** A neutral on-chain registry that stops one invoice from being financed twice.

**What it does:** Skein reads any invoice, normalises the fields into a canonical form that survives renaming, reformatting, rounding and rescanning, and derives a five-key fingerprint. The first lender to fund a receivable records the pledge and pays the seller in one atomic transaction on Arc. Any later attempt to finance the same fingerprint reverts with `AlreadyPledged`, naming the lender and block that got there first. Only hashes are stored on-chain.

**What it uses Arc for:** Four things, and none of them is incidental. USDC is Arc's native asset, so the advance moves as `msg.value` and the pledge is recorded in the same call with no approval and no second token for gas. Finality is deterministic, which is the only reason a first-writer-wins rule means anything. The contract suite runs on `arc-anvil --network arc` because plain anvil cannot reproduce Arc's decimal duality, blocklist reverts or 20 gwei fee floor. Reads batch through the Multicall3 predeploy, so the public feed never needs a wide log range against a capped RPC.

**Links:** live site, GitHub repository, contract address on the explorer, the five demo transactions, the benchmark file.

**Eligibility:** not previously funded by a Circle or Arc programme, not a mockup, not a slide deck, deployed on mainnet.

## Checklist

- Contract address and five transaction links at the top of `README.md`, before the description
- `docs/FRICTION_LOG.md` filled in from real events, not reconstructed
- `docs/LIMITATIONS.md` honest about the stub MCP tool, the fixture-based catch story, the advisory-only partial matching and the absence of a fee
- `reader/result/benchmark.json` committed with its hash and reproducible with no API key
- Deployer funded with 10 to 15 USDC through CCTP domain 26, never through a searched-for bridge site
- Builder profile public on GitHub, X or Farcaster
- Demo video under ninety seconds, screen capture, no generated art
- Post 1 published as soon as the deployment is live
- Submission filed early, because review is rolling and decisions close 21 October

### To maximise your odds

- Put the verified mainnet contract address and 5+ real transaction links at the top of the README.
- Add a short friction log of Arc surprises (as Legwork does) and an honest limitations section.
- Ship a benchmark and recorded fixtures, so judges can reproduce results without API keys.
- Fund the deployer with $10-15 of real USDC. Mainnet has no faucet and fake bridge sites exist. Review is rolling, so submit early.
