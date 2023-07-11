# syntax=docker.io/docker/dockerfile:1.4
#FROM cartesi/toolchain:0.14.0
FROM --platform=linux/riscv64 cartesi/python:3.10-slim-jammy


#install sqlLite libs
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    sqlite3=3.37.2-2ubuntu0.1 \
    && rm -rf /var/lib/apt/lists/* \
    && find /var/log \( -name '*.log' -o -name '*.log.*' \) -exec truncate -s 0 {} \; \
    && truncate -s 0 /var/cache/ldconfig/aux-cache

WORKDIR /opt/cartesi/dapp


COPY ./requirements.txt .
RUN pip install -r requirements.txt --no-cache \
    && find /usr/local/lib -type d -name __pycache__ -exec rm -r {} +

COPY ./dapp.json .
COPY ./entrypoint.sh .
COPY ./HealthCart.py .

