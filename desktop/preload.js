const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('socializeDesktop', {
  openService: url => ipcRenderer.invoke('socialize:open-service', url),
  setContentBounds: bounds => ipcRenderer.send('socialize:set-content-bounds', bounds),
  reload: () => ipcRenderer.send('socialize:reload'),
  back: () => ipcRenderer.send('socialize:back'),
  forward: () => ipcRenderer.send('socialize:forward'),
  openExternal: url => ipcRenderer.invoke('socialize:open-external', url),
  clearSignins: () => ipcRenderer.invoke('socialize:clear-signins'),
  rememberHost: host => ipcRenderer.send('socialize:remember-host', host),
  onNavigate: callback => ipcRenderer.on('socialize:navigate', (_event, url) => callback(url)),
  onLoadError: callback => ipcRenderer.on('socialize:load-error', (_event, error) => callback(error))
});
