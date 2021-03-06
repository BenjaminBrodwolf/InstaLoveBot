const electron = require('electron');
const url = require('url');
const path = require('path');
const pjson = require('./package.json');

const {app, BrowserWindow, Menu} = electron;

let mainWindow;

delete process.env.ELECTRON_ENABLE_SECURITY_WARNINGS;
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const userDataPath = app.getPath('userData');

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
        pathname: path.join(__dirname, '/Bot/HTML/startBot.html'),
        protocol: 'file',
        slashes: true
    }));

    mainWindow.maximize()
    // mainWindow.webContents.openDevTools();

    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(instagramMenuTemplate)
    // Hinzufügen des Menu
    Menu.setApplicationMenu(mainMenu);

});


// eigenes Menu Template
const instagramMenuTemplate = [
    {
        label: '♥',
        submenu: [
            {
                label: 'Toggle DevTools,',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I', //hier für Mac und Windows

                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q', //hier für Mac und Windows
                click() {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'V'+pjson.version
    }
];


// if(process.env.NODE_ENV !== 'production'){
//     instagramMenuTemplate.push({
//         label: 'Developer Tools',
//         submenu: [
//             {
//                 label: 'Toggle DevTools,',
//                 accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I', //hier für Mac und Windows
//
//                 click(item, focusedWindow){
//                     focusedWindow.toggleDevTools();
//                 }
//             },
//             {
//                 role: 'reload'
//             }
//         ]
//     })
// }


