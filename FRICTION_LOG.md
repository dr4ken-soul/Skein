# Arc Friction Log

What Arc did that the documentation did not say, or said only in passing. Each entry is recorded when it is hit, not reconstructed at the end.

Format: what was expected, what actually happened, how it was measured, what changed in the repository.

| # | Expected | Actual | Measured by | Change made |
|---|---|---|---|---|
| 1 | A mainnet faucet exists | It does not. Testnet has one at `faucet.circle.com`. Mainnet needs real USDC, and fake "Arc bridge" sites are indexed in search results | Attempted faucet lookup before the first deploy | Deployer funded with 10 to 15 USDC through CCTP domain `26`. Documented in `BUILD_GUIDE.md` prerequisites |
| 2 | USDC is 6 decimals | 18 decimals as native value, 6 through the ERC-20 interface at `0x3600…0000`, and `balanceOf` truncates twelve | `arc-anvil` transfer of `1e18` compared against the token view | One converter, `toNativeUsdc` and `fromNativeUsdc` in `web/src/lib/arc.ts`. Nothing else converts |
| 3 | One transfer emits one Transfer log | Two. The system emitter `0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE` logs 18 decimals under EIP-7708 and the token logs its own 6 decimals | Log dump on a single native transfer | The registry feed matches on emitter address and ignores the system emitter |
| 4 | A too-low gas price fails loudly | Below a 20 gwei `maxFeePerGas` the transaction is dropped with no receipt and no error | Broadcast at 19 gwei, then polled for a receipt that never arrived | Client asserts `maxFeePerGas >= 25 gwei` before broadcast and never reports success without a receipt |
| 5 | `eth_estimateGas` is reliable | It is not, particularly on testnet | Repeated estimates disagreeing on identical calls | Explicit gas limits on every write |
| 6 | The explorer has a public API | `explorer.arc.io/api` sits behind a Cloudflare challenge | Direct fetch from CI, challenged | Contract proof is runtime bytecode comparison against the local Foundry build |
| 7 | `anvil` is enough for local tests | Plain anvil runs a standard EVM and cannot reproduce Arc's decimals, blocklist or fee behaviour | Suite passing on anvil and failing on arc-anvil | `arc-anvil --network arc` is the only supported local chain |
| 8 | `eth_getLogs` ranges are generous | The public RPC caps the range at 10,000 blocks and 429s under burst | Range queries during feed development | `/registry` reads `recentIds` and `getPledge` through Multicall3 instead of scanning logs |
| 9 | WebSocket subscriptions work | No public WebSocket endpoint | Transport configuration | Polling at 4s over an HTTP transport with a fallback RPC |
| 10 | Sending value always succeeds | A value transfer to `address(0)` reverts, a blocklisted address reverts at runtime while still consuming gas, and a native transfer to a contract is not guaranteed to succeed | Test with a rejecting receiver contract | `fundAndPledge` checks the low-level call result and reverts the whole transaction with it |

## Additions

Append a row when something new is hit. Keep the measurement column concrete, because an unverifiable friction log reads as marketing.
