const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 380,
    minWidth: 280,
    minHeight: 360,
    frame: true,
    alwaysOnTop: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  mainWindow.loadFile('index.html');

  // 개발자 도구 (개발 시에만)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 알림 요청 처리
ipcMain.handle('show-notification', async (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title,
      body: body,
      urgency: 'critical'
    }).show();
  }
  return true;
});
