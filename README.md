<div align="center">
  <img src="./public/logo.png" width="200" height="200" alt="Bonfire" />
  <h1>Bonfire</h1>
  <p>Real-time chat app</p>
</div>

## 📥 Installation

Detailed guide to setup an instance.

### ❗ Prequisites

1. Setup a [Firebase](https://firebase.google.com/) project.
2. Setup a [VideoSDK](https://videosdk.live/) account.

### 🪜 Steps

1. Install all dependencies
```sh
npm i
# or
yarn
```

2. Copy `.env.example` to `.env.local` and modify the contents with the proper values.
3. Build the app
```sh
npm run build
# or
yarn build
```

4. Run the server
```sh
npm start
# or
yarn start
```

### 🔧 Development

1. You can run Firebase emulator suite to test the app locally.
```sh
npm run emulator:start
# or
yarn emulator:start
```

2. To run the app with emulator, run the following command.
```sh
npm run dev:emulator
# or
yarn dev:emulator
```

3. If not, you can just run the `dev` script.
```sh
npm run dev
# or
yarn dev
```

## 📜 License

BSD 3-Clause License