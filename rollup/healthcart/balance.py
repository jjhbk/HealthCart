class Balance():
    def __init__(self, account: str,
                 erc20: dict[str:int] = None,
                 erc721: dict[str:set[int]] = None):
        self._account = account
        self._erc20 = erc20 if erc20 else {}
        self._erc721 = erc721 if erc721 else {}

    def erc20_get(self, erc20: str) -> int:
        return self._erc20.get(erc20, 0)

    def _erc20_increase(self, erc20: str, amount: int):
        if amount < 0:
            raise ValueError(
                f"Failed to increase {erc20} balance for {self._account}"
                f"{amount}should be a positive number"
            )
        self._erc20[erc20] = self._erc20.get(erc20, 0)+amount

    def _erc20_decrease(self, erc20: str, amount: int):
        if amount < 0:
            raise ValueError(
                f"Failed to decrease {erc20} balance for {self._account}"
                f"{amount}should be a positive number"
            )
        erc20_balance = self._erc20.get(erc20)
        if erc20_balance < amount:
            raise ValueError(
                f"Failed to decrease {erc20} balance for {self._account} "
                f"Not enough funds to decrease {amount}"
            )
        self._erc20[erc20] = erc20_balance-amount

    def erc721_get(self, erc721: str) -> set[int]:
        return self._erc721.get(erc721, set())

    def er721_add(self, erc721: str, token_id: int):
        tokens = self._erc721.get(erc721)
        if tokens:
            tokens.add(token_id)
        else:
            self._erc721[erc721] = {token_id}

    def erc721_remove(self, erc721: str, token_id: int):
        tokens = self._erc721.get(erc721, set())
        try:
            tokens.remove(token_id)
        except KeyError as error:
            raise ValueError(
                "Failed to remove token"
                f"'ERC-721:{erc721},id:{token_id}' from {self._account}"
                "Account doesn't own token") from error
