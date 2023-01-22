import cors from "cors";
import express from "express";
import fs from "fs";
import ImageDataURI from "image-data-uri";
import SpotifyWebApi from "spotify-web-api-node";
import detectEmotions from "./gvision.js";

const port = 3000;
const app = express();
app.use(express.json());

app.use(cors());
const spotifyApi = new SpotifyWebApi({
  clientId: "fbaa4ee2ec994d8ab34f78da26fdfde4",
  clientSecret: "292aa991447f4dfb836531d967b38c0c",
  redirectUri: "http://localhost:5173/",
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
      const myPlaylists = data.body.items.filter(
        (item) => item.owner.id === user
      );
      console.log("own playlists", myPlaylists);
      res.send(myPlaylists);
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );
});

app.get("/addToPlaylist/:playlistId/:trackId", async (req, res) => {
  console.log("code add playlist: ", code);

  spotifyApi.addTracksToPlaylist(req.params.playlistId, [`${trackId}`]).then(
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
    allRecs = allRecs.filter((val) => !allTracks.includes(val));
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
            console.log(allTracks.length);
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
  /* Get a User’s Top Tracks*/
  let topTracks = [];
  for (let i = 0; i < 2; i++) {
    console.log("i: ", i);
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
  const FILENAME = "./screenshot.png";
  const image = await req.body.imgSrc.toString();
  await ImageDataURI.outputFile(image, FILENAME);
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
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
