How is the CAT20 protocol different from the Runes and BRC20 protocols in terms of transactions?

Transaction Principle

Runes, BRC20 Protocol: During the pending order process, the seller signs a partially signed Bitcoin transaction (PSBT), which is equivalent to half of the transaction being completed. When the user makes a purchase, the buyer signs the other half of the PSBT, and both parties combine them into a complete signed transaction.

CAT20 Protocol: During a user's pending order, they transfer CAT tokens to the address of a smart contract. The contract sets the unlocked unit price of the tokens. Only when the seller confirms receipt of the payment does the contract release the appropriate number of CAT tokens to the buyer, based on the transaction amount.

Advantages of CAT20

The PSBT of Runes is held by the exchange, and if MagicEden wanted, it could completely manipulate the price by only releasing the high-priced PSBT and secretly associating the low-priced PSBT with the purchase itself. This has already happened in early transactions, where even if the user raises the price of the pending order, the order can still be executed at the lowest initial price because the original low-priced PSBT can be held by someone else and ready to be signed. In contrast, all transactions in CAT20 are executed by smart contracts, effectively eliminating the intervention of intermediaries.

Custom Purchase Amount: CAT20 supports user-defined purchase amounts, where buyers can choose to buy part of a large order of tokens. This flexibility does not exist in Runes, which requires buyers to purchase the entire order at once.

Support for Purchase Orders: The bidirectional liquidity of the market is further enhanced. But for now, dotswap does not offer this feature live.

Tokens can be deposited to a contract address, which is controlled by no one, only by the contract itself, as there is no private key associated with this address. It is somewhat like a smart contract account on Ethereum, which operates without a private key, unlike a user-controlled account.

To transfer these tokens, the CAT token contract requires that there be a neighboring input in the same transaction that spends a UTXO with the address of the owner contract (this is where a red arrow comes into play in the diagram). The contract can then verify this transaction and apply additional rules using a system called "covenant" to ensure that everything goes smoothly.