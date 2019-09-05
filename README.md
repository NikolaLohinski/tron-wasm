# Tron WASM

<p align="center">
    <img src="https://i.pinimg.com/originals/18/e9/84/18e98488f4463e3114d7059324ec382c.png" alt="tron" width="100px" />
</p>

This repository holds an JS instance of [Tron](https://tron.fandom.com/wiki/TRON_%28arcade_game%29). It was designed as a testing 
platform for multiple implementations of the same algorithm in different languages compiled to WebAssembly.

Tested languages: 
- [X] Typescript
- [X] Golang
- [X] Rust
- [ ] AssemblyScript
- [ ] C++
- [ ] C

## Requirements
### Node & Npm
- Node at least `v12.4.0`
- Npm at least `6.9.0`

**Hint**: install both with [nvm](https://github.com/nvm-sh/nvm) for easier management.

### Rust
- Rust itself & cargo
  ```
  $ curl https://sh.rustup.rs -sSf | sh
  ```
- Wasm-pack 
  ```
  $ curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
  ```

### Golang
- Visit [official repository](https://golang.org/dl/) to get the latest version
- Set your GOROOT to point to your golang installation:
  ```
  $ export GOROOT=/usr/local/go
  ```
- Set your GOPATH to point to where you would like ot keep your dependencies:
  ```
  $ mkdir $HOME/.go
  $ export GOPATH=$HOME/.go
  ```
- Install the webpack async loader dependency:
  ```
  $ go get github.com/aaronpowell/webpack-golang-wasm-async-loader
  ```

## Install
```
$ npm install
```

## Run
```
$ npm start
```

Then visit: [http://localhost:8080]().

## Build
```
$ npm run build
```

It should create a `docs` folder. If pushed on master, this changes to deployed version of the app on github pages.

## Tools
### Test
```
$ npm test
```
### Lint
```
$ npm run lint
```