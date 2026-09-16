const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  nativeTheme,
  net,
  Notification,
  protocol,
  shell,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

const { buildMenu } = require('./menu.cjs');

const isDev = !app.isPackaged;
const MEDIA_SCHEME = 'pgg-media';

protocol.registerSchemesAsPrivileged([
  {
    scheme: MEDIA_SCHEME,
    privileges: {
      secure: true,
      standard: true,
      stream: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

const prefsPath = () => path.join(app.getPath('userData'), 'preferences.json');

async function readPrefs() {
  try {
    const raw = await fs.readFile(prefsPath(), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writePrefs(prefs) {
  await fs.mkdir(path.dirname(prefsPath()), { recursive: true });
  await fs.writeFile(prefsPath(), JSON.stringify(prefs, null, 2), 'utf8');
}

function pathToMediaURL(absPath) {
  return `${MEDIA_SCHEME}://media/?p=${encodeURIComponent(absPath)}`;
}

function registerMediaProtocol() {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    try {
      const url = new URL(request.url);
      const filePath = url.searchParams.get('p');
      if (!filePath) {
        return new Response('Missing file path', { status: 400 });
      }
      const fileUrl = pathToFileURL(filePath).toString();
      return await net.fetch(fileUrl);
    } catch (err) {
      return new Response(`Media protocol error: ${err.message}`, { status: 500 });
    }
  });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1e3a5f',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (isDev && devUrl) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function broadcast(channel, payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload);
  }
}

function registerIpc() {
  ipcMain.handle('photos:pick', async (_event, opts = {}) => {
    const limit = typeof opts.limit === 'number' ? opts.limit : 30;
    const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
      title: 'Select photos for the game',
      defaultPath: app.getPath('pictures'),
      buttonLabel: 'Add to game',
      message: 'Choose photos with date or GPS metadata.',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Images',
          extensions: ['jpg', 'jpeg', 'png', 'heic', 'heif', 'tif', 'tiff', 'webp', 'gif'],
        },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }

    const paths = result.filePaths.slice(0, limit);
    const now = Date.now();
    return paths.map((p, index) => ({
      id: `electron-photo-${now}-${index}`,
      path: p,
      uri: p,
      webPath: pathToMediaURL(p),
      date: null,
      location: null,
    }));
  });

  ipcMain.handle('storage:get', async (_event, key) => {
    const prefs = await readPrefs();
    return Object.prototype.hasOwnProperty.call(prefs, key) ? prefs[key] : null;
  });

  ipcMain.handle('storage:set', async (_event, payload = {}) => {
    const { key, value } = payload;
    if (typeof key !== 'string') throw new Error('storage:set requires string key');
    const prefs = await readPrefs();
    prefs[key] = value;
    await writePrefs(prefs);
  });

  ipcMain.handle('storage:remove', async (_event, key) => {
    const prefs = await readPrefs();
    if (key in prefs) {
      delete prefs[key];
      await writePrefs(prefs);
    }
  });

  ipcMain.handle('storage:clear', async () => {
    await writePrefs({});
  });

  ipcMain.handle('storage:keys', async () => {
    const prefs = await readPrefs();
    return Object.keys(prefs);
  });

  // macOS doesn't expose programmatic trackpad haptics from Electron's main process.
  // Handlers exist so the renderer surface stays parity with Capacitor; they no-op today
  // and can later proxy to a tiny NSHapticFeedbackManager helper if desired.
  ipcMain.handle('haptics:impact', () => {});
  ipcMain.handle('haptics:notification', () => {});
  ipcMain.handle('haptics:selection', () => {});

  ipcMain.handle('notify', (_event, payload = {}) => {
    if (!Notification.isSupported()) return false;
    const { title = 'Photo Guessing Game', body = '', silent = false } = payload;
    new Notification({ title, body, silent }).show();
    return true;
  });

  ipcMain.handle('dock:bounce', (_event, type = 'informational') => {
    if (process.platform !== 'darwin' || !app.dock) return -1;
    return app.dock.bounce(type === 'critical' ? 'critical' : 'informational');
  });

  ipcMain.handle('dock:badge', (_event, badge = '') => {
    if (process.platform !== 'darwin' || !app.dock) return;
    app.dock.setBadge(typeof badge === 'string' ? badge : String(badge ?? ''));
  });

  ipcMain.handle('theme:get', () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'));

  ipcMain.handle('app:info', () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  }));
}

app.setName('Photo Guessing Game');

app.whenReady().then(() => {
  registerMediaProtocol();
  registerIpc();
  buildMenu();
  createWindow();

  nativeTheme.on('updated', () => {
    broadcast('theme:update', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
