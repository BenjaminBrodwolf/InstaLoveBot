const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu} = electron;

let  mainWindow;

app.on('ready', () => {

    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/Bot/index.html'),
        protocol: 'file',
        slashes: true
    }));

    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(instagramMenuTemplate)
    // Hinzufügen des Menu
    Menu.setApplicationMenu(mainMenu);
});


// eigenes Menu Template
const instagramMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add Items'
            },
            {
                label: 'Clear Items'
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q', //hier für Mac und Windows
                click(){
                    app.quit();
                }
            }
        ]
    }
];


if(process.env.NODE_ENV !== 'production'){
    instagramMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools,',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I', //hier für Mac und Windows

                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            }
        ]
    })
}



/* ---------------------------------------------------------------  */


async function startTheBot(login, pw, tags, amount) {
    console.log("START Bot");

    await instaPuppet.openInstagram();

    await instaPuppet.login(login, pw);

    await instaPuppet.openByTagAndLike(tags, Number(amount), login);

    await instaPuppet.closeBrowser();

    console.log("END Bot")
}
