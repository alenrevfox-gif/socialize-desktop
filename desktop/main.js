const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs');
const { app, BrowserWindow, WebContentsView, Menu, dialog, ipcMain, session, shell } = require('electron');

const APP_URL = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const knownHosts = new Set([
  'www.instagram.com', 'instagram.com', 'x.com', 'www.x.com', 'web.telegram.org',
  'www.youtube.com', 'youtube.com', 'www.facebook.com', 'facebook.com', 'www.reddit.com',
  'www.linkedin.com', 'linkedin.com', 'www.threads.net'
]);
let mainWindow;
let socialView;
let activePartition;
let failedLoad = false;
let lastBounds = { x: 0, y: 0, width: 0, height: 0 };
let childWindows = new Set();

function parseSafeUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('That website address is not valid.'); }
  if (url.protocol !== 'https:') throw new Error('Socialize only opens secure HTTPS websites.');
  return url;
}

function partitionFor(url) {
  const host = url.hostname.toLowerCase();
  knownHosts.add(host);
  return `persist:socialize-${host.replace(/[^a-z0-9-]/g, '-')}`;
}

function configureSession(ses, trustedHost) {
  if (ses.__socializeConfigured) return;
  ses.__socializeConfigured = true;
  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    let requestingHost = '';
    try { requestingHost = new URL(details.requestingUrl).hostname; } catch {}
    const allowed = ['media', 'notifications', 'geolocation'].includes(permission) &&
      (requestingHost === trustedHost || requestingHost.endsWith(`.${trustedHost}`));
    if (!allowed) return callback(false);
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Allow', 'Block'],
      defaultId: 1,
      cancelId: 1,
      title: 'Website permission',
      message: `${requestingHost} is requesting ${permission} access.`,
      detail: 'Choose whether this social website can use this feature.'
    }).then(({ response }) => callback(response === 0)).catch(() => callback(false));
  });
}

function makePopup(url, partition) {
  const target = parseSafeUrl(url);
  const popup = new BrowserWindow({
    parent: mainWindow,
    width: 980,
    height: 720,
    minWidth: 640,
    minHeight: 480,
    autoHideMenuBar: true,
    title: 'Socialize',
    webPreferences: {
      partition,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });
  childWindows.add(popup);
  popup.on('closed', () => childWindows.delete(popup));
  popup.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
    try { makePopup(popupUrl, partition); } catch {}
    return { action: 'deny' };
  });
  popup.webContents.on('will-navigate', (event, nextUrl) => {
    try { parseSafeUrl(nextUrl); } catch { event.preventDefault(); }
  });
  popup.loadURL(target.href);
  return popup;
}

function showSocialView(url) {
  const target = parseSafeUrl(url);
  const partition = partitionFor(target);
  configureSession(session.fromPartition(partition), target.hostname);

  if (socialView && activePartition !== partition) {
    mainWindow.contentView.removeChildView(socialView);
    socialView.webContents.destroy();
    socialView = null;
  }
  if (!socialView) {
    socialView = new WebContentsView({
      webPreferences: {
        partition,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true
      }
    });
    activePartition = partition;
    mainWindow.contentView.addChildView(socialView);
    socialView.setBounds(failedLoad ? { ...lastBounds, width: 0, height: 0 } : lastBounds);
    socialView.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
      try { makePopup(popupUrl, partition); } catch {}
      return { action: 'deny' };
    });
    socialView.webContents.on('will-navigate', (event, nextUrl) => {
      try { parseSafeUrl(nextUrl); } catch { event.preventDefault(); }
    });
    socialView.webContents.on('did-fail-load', (_event, code, description, failedUrl, isMainFrame) => {
      if (isMainFrame && code !== -3 && mainWindow && !mainWindow.isDestroyed()) {
        failedLoad = true;
        socialView.setBounds({ ...lastBounds, width: 0, height: 0 });
        mainWindow.webContents.send('socialize:load-error', { code, description, url: failedUrl });
      }
    });
    socialView.webContents.on('did-navigate', (_event, nextUrl) => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('socialize:navigate', nextUrl);
    });
  }
  failedLoad = false;
  socialView.setBounds(failedLoad ? { ...lastBounds, width: 0, height: 0 } : lastBounds);
  return socialView.webContents.loadURL(target.href);
}

function trustedShellSender(event) {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents && event.senderFrame === mainWindow.webContents.mainFrame);
}

function createMenu() {
  const template = [
    { label: 'File', submenu: [{ role: 'quit', label: 'Exit Socialize' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [
      { role: 'reload', accelerator: 'Ctrl+Shift+R' }, { role: 'togglefullscreen' }, { type: 'separator' },
      { label: 'Reload social page', accelerator: 'Ctrl+R', click: () => socialView?.webContents.reload() },
      { label: 'Back', accelerator: 'Alt+Left', click: () => { if (socialView?.webContents.canGoBack()) socialView.webContents.goBack(); } },
      { label: 'Forward', accelerator: 'Alt+Right', click: () => { if (socialView?.webContents.canGoForward()) socialView.webContents.goForward(); } }
    ] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#101115',
    title: 'Socialize',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });
  mainWindow = win;
  win.webContents.setWindowOpenHandler(({ url }) => { try { shell.openExternal(parseSafeUrl(url).href); } catch {} return { action: 'deny' }; });
  win.webContents.on('will-navigate', (event, url) => { if (url !== APP_URL) event.preventDefault(); });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.on('resize', () => {
    if (socialView && !win.isDestroyed()) socialView.setBounds(failedLoad ? { ...lastBounds, width: 0, height: 0 } : lastBounds);
  });
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
    if (socialView && !socialView.webContents.isDestroyed()) socialView.webContents.destroy();
    socialView = null;
  });
}

ipcMain.handle('socialize:open-service', (event, value) => {
  if (!trustedShellSender(event)) throw new Error('Request denied.');
  return showSocialView(value);
});
ipcMain.on('socialize:set-content-bounds', (event, bounds) => {
  if (!trustedShellSender(event) || !socialView || !bounds) return;
  const number = value => Number.isFinite(value) ? Math.round(value) : 0;
  lastBounds = {
    x: Math.max(0, number(bounds.x)),
    y: Math.max(0, number(bounds.y)),
    width: Math.max(0, number(bounds.width)),
    height: Math.max(0, number(bounds.height))
  };
  socialView.setBounds(failedLoad ? { ...lastBounds, width: 0, height: 0 } : lastBounds);
});
ipcMain.on('socialize:reload', event => { if (trustedShellSender(event) && socialView) { failedLoad = false; socialView.setBounds(failedLoad ? { ...lastBounds, width: 0, height: 0 } : lastBounds); socialView.webContents.reload(); } });
ipcMain.on('socialize:back', event => { if (trustedShellSender(event) && socialView?.webContents.canGoBack()) socialView.webContents.goBack(); });
ipcMain.on('socialize:forward', event => { if (trustedShellSender(event) && socialView?.webContents.canGoForward()) socialView.webContents.goForward(); });
ipcMain.handle('socialize:open-external', async (event, value) => {
  if (!trustedShellSender(event)) throw new Error('Request denied.');
  const url = parseSafeUrl(value);
  await shell.openExternal(url.href);
});
ipcMain.handle('socialize:clear-signins', async event => {
  if (!trustedShellSender(event)) throw new Error('Request denied.');
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning', buttons: ['Cancel', 'Clear sign-ins'], defaultId: 0, cancelId: 0,
    title: 'Clear saved sign-ins', message: 'Sign out of social websites on this device?',
    detail: 'This removes saved cookies and website data from Socialize. You will need to sign in again.'
  });
  if (response !== 1) return false;
  const hosts = new Set(knownHosts);
  try {
    const hostFile = path.join(app.getPath('userData'), 'socialize-hosts.json');
    for (const host of JSON.parse(fs.readFileSync(hostFile, 'utf8'))) hosts.add(host);
  } catch {}
  for (const host of hosts) {
    const partition = `persist:socialize-${host.replace(/[^a-z0-9-]/gi, '-')}`;
    await session.fromPartition(partition).clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage'] });
  }
  return true;
});
ipcMain.on('socialize:remember-host', (event, host) => {
  if (!trustedShellSender(event) || typeof host !== 'string' || !/^[a-z0-9.-]+$/i.test(host)) return;
  knownHosts.add(host.toLowerCase());
  const file = path.join(app.getPath('userData'), 'socialize-hosts.json');
  fs.promises.readFile(file, 'utf8').then(text => JSON.parse(text)).catch(() => []).then(hosts => {
    hosts = Array.isArray(hosts) ? hosts : [];
    if (!hosts.includes(host.toLowerCase())) hosts.push(host.toLowerCase());
    return fs.promises.mkdir(path.dirname(file), { recursive: true }).then(() => fs.promises.writeFile(file, JSON.stringify(hosts), 'utf8'));
  }).catch(() => {});
});

app.whenReady().then(() => {
  createMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });










