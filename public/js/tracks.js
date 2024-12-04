var accesstoken = 	"";
var deviceId = null;
var playableTracks = [];


    
window.onSpotifyWebPlaybackSDKReady = async () => {
    try {
    let response = await fetch(`https://bliss-music-5a9g.onrender.com/spotify_token`);
    const data = await response.json();
    accesstoken = data.accessToken;
    const token = accesstoken;
    const player = new Spotify.Player({
      name: 'Web Playback SDK Quick Start Player',
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
    });


    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceId = device_id;
        setInterval(async () => {
            try{
            const state = await player.getCurrentState();
            if (state) {
                if(!state.paused){
                    const currentTrack = state.track_window.current_track;
                    const currentPosition = state.position;
                    const duration = currentTrack.duration_ms;
    
                    document.getElementById('track-name').textContent = `${currentTrack.name} by ${currentTrack.artists.map(a => a.name).join(', ')}`;
                    document.getElementById('track-img').src = currentTrack.album.images[0].url;
                    document.getElementById('track-info').classList.remove('hidden');
    
                    document.getElementById('current-time').textContent = formatTime(currentPosition);
                    document.getElementById('total-duration').textContent = formatTime(duration);
                    document.getElementById('progress-bar').value = (currentPosition / duration) * 100;

                }
            }

        } catch(error){
            }
        }, 1000);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);       
    });



    document.getElementById('toggle-play').onclick = function() {
        player.togglePlay().then(() => {
            const playButtonIcon = document.getElementById('toggle-play').querySelector('i');
            player.getCurrentState().then(state => {
                if (state.paused) {
                    playButtonIcon.classList.remove('fa-play');
                    playButtonIcon.classList.add('fa-pause');
                } else {
                    playButtonIcon.classList.remove('fa-pause');
                    playButtonIcon.classList.add('fa-play');
                }
            });
        });
    };

    document.getElementById('prev').onclick = function() {
        player.previousTrack();
    };

    document.getElementById('next').onclick = function() {
        player.nextTrack();
    };

    document.getElementById('repeat').onclick = async function() {
        const state = await player.getCurrentState();

        if(state){
            if(state.repeat_mode === 0){
                setRepeat('context');
            }

            else{
                setRepeat('off');
            }

            document.getElementById('repeat').classList.toggle('border-teal');

        }

    };

    document.getElementById('shuffle').onclick = async function() {
        const state = await player.getCurrentState();

        if(state){
            if(state.shuffle){
                setShuffle('false');
            }

            else{
                setShuffle('true');
            }

            document.getElementById('shuffle').classList.toggle('border-teal');

        }
    }

    document.getElementById("volume-control").oninput = function() {
        player.setVolume(this.value / 100);
    };

    document.getElementById("progress-bar").onclick = async function(event) {
        const progressBar = document.getElementById("progress-bar");
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progressBarWidth = progressBar.offsetWidth;
        const clickPositionRatio = clickX / progressBarWidth;
    
        const state = await player.getCurrentState();
        if (state) {
            const duration = state.track_window.current_track.duration_ms;
            const seekPosition = clickPositionRatio * duration;
    
            player.seek(seekPosition);
        }
    };

    player.addListener('player_state_changed', async ({
        position,
        paused,
        track_window: { next_tracks }
      }) => {
        if (next_tracks.length == 0 && position == 0 && paused) {
            const tracks = await getUserTopTracks();
            const trackUris = tracks.map(track => track.uri);
            playTrack(deviceId, trackUris);
        }
      });

    document.getElementById('search-btn').onclick = function(event) {
        event.stopPropagation();
        document.getElementById('results').style.display = 'flex';
        document.getElementById('tracks').classList.add("hidden");
        const query = document.getElementById('search').value;
        displaySearchResults(query);
    }

    document.onclick = function(event) {
        if (event.target.id !== 'search' && event.target.id !== 'search-btn') {
            document.getElementById('results').style.display = 'none';
            document.getElementById('tracks').classList.remove("hidden");
        }
    }

    player.connect();

    getSavedTracks();
    displayPlaylists();

} catch (error) {
    console.error('Error:', error);
}

};


function playTrack(device_id, trackUri) {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: trackUri }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accesstoken}`
        },
    }).then(response => {tracks

        if (response.status === 204) {
            console.log('Track is playing');

            const playButtonIcon = document.getElementById('toggle-play').querySelector('i');

            playButtonIcon.classList.remove('fa-play');
            playButtonIcon.classList.add('fa-pause');
        
        } else {
            console.error('Failed to play track', response);
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}

document.getElementById('play-all').onclick = function() {
    playTrack(deviceId, playableTracks);
};

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

async function getSavedTracks(){
    try{
        const response = await fetch('https://api.spotify.com/v1/me/tracks', {
            headers: {
                'Authorization': `Bearer ${accesstoken}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        const tracks = data.items;
        var count = 0;
        document.getElementById('playlist-header-name').textContent = 'Saved Tracks';
        document.getElementById('playlist-header-img').src = '../images/heart.png';
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track');
            trackElement.innerHTML = `
                <span class="track-number"><i class="fas fa-play hover-play"></i>${++count}</span>
                <span class="track-name">${track.track.name}</span>
                <span class="track-artist">${track.track.artists.map(a => a.name).join(', ')}</span>
                <span class="track-album">${track.track.album.name}</span>
                <span class="track-duration">${formatTime(track.track.duration_ms)}</span>
            `
            trackElement.dataset.uri = track.track.uri;
            trackElement.onclick = function() {
                playTrack(deviceId, [this.dataset.uri]);
            };
            document.getElementById('tracks').appendChild(trackElement);
            playableTracks.push(track.track.uri);
        });
    }
    catch(error){
        console.error('Error:', error);
    }
}

async function getUserTopTracks() {
    try {
        const result = await fetch('https://api.spotify.com/v1/me/top/tracks', {
                headers: {
                    'Authorization': `Bearer ${accesstoken}`,
                    'Content-Type': 'application/json'
                }
            });

        const data = await result.json();
        return data.items;
    }
    catch(error){
        console.error('Error:', error);
    }
    
}

async function setRepeat(value){
    try{
        const response = await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${value}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accesstoken}`,
                'Content-Type': 'application/json'
            },
        });
    }catch(error){
        console.error('Error:', error);
    }}

async function setShuffle(value){
    try{
        const response = await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${value}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accesstoken}`,
                'Content-Type': 'application/json'
            },
        });
    }catch(error){
        console.error('Error:', error);
}
}



async function displayPlaylistTracks(playListId){
    try{
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playListId}`, {
            headers: {
                Authorization: `Bearer ${accesstoken}`,
                'Content-Type': 'application/json'
            },
        });

        const data = await response.json();

        document.getElementById("playlist-header-img").src = data.images[0].url;
        document.getElementById("playlist-header-name").textContent = data.name;

        const tracks = data.tracks.items;

        var count = 0;

        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track');
            trackElement.innerHTML = `
                <span class="track-number"><i class="fas fa-play hover-play"></i>${++count}</span>
                <span class="track-name">${track.track.name}</span>
                <span class="track-artist">${track.track.artists.map(a => a.name).join(', ')}</span>
                <span class="track-album">${track.track.album.name}</span>
                <span class="track-duration">${formatTime(track.track.duration_ms)}</span>
            `
            trackElement.dataset.uri = track.track.uri;
            trackElement.onclick = function() {
                playTrack(deviceId, [this.dataset.uri]);
            };
            document.getElementById('tracks').appendChild(trackElement);
            playableTracks.push(track.track.uri);
        });
    }
    catch(error){
        console.error('Error:', error);
    }
}

async function getUserPlaylists(){
    try{
        const response = await fetch("https://api.spotify.com/v1/me/playlists",
            {
                headers: {
                    Authorization: `Bearer ${accesstoken}`,
                    'Content-Type': 'application/json'
                },
            }
        );

        const data = await response.json();
        return data.items;
    }
    catch(error){
        console.error('Error:', error);
    }
}

async function displayPlaylists(){
    try{
        const playlists = await getUserPlaylists();
        playlists.forEach(playlist => {
            if(playlist!=null){
                const playlistElement = document.createElement('div');
                playlistElement.classList.add('playlist');
                playlistElement.innerHTML = `
                    <img src="${playlist.images[0].url}" class="playlist-img">
                    <span class="playlist-name">${playlist.name}</span>
                `
                playlistElement.onclick = function() {
                    document.getElementById('tracks').innerHTML = '';
                    playableTracks = [];
                    document.getElementById('playlist-header-img').src = playlist.images[0].url;
                    document.getElementById('playlist-header-name').textContent = playlist.name;
                    displayPlaylistTracks(playlist.id);
                };
                document.getElementById('playlists').appendChild(playlistElement);
            }
        });
    }
    catch(error){
        console.error('Error:', error);
    }
}


async function getPlaylistTracks(playlistId){
    try{
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: {
                Authorization: `Bearer ${accesstoken}`,
                'Content-Type': 'application/json'
            },
        });

        const data = await response.json();
        return data.items;
    }
    catch(error){
        console.error('Error:', error);
    }
}

async function displayPlaylistTracks(playListId){
    try{
        const response = await getPlaylistTracks(playListId);
        const tracks = response;
        var count = 0;

        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track');
            trackElement.innerHTML = `
                <span class="track-number"><i class="fas fa-play hover-play"></i>${++count}</span>
                <span class="track-name">${track.track.name}</span>
                <span class="track-artist">${track.track.artists.map(a => a.name).join(', ')}</span>
                <span class="track-album">${track.track.album.name}</span>
                <span class="track-duration">${formatTime(track.track.duration_ms)}</span>
            `
            trackElement.dataset.uri = track.track.uri;
            trackElement.onclick = function() {
                playTrack(deviceId, [this.dataset.uri]);
            };
            document.getElementById('tracks').appendChild(trackElement);
            playableTracks.push(track.track.uri);
    });
    }
    catch(error){
        console.error('Error:', error);
    }
}

// Function to get the dominant color of an image
function getDominantColor(imgEl) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = imgEl.width;
    canvas.height = imgEl.height;
    context.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);
    const imageData = context.getImageData(0, 0, imgEl.width, imgEl.height);
    const data = imageData.data;
    const length = data.length;
    const color = { r: 0, g: 0, b: 0 };
    let count = 0;

    for (let i = 0; i < length; i += 4) {
        color.r += data[i];
        color.g += data[i + 1];
        color.b += data[i + 2];
        count++;
    }

    color.r = Math.floor(color.r / count);
    color.g = Math.floor(color.g / count);
    color.b = Math.floor(color.b / count);


    const alpha = 0.5; // Adjust the transparency level here (0.0 to 1.0)
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}


function updatePlaylistHeaderColor() {
    const imgEl = document.getElementById('playlist-header-img');
    imgEl.crossOrigin = 'Anonymous'; // Set crossOrigin attribute
    const dominantColor = getDominantColor(imgEl);
    document.getElementById('playlist-header').style.backgroundColor = dominantColor;
}


document.getElementById('playlist-header-img').addEventListener('load', updatePlaylistHeaderColor);

async function getSearchResult(query){
    try{
        const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`, {
            headers: {
                Authorization: `Bearer ${accesstoken}`,
                'Content-Type': 'application/json'
            },
        });

        const data = await response.json();
        return data.tracks.items;
    }
    catch(error){
        console.error('Error:', error);
    }
}

async function displaySearchResults(query){
    try{
        const tracks = await getSearchResult(query);
        document.getElementById('results').innerHTML = '';
        var count = 0;

        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('result');
            trackElement.innerHTML = `
                <span class="track-number"><i class="fas fa-play hover-play"></i>${++count}</span>
                <span><img src="${track.album.images[0].url}" class="track-img"></span>
                <span class="track-name">${track.name} by ${track.artists.map(a=>a.name).join(", ")}</span>
                `
            trackElement.dataset.uri = track.uri;
            trackElement.onclick = function(event) {
                playTrack(deviceId, [this.dataset.uri]);
                event.stopPropagation();
            };
            document.getElementById('results').appendChild(trackElement);
            });
        }
        catch(error){
            console.error('Error:', error);
        }
    }
