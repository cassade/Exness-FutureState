## Exness FutureState Test Task

[Task Definition](/TASK.md)

### Implementation Notes

One of the main requirements is anonymity:

> The system should not make it possible to determine who vouches for whom at any moment of time

Most of the blockchains are not anonymous. Everything is used in a smart contract is publicly visible, even local variables and state variables marked private. True anonymity is only achievable using zero-knowledge protocols like zk-SNARK/zk-STARK.

While zero-knowledge prtocols are too complex and not considered for a current task I made some decisions to satisfy the requirement:

1. If direct call is used for voching then it's easy to determine the vouching account (transaction sender) and the candidate vouching for is performed (transaction data). Instead of sending vouching transaction directly I used delegated execution to prevent determining the vouching account by transaction sender. Transaction may be sent by arbitrary account.
2. Vouching account should sign a message containing the contract address (to prevent replay attack on similar contract) and the candidate address. The resulting signature is provided to the contract (transaction can be sent by any account). Then signature is verified, signer account is recovered and checked against current identified accounts (community members) and if the signer is a member the vouching counter is increased.
3. To prevent double-vouching I need to keep something that allows me to determine that particular member is already vouched. I use hashes of signatures for this purposes. This approach is similar to storing password hashes instead of passwords, I can identify the fact of vouching without storing vouching data itself. Common approach with "nonce" is useless here because it allows to determine vouching member by the state of contract.

In general this approach does not allow to determine who vouches for whom by the state of the contract and by common tools like blockchain explorers. But due to the open nature of the blockchain still it's possible to reproduce smart-contract and its particular state, then "replay" any transaction and pull out any required info.

### Implementation

The system is implemented as a signle smart-contract (to keep things simple) which allows to:

- request identification (register a candidate). Candidates may be registered in parallel and join to vouching process after becoming community members in any order.
- vouch for a candidate
- check if account is a community member
- check if account is a registered candidate
- get current vouching counter for a candidate

For details see the code of the [smart-contract](/contracts/Community.sol) and [unit-tests](/test/Community.js).

### Not implemented

Due to time restrictions and to keep things simple some features are not implemented (and there were no requirements for this features):

- retrieving a list of community members
- retrieving a list of registered candidates (requires different approach for the contract state layout).

### Tools used

- https://hardhat.org
- https://www.openzeppelin.com

### Running tests

1. Clone the repository.
2. Install dependencies:
```
npm install
```
3. Run unit-tests:
```
npx hardhat test
```