const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('api', {
    checkPaths: () => ipcRenderer.invoke('check-paths'),
    setGamePath: () => ipcRenderer.invoke('set-game-path'),
    setAssetPath: () => ipcRenderer.invoke('set-asset-path'),
    retrieveAssetList: () => ipcRenderer.invoke('retrieve-asset-list'),
    loadSong: (selectedSong) => ipcRenderer.invoke('load-song', selectedSong),
    clearPaths: () => ipcRenderer.invoke('clear-paths')
});