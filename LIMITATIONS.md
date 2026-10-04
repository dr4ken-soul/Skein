# Skein Limitations

Written before anyone asks. Nothing here is a surprise to the builder, and all of it is a decision rather than an oversight.

## Product

**Partial matches never block.** If four of five fingerprint keys match an existing pledge, the reader scores it a probable duplicate and says so in the interface. The on-chain gate is the full root only. A partial-key block would lock out genuinely distinct invoices that share a payer and a period, and a registry that refuses legitimate receivables is worse than no registry. The cost is that a sophisticated duplicate which changes two fields at once can slip through. That is a real gap and it is the first thing a serious deployment would want to tune.

**`releasePledge` reopens a slot after the money has moved.** The advance reaches the seller inside `fundAndPledge`, so releasing a pledge is the lender giving up its on-chain claim while remaining exposed off-chain. It exists to undo a mistaken pledge made seconds earlier, not to unwind a funded deal. There is no dispute mechanism, no arbitration and no timelock.

**No fee, no treasury, no owner.** Deliberate. A toll on a neutral register invites a rival register, and a rival register defeats the purpose. The consequence is that there is no on-chain funding for the reader infrastructure, which is a real sustainability question for anything beyond a grant.

**The contract cannot verify the reader.** `evidenceHash` and `verdictHash` commit the lender to what its reader saw. They prove nothing about whether the extraction was correct. A lender with a broken or dishonest reader writes a bad fingerprint and the registry faithfully records it. Attestation through the ERC-8004 validation registry is the intended answer and it is not built.

**One currency, one direction.** Native USDC only, lender to seller. No multi-currency receivables, no StableFX settlement, which is permissioned in any case, and no secondary market in pledges.

## Technical

**Fingerprint determinism depends on committed constants.** The legal-suffix list and the currency exponent table are fixed in the repository. Extending them changes fingerprints for future documents and can split one receivable into two identities. Any change needs a versioned salt and a migration story, and neither exists yet.

**The AI reader is a third-party model.** Structured outputs constrain the shape, not the content. Low-confidence fields are surfaced rather than hidden, but a misread total produces a wrong `amountKey` and therefore a wrong `invoiceId`. Replay mode makes the shipped benchmark reproducible, and it also means the benchmark measures the recorded responses rather than live model behaviour.

**No off-chain index.** Every read comes from the contract or the RPC. The public RPC caps log ranges and 429s under burst, so the feed pages through `recentIds` instead of scanning events. At scale that paging becomes the bottleneck, and an indexer would be needed.

**The MCP tool is a stub.** `reader/src/mcp/check.ts` wraps two calls over stdio. It is not a finished agent integration, it has no auth and it has not been run against a live agent framework.

**The catch story on the landing page uses fixture data.** It is labelled as such in the interface. The live refusal in the README transaction table is a real mainnet transaction, and the two are not the same thing.

## Security

**The registry has not been audited.** It is a small contract with no owner and no upgrade path, which limits the surface, but it holds value in transit and it has not been reviewed by anyone outside the build.

**First-writer-wins is a race, not a judgement.** The registry records who was first. It cannot say who was right. Two lenders can race on the same fingerprint and the loser's transaction reverts, which is the intended behaviour and is also a griefing vector for anyone willing to pay gas to claim a fingerprint they will then release.

**Nothing is private.** Arc's opt-in privacy is roadmap only. Anyone can read which fingerprints are pledged, who pledged them and how much. The invoice content is not revealed, but the existence and size of a financing relationship is.

## Deferred Documents

`WHITEPAPER.md`, `FAQ.md`, `TEAM_OPS.md` and `DOCS.md` are deferred until after the microgrant window. A whitepaper written before mainnet numbers exist would be speculation, and a FAQ needs live fee and access answers that do not exist yet.
