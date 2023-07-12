from healthcart.utils import str_to_hex


class Output():
    def __init__(self, payload: str):
        if payload[:2] == "0x":
            self.payload = payload
        else:
            self.payload = str_to_hex(payload)


class Voucher(Output):
    def __init__(self, destination: str, payload: bytes):
        self.destination = destination
        hexpayload = "0x"+payload.hex()
        super().__init__(hexpayload)


class Notice(Output):
    def __init__(self,  payload: bytes):
        super().__init__(payload)


class Log(Output):
    def __init__(self, payload: str):
        super().__init__(payload)


class Error(Output):
    def __init__(self, payload: str):
        super().__init__(payload)
