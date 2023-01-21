import express from "express";
import SpotifyWebApi from "spotify-web-api-node";
import detectEmotions from "./gvision.js";
import cors from "cors";

const port = 3000;
const app = express();
app.use(cors());
const spotifyApi = new SpotifyWebApi({
  clientId: "fbaa4ee2ec994d8ab34f78da26fdfde4",
  clientSecret: "292aa991447f4dfb836531d967b38c0c",
  redirectUri: "http://localhost:5173/",
});
const state = "some-state-of-my-choice";
const scopes = [
  "ugc-image-upload",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "app-remote-control",
  "user-read-email",
  "user-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-read-private",
  "playlist-modify-private",
  "user-library-modify",
  "user-library-read",
  "user-top-read",
  "user-read-playback-position",
  "user-read-recently-played",
  "user-follow-read",
  "user-follow-modify",
];

var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

app.get("/", (req, res) => {
  // res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
  res.json({ url: authorizeURL });
});

app.get("/callback", async (req, res) => {
  code = req.query.code;

  console.log("code", code);

  // Retrieve an access token and a refresh token
  spotifyApi.authorizationCodeGrant(code).then(
    function (data) {
      console.log("The token expires in " + data.body["expires_in"]);
      console.log("The access token is " + data.body["access_token"]);
      console.log("The refresh token is " + data.body["refresh_token"]);

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body["access_token"]);
      spotifyApi.setRefreshToken(data.body["refresh_token"]);
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );

  res.send("test callback");
});

app.get("/getUserDetails", (req, res) => {
  spotifyApi.getMe().then(
    function (data) {
      console.log("Some information about the authenticated user", data.body);
      res.send(data.body);
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );
});

app.get("/getUserPlaylists", async (req, res) => {
  let user = "";
  await spotifyApi.getMe().then(
    function (data) {
      user = data.body.id;
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );
  spotifyApi.getUserPlaylists(user).then(
    function (data) {
      console.log("Retrieved playlists", data.body);
      res.send(data.body);
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );
});

app.get("/addToPlaylist/", async (req, res) => {
  console.log("code: ", code);
  spotifyApi.authorizationCodeGrant(code).then(
    function (data) {
      console.log("The token expires in " + data.body["expires_in"]);
      console.log("The access token is " + data.body["access_token"]);
      console.log("The refresh token is " + data.body["refresh_token"]);

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body["access_token"]);
      spotifyApi.setRefreshToken(data.body["refresh_token"]);

      spotifyApi
        .addTracksToPlaylist(
          "4YQtx6mcMqRIzBdl3BBodH",
          [
            "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
            "spotify:track:1301WleyT98MSxVHPZCA6M",
          ],
          {
            position: 10,
          }
        )
        .then(() => {
          console.log("added to playlist !!!!");
        });
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );

  // 4YQtx6mcMqRIzBdl3BBodH
});

app.get("/emotions", async (req, res) => {
  const emotions = await detectEmotions("happygyal.webp");
  console.log(emotions);
  res.send(emotions);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
