import cors from "cors";
import express from "express";
import fs from "fs";
import ImageDataURI from "image-data-uri";
import SpotifyWebApi from "spotify-web-api-node";
import detectEmotions from "./gvision.js";
import http from "http";

const app = express();
const server = http.createServer(app);
app.use(express.json());

app.use(cors());
const spotifyApi = new SpotifyWebApi({
  clientId: "fbaa4ee2ec994d8ab34f78da26fdfde4",
  clientSecret: "292aa991447f4dfb836531d967b38c0c",
  redirectUri: "https://magenta-tarsier-db0bea.netlify.app/",
  // redirectUri: "http://localhost:3000/callback",
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

const GOOGLE_APPLICATION_CREDENTIALS =
  "./skillful-hull-375510-7d9b2d7e37e0.json";

var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
let code = "";

app.get("/", (req, res) => {
  // res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
  res.json({ url: authorizeURL });
});

app.get("/callback", async (req, res) => {
  code = req.query.code;

  // Retrieve an access token and a refresh token
  spotifyApi.authorizationCodeGrant(code).then(
    function (data) {
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
      const myPlaylists = data.body.items.filter(
        (item) => item.owner.id === user
      );
      res.send(myPlaylists);
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );
});

app.get("/addToPlaylist/:playlistId/:trackId", async (req, res) => {
  spotifyApi
    .addTracksToPlaylist(req.params.playlistId, [`${req.params.trackId}`])
    .then(
      function (data) {
        console.log("Added tracks to playlist!");
      },
      function (err) {
        console.log("Something went wrong!", err);
      }
    );
});

app.get("/getRecByPlaylist/:playlistId", async (req, res) => {
  // Get tracks in a playlist
  let numberOfTracks = 0;

  await spotifyApi.getPlaylist(req.params.playlistId).then(async (data) => {
    numberOfTracks = data.body.tracks.total / 5;
    let allRecs = [];
    let allTracks = [];
    for (let i = 0; i < numberOfTracks; i++) {
      await spotifyApi
        .getPlaylistTracks(req.params.playlistId, {
          offset: i * 5,
          limit: 5,
          fields: "items",
        })
        .then(
          // data containing 5 tracks
          async function (data) {
            data.body.items.forEach((value) => {
              allTracks.push(value.track);
            });
            const seed_tracks = data.body.items.map((item) => item.track.id);
            await spotifyApi
              .getRecommendations({
                seed_tracks: seed_tracks,
                limit: 5,
              })
              .then(
                async function (data) {
                  const recs = data.body.tracks;
                  allRecs = allRecs.concat(recs);
                },
                function (err) {
                  console.log("Something went wrong!", err);
                }
              );
          },
          function (err) {
            console.log("Something went wrong!", err);
          }
        );
    }
    allRecs = allRecs.filter(
      (val) => !allTracks.includes(val) && val.preview_url != null
    );
    res.json({ allRecs });
  });
});

app.get("/getPlaylistTracks/:playlistId", async (req, res) => {
  let numberOfTracks = 0;

  await spotifyApi.getPlaylist(req.params.playlistId).then(async (data) => {
    numberOfTracks = data.body.tracks.total / 5;
    let allTracks = [];
    for (let i = 0; i < numberOfTracks; i++) {
      await spotifyApi
        .getPlaylistTracks(req.params.playlistId, {
          offset: i * 5,
          limit: 5,
          fields: "items",
        })
        .then(
          // data containing 5 tracks
          async function (data) {
            allTracks = allTracks.concat(data.body.items);
          },
          function (err) {
            console.log("Something went wrong!", err);
          }
        );
    }
    res.json(allTracks);
  });
});

app.get("/getTop100", async (req, res) => {
  /* Get a User???s Top Tracks*/
  let topTracks = [];
  for (let i = 0; i < 2; i++) {
    await spotifyApi
      .getMyTopTracks({
        offset: i * 49,
        limit: 49,
      })
      .then(
        function (data) {
          topTracks = topTracks.concat(data.body.items);
        },
        function (err) {
          console.log("Something went wrong!", err);
        }
      );
  }
  res.json(topTracks);
});

app.post("/emotions", async (req, res) => {
  const FILENAME = "./screenshot.jpeg";
  const image = await req.body.imgSrc;
  await ImageDataURI.outputFile(image.toString(), FILENAME);
  let emotions;

  try {
    emotions = await detectEmotions(FILENAME);
  } catch (err) {
    console.error(err);
  } finally {
    fs.unlinkSync(FILENAME);
    console.log("File removed: ", FILENAME);
  }
  res.send(emotions);
  // res.redirect("/callback");
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
