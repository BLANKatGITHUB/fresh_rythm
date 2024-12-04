import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import querystring from "querystring";
import ejs from "ejs";

const app = express(); // Creating an instance of express
const port = 3000; // Defining the port number
const __dirname = import.meta.dirname; // Getting the directory name of the current module
var accessToken = '';
const redirectUri = `${process.env.RENDER_EXTERNAL_URL}/callback`;

app.use(express.static(__dirname + "/public/")); // Serving static files from the "public" directory
app.use(cors()); // Enabling CORS for all routes

// Route to serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(__dirname+"/public/html/home.html"); 
});

// Route to get the stored Spotify access token
app.get('/user_login', (req, res) => {
  const scope = 'user-library-read user-modify-playback-state user-read-playback-state user-read-currently-playing streaming app-remote-control user-top-read playlist-read-private';
  const authUrl = 'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
          response_type: 'code',
          client_id: process.env.CLIENT_ID,
          scope: scope,
          redirect_uri: redirectUri
      });
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const authOptions = {
            method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
      }),
      headers: {
          'Authorization': 'Basic ' + Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
      },
  };
  try {
    const response = await axios(authOptions);
    accessToken = response.data.access_token;
    // res.sendFile( __dirname + "/public/html/tracks.html");
    res.sendFile( __dirname + "/public/html/tracks.html");
} catch (error) {
    res.status(500).json({ error: 'Failed to get access token' });
    console.error(error);
}
});

app.get("/spotify_token", (req, res) => {
  console.log(accessToken);
  res.json({accessToken});
});
// Starting the server and listening on the defined port
app.listen(port, () => {
  console.log("server is running");
});

