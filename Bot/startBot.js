const BrowserWindow = require('electron').remote.BrowserWindow;
const path = require('path');
const url = require('url');

function clicked() {
    console.log("cklicked")
    // startTheBot(
    let runBotWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    runBotWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'runningBot.html'),
        protocol: 'file',
        slashes: true
    }));
    runBotWindow.webContents.openDevTools();


}
// document.getElementById("btnClick").addEventListener ("click", () => clicked());


