const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs-extra');
var log = require('electron-log');
Object.assign(console, log.functions); //redirect to log file

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      devTools: false
    },
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'Icons/icon.png'),
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));


  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.



ipcMain.on('openFolder', (event, path) => {
  dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }).then(res => {
    event.sender.send('folderData', res.filePaths[0])
  })
})

const ChangeConfig = (config) => {
  mainWindow.webContents.send('configData',config)
}


//load config
fs.readdir(path.join(__dirname,'configs')).then(configs => {
  let parsedConfigs = configs.filter(config => config.match(/.json/)).map(config => {
    let temp;
    try{
      temp = Object.assign({ name: config.replace('.json','') }, require('./configs/' + config))
    } catch(e) {
      console.log(e)
      return {}
    }
    //verify config file
    if (temp.buttons && temp.buttons.filter(button => button.name && button.val).length > 0) {
      return {label:temp.name, click:()=>{ChangeConfig(temp)}}
    }
    return {}
  }).filter(configs => Object.keys(configs) != 0)

  if(parsedConfigs.length == 0) {
    throw new Error('No acceptable Configs')
  }

  //Create Menu
  const template = [
    // { role: 'Config Menu' }
    {
      label: 'Configs',
      submenu: parsedConfigs
    },
    // { role: 'help' }
    {
      role: 'help',
      submenu: [
        {
          label: 'Github',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://github.com/mfish33/Cal-Poly-OBS-ScoreBoard')
          }
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

