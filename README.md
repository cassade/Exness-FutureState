# Exness FutureState Test Task

[Task Definition](/TASK.md)

## Implementation Notes

Most of the blockchains are not anonymous. Everything is used in a smart contract is publicly visible, even local variables and state variables marked private. True anonymity is only achievable using zero-knowledge protocols like zk-SNARK/zk-STARK.

While zero-knowledge prtocols are too complex and not considered for a current task I made some decisions to satisfy the requirement:

> The system should not make it possible to determine who vouches for whom at any moment of time

1. Instead of sending vouching transaction directly I used delegated execution to prevent determining the vouching account by transaction sender.
2. Vouching account should sign a message containing the contract address (to prevent replay attack on similar contract) and the candidate address. The resulting signature is provided to the contract (transaction can be sent by any account). Then signature is verified, signer account is recovered and checked against current community members and if signer is a member the vouching counter is increased.
3. To prevent double-vouching I need to keep something that allows me to determine that particular member is already vouched. I use hashes of signatures for this purposes. Common approach with "nonce" is useless here because it allows to determine vouching member by the state of contract.

This approach does not allow to determine who vouches for whom by the state of the contract and by common tools like blockchain explorers. But due to the open nature of the blockchain still it's possible to reproduce smart-contract and its particular state, then "replay" any transaction and pull out any required info.

### Implementation

The system is implemented as a signle smart-contract (to keep things simple) which allows to:

- request identification (register a candidate). Candidates may be registered in parallel and join to vouching process after becoming community members in any order.
- vouch for a candidate
- check if account is a community member
- check if account is a registered candidate
- get current vouching counter for a candidate

### Not implemented

Due to time restrictions and to keep things simple:

- retrieving a list of community members
- retrieving a list of registered candidates (requires different approach for the contract state layout).

For other details see code of the smart-contract and unit-tests.

## Tools used

- https://hardhat.org
- https://www.openzeppelin.com

## Code

- [Community contract](/contracts/Community.sol)
- [Unit tests](/test/Community.js)

## Running tests

1. Clone the repository.
2. Install dependencies:
```
npm install
```
3. Run unit-tests:
```
npx hardhat test
```



