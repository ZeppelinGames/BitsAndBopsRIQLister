const setAssetPathButton = document.getElementById("assetPathButton");
const setGamePathButton = document.getElementById("gamePathButton");
const songContainer = document.getElementById("loadedSongs");

const assetCheck = document.getElementById("assetCheck");
const gameCheck = document.getElementById("gameCheck");

const playButton = document.getElementById("playButton");

const resetPathsButton = document.getElementById("resetPathsButton");

const infoEle = document.getElementById("info");

let selectedSong;
let selectedSongElement;

let gamePathSet = false;
let assetPathSet = false;

const CheckLoadedPaths = () => new Promise((resolve) => {
    window.api.checkPaths().then((res) => {
        if (res['gamePath'] && res['assetPath']) {
            gamePathSet = res['gamePath'].length > 0;
            assetPathSet = res['assetPath'].length > 0;

            console.log(res);
        }
        CheckPaths();
        resolve();
    });
});

window.addEventListener('load', () => {
    CheckLoadedPaths();
});

resetPathsButton.addEventListener('click', () => {
    window.api.clearPaths().then(() => {
        gamePathSet = false;
        assetPathSet = false;
        CheckPaths();
    });
})

playButton.addEventListener('click', () => {
    window.api.loadSong(selectedSong);
});

setAssetPathButton.addEventListener('click', () => {

    window.api.setAssetPath()
        .then((validPath) => {
            assetPathSet = validPath;
            infoEle.innerText = validPath ? "Streaming asset path set successfully" : "Invalid StreamingAssets path. Path is usually found at 'Bits & Bops Demo\\Bits & Bops_Data\\StreamingAssets'"
            assetCheck.classList.toggle("hidden", !validPath);
            CheckPaths();
        })
        .catch(() => { });
});

setGamePathButton.addEventListener('click', () => {
    window.api.setGamePath()
        .then((validPath) => {
            gamePathSet = validPath;
            infoEle.innerText = validPath ? "Game path set successfully" : "Invalid game path. Make sure you select 'Bits & Bops.exe'";
            gameCheck.classList.toggle("hidden", !validPath);
            CheckPaths();
        })
        .catch(() => { });
});

function CheckPaths() {
    const hideEles = document.getElementsByClassName("hideOnPath");
    const showEles = document.getElementsByClassName("showOnPath");
    if (gamePathSet && assetPathSet) {
        Array.from(hideEles).forEach((ele) => {
            ele.classList.add('hidden');
        });

        Array.from(showEles).forEach((ele) => {
            ele.classList.remove('hidden');
        });

        UpdateAssetList();
    } else {
        Array.from(hideEles).forEach((ele) => {
            ele.classList.remove('hidden');
        });

        Array.from(showEles).forEach((ele) => {
            ele.classList.add('hidden');
        });

        ClearAssetList();
    }
}

function ClearAssetList() {
    songContainer.innerHTML = '';
    infoEle.textContent = "Paths cleared";
}

function UpdateAssetList() {
    window.api.retrieveAssetList()
        .then((res) => {
            if (res == null || res.length === 0) {
                infoEle.textContent = "Didn't load songs";
                return;
            }
            songContainer.innerHTML = '';

            infoEle.innerText = `Loaded ${res.length} songs`;

            res.forEach(r => {
                if (r.id) {
                    const song = document.createElement('div');
                    song.innerText = r.id ?? "Unable to load";
                    song.classList.add('divButton');
                    song.addEventListener('click', () => {
                        selectedSong = r;
                        console.log(selectedSong);

                        if (selectedSongElement) {
                            selectedSongElement.classList.remove('selected');
                        }

                        selectedSongElement = song;
                        selectedSongElement.classList.add('selected');
                    });
                    songContainer.appendChild(song);
                }
            });
        })
        .catch((err) => {
            infoEle.textContent = err;
        });
}