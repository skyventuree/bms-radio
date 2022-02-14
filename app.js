const { app, BrowserWindow } = require('electron')
require("@electron/remote/main").initialize();

const createWindow = () => {
    const win = new BrowserWindow({
        title: "Be-Music Surge - Non-stop BMS Radio Station",
        width: 600,
        height: 200,
        maximizable: false,
        resizable: false,
        fullscreen: false,
        autoHideMenuBar: true,
        frame: false,
        titleBarStyle: "hiddenInset",
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true
        }

    })
    win.loadFile('index.html')
    require("@electron/remote/main").enable(win.webContents);
}


app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
