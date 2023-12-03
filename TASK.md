# Task Definition

The task is to develop a smart contract system for EVM.

The purpose of the application is to provide users with the ability to perform social identification.

The system keeps a list of accounts that have passed identification. This list is predefined when smart contract system is deployed.

The system should allow a new account to undergo social identification. It works in the following way:

1. New account requests identification
2. Any identified account can vouch for the new account
3. If any 3 accounts of identified accounts vouched for the new account, the new account becomes identified and can now vouch for other new accounts

We ask for a MVP system designed to only perform a single identification process. Extending this system to support multiple accounts identification is welcomed, but not required.

(Important!) The system should not make it possible to determine who vouches for whom at any moment of time

What needs to be done:
Implement this smart contract system for EVM.