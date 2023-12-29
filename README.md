# Before Run
```bash
npm i 
cp src/users.example.json src/users.json
vi src/users.json
```

# Run
```bash
npm run start
```


# Setup
```bash
npm install typescript --save-dev
npm install @types/node --save-dev
npx tsc --init --rootDir ./src --outDir ./dist --esModuleInterop --resolveJsonModule --lib es6,dom  --module commonjs
npm install ts-node --save-dev
npm install nodemon --save-dev
```

```
//package.json

 "scripts": {
    "start": "npm run build:live",
    "build": "tsc -p .",
    "build:live": "nodemon --watch 'src/**/*.ts' --exec \"ts-node\" src/index.ts"
  },

```