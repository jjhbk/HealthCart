# syntax=docker.io/docker/dockerfile:1.4
#FROM cartesi/toolchain:0.14.0
FROM --platform=linux/riscv64 cartesi/python:3.10-slim-jammy


#install sqlLite libs
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    sqlite3=3.37.2-2ubuntu0.1 \
    && apt-get install -y --no-install-recommends \
    build-essential=12.9ubuntu3 \
    && rm -rf /var/lib/apt/lists/* \
    && find /var/log \( -name '*.log' -o -name '*.log.*' \) -exec truncate -s 0 {} \; \
    && truncate -s 0 /var/cache/ldconfig/aux-cache

WORKDIR /opt/cartesi/dapp


COPY ./requirements.txt .
RUN pip install -r requirements.txt --no-cache \
    && find /usr/local/lib -type d -name __pycache__ -exec rm -r {} +

COPY ./entrypoint.sh .
COPY ./healthcart ./healthcart
COPY ./HealthCart.py ./healthcart




# syntax=docker.io/docker/dockerfile:1.4
#
## build stage: includes resources necessary for installing dependencies
#FROM --platform=linux/riscv64 cartesi/python:3.10-slim-jammy as build-stage
#
#RUN apt-get update \
#    && apt-get install -y --no-install-recommends \
#    build-essential=12.9ubuntu3 \
#    && apt-get install -y --no-install-recommends \
#    sqlite3=3.37.2-2ubuntu0.1 \
#    && rm -rf /var/lib/apt/lists/* \
#    && find /var/log \( -name '*.log' -o -name '*.log.*' \) -exec truncate -s 0 {} \;
#
#RUN /sbin/ldconfig -v
#RUN python -m venv /opt/venv
#ENV PATH="/opt/venv/bin:$PATH"
#
#COPY requirements.txt .
#
#RUN pip install -r requirements.txt --no-cache \
#    && find /opt/venv -type d -name __pycache__ -exec rm -r {} +
#
#
## runtime stage: produces final image that will be executed
#FROM --platform=linux/riscv64 cartesi/python:3.10-slim-jammy
#
#COPY --from=build-stage /opt/venv /opt/venv
#
#WORKDIR /opt/cartesi/dapp
#COPY entrypoint.sh .
#COPY ./healthcart ./healthcart
#COPY ./HealthCart.py ./healthcart
#