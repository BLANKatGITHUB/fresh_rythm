var accesstoken = "";
let deviceId = null;

window.onSpotifyWebPlaybackSDKReady = () => {
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
        player.togglePlay();
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

};

playTrack(deviceId,"spotify:track:1QV6tiMFM6fSOKOGLMHYYg");


function playTrack(device_id, trackUri) {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: trackUri }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accesstoken}`
        },
    }).then(response => {
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


