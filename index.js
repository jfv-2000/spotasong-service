import fetch from "node-fetch";
import express from "express";
import SpotifyWebApi from "spotify-web-api-node";
const port = 3000;
const app = express();

const spotifyApi = new SpotifyWebApi({
  clientId: "fbaa4ee2ec994d8ab34f78da26fdfde4",
  clientSecret: "292aa991447f4dfb836531d967b38c0c",
});

// Retrieve an access token
spotifyApi.clientCredentialsGrant().then(
  function (data) {
    console.log("The access token expires in " + data.body["expires_in"]);
    console.log("The access token is " + data.body["access_token"]);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body["access_token"]);
  },
  function (err) {
    console.log(
      "Something went wrong when retrieving an access token",
      err.message
    );
  }
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/test", (req, res) => {
  spotifyApi.getArtistTopTracks("0oSGxfWSnnOXhD2fKuz2Gy", "GB").then((data) => {
    data.body.tracks.forEach(function (track, index) {
      console.log(
        index +
          1 +
          ". " +
          track.name +
          " (popularity is " +
          track.popularity +
          ")"
      );
    });
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
