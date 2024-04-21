# Chess App
Chess App is a simple chess application that uses other libraries and combines everything into one whole. The website is based on a socket-based client-server system.

## Requirements
- NodeJS v20.12.1
- jQuery 3.7.0

## Instalation

The project already has a ready-made **Node.JS** package
Run this command in the console to install the modules necessary for the application to run.

    npm i

## Usage

The `server/config.js` file contains the application configuration.
```javascript
module.exports = {
    port: 3750,
    database: {
        host: 'HOST',
        port: 3306,
        user: 'USER',
        password: 'PASSWORD',
        database: 'DATABASE'
    }
}
```
The standard application port is **3750**, you can change it to one that is not currently occupied.

> [!WARNING]
> Do not use ports like: **80, 21, 587, 3306**, etc...

---
To run the application, enter this command in the console.
You should then see `Server listening on port {PORT}`. This means that the server is working properly.
    
    npm run server


# Screenshots


<img src="https://cdn.discordapp.com/attachments/1009784232601718825/1231591202441400350/Zrzut_ekranu_2024-04-21_150322.png?ex=663783b0&is=66250eb0&hm=519fc8bcd55ad11c9516d9b42b3c5c042ed78424c081af81f161faf2e203f200&" alt="Chess main page">

# Development plans
- Adding English language
- Account system
- Automatic game creation and search
- Ranking system
- Chessboard, pieces and page customization
---
> [!NOTE]
> The project uses other libraries such as [chess.js](https://github.com/jhlywa/chess.js) and [chessboardjs](https://github.com/oakmac/chessboardjs/)
