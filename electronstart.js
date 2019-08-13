const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu} = electron;

let  mainWindow;

delete process.env.ELECTRON_ENABLE_SECURITY_WARNINGS;
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const userDataPath = app.getPath ('userData');

app.on('ready', () => {

    mainWindow = new BrowserWindow({
        width: 900,
        height: 800,
        title: 'Instagram Like Bot',
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/Bot/startBot.html'),
        protocol: 'file',
        slashes: true
    }));
    mainWindow.webContents.openDevTools();

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
            },
            {
                role: 'reload'
            }
        ]
    })
}


