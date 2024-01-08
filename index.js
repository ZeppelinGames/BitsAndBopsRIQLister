const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const StreamZip = require('node-stream-zip');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 360,
        height: 720,

        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenu(null);
    win.loadFile('index.html');
};

const configPath = "./config.json";
const dataPaths = {
    "gamePath": "",
    "assetPath": ""
};

const LoadConfig = () => new Promise((resolve, reject) => {
    fs.writeFile(configPath, "{}", { flag: 'wx' }, function (err) { });

    fs.readFile(configPath, 'utf-8', (err, data) => {
        if (err) {
            reject(err);
            return;
        }

        const paths = JSON.parse(data) ?? {};
        const newGamePath = paths["gamePath"] ?? "";
        const newAssetPath = paths["assetPath"] ?? "";

        dataPaths['gamePath'] = CheckGamePath(newGamePath) ? newGamePath : "";
        dataPaths['assetPath'] = CheckAssetPath(newAssetPath) ? newAssetPath : "";

        resolve();
    });
});

const getZipData = (file, name) => new Promise((resolve) => {
    const zip = new StreamZip({ file: file });
    zip.on('ready', () => {
        console.log('Entries read: ' + zip.entriesCount);
        if (zip.entriesCount > 1) {
            console.log("Resolved");
            resolve({
                "id": name,
                "path": file,
            });
        } else {
            resolve({});
        }
        zip.close();
        console.log('closed');
    });

    zip.on('error', e => {
        console.error(e);
        resolve({});
    });
})

const LoadAssets = () => new Promise((resolve, reject) => {
    if (dataPaths == null || dataPaths['assetPath'] == null || dataPaths['assetPath'].length === 0) reject(`Invalid asset path '${dataPaths['assetPath']}'`);

    // Load assets
    fs.readdir(dataPaths['assetPath'], function (err, files) {
        //handling error
        if (err) {
            reject(err);
        }

        if (files) {
            let zipPromises = [];
            files.forEach((file) => {
                const fullPath = path.join(dataPaths['assetPath'], file);
                if (file.endsWith(".riq")) {
                    console.log(fullPath);
                    zipPromises.push(getZipData(fullPath, file));
                }
            });
            Promise.all(zipPromises).then((data) => {
                console.log(data);
                const fixedData = data.filter(value => JSON.stringify(value) !== '{}')
                resolve(fixedData);
            });
        } else {
            reject('No files found.')
        }
    });
});

app.whenReady().then(() => {
    ipcMain.handle('check-paths', () => {
        return new Promise((resolve) => {
            LoadConfig()
                .then(() => {
                    if (CheckGamePath(dataPaths['gamePath']) && CheckAssetPath(dataPaths['assetPath'])) {
                        resolve(dataPaths);
                        return;
                    }
                    resolve({});
                });
        });
    });

    ipcMain.handle('set-game-path', () => {
        return new Promise((resolve) => {
            dialog.showOpenDialog({ properties: ['openFile'] })
                .then((res) => {
                    if (res.canceled) return;
                    const newGamePath = res.filePaths[0];

                    if (CheckGamePath(newGamePath)) {
                        dataPaths['gamePath'] = newGamePath;
                        UpdateConfig();
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch(() => {
                    resolve(false);
                })
        })
    });

    ipcMain.handle('set-asset-path', () => {
        return new Promise((resolve) => {
            dialog.showOpenDialog({ properties: ['openDirectory'] })
                .then((res) => {
                    if (res.canceled) return;
                    const newAssetPath = res.filePaths[0];
                    if (CheckAssetPath(newAssetPath)) {
                        dataPaths['assetPath'] = newAssetPath;
                        UpdateConfig();
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch(() => {
                    resolve(false);
                })
        })
    });

    ipcMain.handle('retrieve-asset-list', () => {
        return new Promise((resolve, reject) => {
            LoadAssets()
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    })

    ipcMain.handle('load-song', (event, selectedSong) => {
        console.log(selectedSong);
        if (dataPaths['gamePath'] && selectedSong.path) {
            console.log(`Launching ${dataPaths['gamePath']} ${selectedSong.path}`);
            exec(`"${dataPaths['gamePath']}" "${selectedSong.path}"`);
        }
    });

    ipcMain.handle('clear-paths', () => {
        new Promise((resolve) => {
            ClearPaths();
        });
    });

    createWindow();
});

function CheckGamePath(path) {
    return path.endsWith("Bits & Bops.exe");
}

function CheckAssetPath(path) {
    return path.endsWith("StreamingAssets");
}

function UpdateConfig() {
    fs.writeFile(configPath, JSON.stringify(dataPaths), { flag: 'w' }, function (err) {
        if (err) console.error(err);
    });
}

function ClearPaths() {
    dataPaths["gamePath"] = "";
    dataPaths["assetPath"] = "";

    UpdateConfig();
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});