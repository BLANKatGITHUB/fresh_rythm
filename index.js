import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import querystring from "querystring";
import ejs from "ejs";

const app = express(); // Creating an instance of express
const port = 3000; // Defining the port number
const __dirname = import.meta.dirname; // Getting the directory name of the current module
var clientId = '';
var clientSecret = '';
var accessToken = '';
const redirectUri = 'https://bliss-music.onrender.com/callback';

app.use(express.static(__dirname + "/public/")); // Serving static files from the "public" directory
app.use(cors()); // Enabling CORS for all routes

// Route to serve the main HTML file
app.get("/", (req, res) => {
  res.render("login.ejs");
});

// Route to handle login and get Spotify access token
app.post(
  "/login",
  bodyParser.urlencoded({ extended: true }), // Parsing URL-encoded bodies
  async (req, res) => {
     clientId = req.body.client_id; // Getting client_id from the request body
     clientSecret = req.body.secret; // Getting secret from the request body

    try {
      // Making a POST request to Spotify API to get the access token
      let result = await axios.post(
        "https://accounts.spotify.com/api/token",
        {
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      );
      res.sendFile(__dirname+"/public/html/home.html"); 
    } catch (error) {
      res.render("login.ejs",{err:error}); // Sending error response
      console.error(error); // Logging the error
    }
  },
);

// Route to get the stored Spotify access token
app.get('/user_login', (req, res) => {
  const scope = 'user-library-read user-modify-playback-state user-read-playback-state user-read-currently-playing streaming app-remote-control user-top-read playlist-read-private';
  const authUrl = 'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
          response_type: 'code',
          client_id: clientId,
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
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
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
  res.json({accessToken});
});
// Starting the server and listening on the defined port
app.listen(port, () => {
  console.log("server is running");
});

