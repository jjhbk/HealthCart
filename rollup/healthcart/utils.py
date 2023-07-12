import logging
import os
from datetime import datetime, timezone
from json import JSONEncoder
from healthcart.balance import Balance
LOG_FMT = 'level={levelname} ts={asctime} module={module} msg="{message}"'
LOG_LEVEL = "INFO"

LOG_LEVEL_ENV_VAR = "LOG_LEVEL"
if LOG_LEVEL_ENV_VAR in os.environ:
    LOG_LEVEL = os.environ.get(LOG_LEVEL_ENV_VAR)

logging.basicConfig(level=LOG_LEVEL, format=LOG_FMT, style="{")

# ISO-8061 date format
logging.Formatter.formatTime = (lambda self, record, datefmt=None:
                                datetime.fromtimestamp(
                                    record.created, timezone.utc)
                                .astimezone()
                                .isoformat(sep="T", timespec="milliseconds"))

logger = logging.getLogger(__name__)


def hex_to_str(hex):
    return bytes.fromhex(hex[2:]).decode("utf-8")


def str_to_hex(str):
    return "0x"+str.encode("utf-8").hex()


class PrivatePropertyEncoder(JSONEncoder):
    def _normalize_keys(self, dict: dict):
        new_dict = {}
        for item in dict.items():
            new_key = item[0][1:]
            new_dict[new_key] = item[1]
        return new_dict


class DatetimeEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.timestamp()

        return JSONEncoder.encode(self, o)


class BalanceEncoder(PrivatePropertyEncoder):
    def default(self, o):
        if isinstance(o, Balance):
            props = o.__dict__.copy()
            props = self._normalize_keys(props)
            del props["account"]
            return props
        elif isinstance(o, set):
            return list(o)

        return JSONEncoder.encode(self, o)
