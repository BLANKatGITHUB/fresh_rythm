var accesstoken = "";
let deviceId = null;

    
window.onSpotifyWebPlaybackSDKReady = async () => {
    try {
    let response = await fetch('http://localhost:3000/spotify_token');
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
        playTrack(deviceId,["spotify:track:1QV6tiMFM6fSOKOGLMHYYg","spotify:track:5wG3HvLhF6Y5KTGlK0IW3J"]);
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
  

    player.connect();

    setInterval(async () => {
        const state = await player.getCurrentState();
        if (state) {
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
    }, 1000);

    getSavedTracks();

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
        } else {
            console.error('Failed to play track', response);
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}

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
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track');
            trackElement.innerHTML = `
                <span class="track-number">${++count}</span>
                <span class="track-name">${track.track.name}</span>
                <span class="track-artist">${track.track.artists.map(a => a.name).join(', ')}</span>
                <span class="track-album">${track.track.album.name}</span>
                <span class="track-duration">${formatTime(track.track.duration_ms)}</span>
            `
            document.getElementById('tracks').appendChild(trackElement);
        });
    }
    catch(error){
        console.error('Error:', error);
    }
}

