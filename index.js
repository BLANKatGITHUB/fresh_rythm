import express from "express"; 
import axios from "axios"; 
import bodyParser from "body-parser"; 
import cors from "cors"; 

const app = express(); // Creating an instance of express
const port = 3000; // Defining the port number
const __dirname = import.meta.dirname; // Getting the directory name of the current module
let spotifyAccessToken = ""; // Variable to store Spotify access token

app.use(express.static(__dirname + "public")); // Serving static files from the "public" directory
app.use(cors()); // Enabling CORS for all routes

// Route to serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/html/index.html");
});

// Route to handle login and get Spotify access token
app.post(
  "/login",
  bodyParser.urlencoded({ extended: true }), // Parsing URL-encoded bodies
  async (req, res) => {
    let clientId = req.body.client_id; // Getting client_id from the request body
    let secret = req.body.secret; // Getting secret from the request body

    try {
      // Making a POST request to Spotify API to get the access token
      let result = await axios.post(
        "https://accounts.spotify.com/api/token",
        {
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: secret,
        },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      );
      spotifyAccessToken = result.data.access_token; // Storing the access token
      res.send(spotifyAccessToken); // Sending the access token as response
    } catch (error) {
      res.send("Error"); // Sending error response
      console.error(error); // Logging the error
    }
  },
);

// Route to get the stored Spotify access token
app.get("/get_accesskey", (req, res) => {
  res.json({ access_token: spotifyAccessToken }); // Sending the access token as JSON response
});

// Starting the server and listening on the defined port
app.listen(port, () => {
  console.log("server is running");
});
