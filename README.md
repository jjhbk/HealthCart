# Frontend-mobile-cartesi

A mobile based frontend tool to interact with Cartesi dapps

# Requirements

- [React-Native cli setup](https://reactnative.dev/docs/environment-setup)
- [Cartesi-Rollups](https://docs.cartesi.io/cartesi-rollups/build-dapps/run-dapp/)
- [ngrok](https://ngrok.com/)

# Getting Started

## Expose Dapp using [ngrok](https://ngrok.com/)

Edit your ngrok config file at `/home/${USER}/.config/ngrok/ngrok.yml`

```
version: "2"
authtoken: ******************************************
tunnels:
  first:
    addr: 8545 #Hardhat node port
    proto: http
  second:
    addr: 4000 #GraphQlApi port
    proto: http
  third:
    addr: 5005 #InspectApi port
    proto: http
```

Tunnel Your ports

```bash
 ngrok start -all
```

### Replace urlS in the app

Edit `tunnel_config.json` file:

```
{
  "hardhat": "{url for port:8545}",
  "graphql": "{url for port: 4000}",
  "inspect": "{url for port: 5005}"
}

```

## Install Dependencies

```bash

#### using npm

npm install

#### OR using Yarn

yarn
```

## Step 2: Generate your bindings for Graphql and Rollups

```bash
#### using npm

npm run codegen

#### OR using Yarn

yarn codegen
```

## Step 4: Run your app

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
#### using npm
npm run android

#### OR using Yarn
yarn android
```

### For iOS

```bash
#### using npm
npm run ios

#### OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Errors with react-native-accurate-step-counter

```
# replace respective properties with the following values in:
# `node_modules/react-native-accurate-step-counter/android/build.gradle`

compileSdkVersion 30


dependencies {
    implementation 'com.facebook.react:react-native:+'
    }

# Add HIGH_SAMPLING_RATE_SENSORS permission to your android manifest file at:
# HealthCart/android/app/src/main/AndroidManifest.xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
....
<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS"/>
....
</manifest>

```

## Start Interacting with your dapp
