const crypto = require("crypto");
/**
 * Jag är lite osäker om jag har förstått hur denna fungerar.
 * Jag vet att denna metod är osäker, men det var det enda jag förstod av spotifys API dokumentation.
 * @returns ett objekt med någon status och en url.
 */
exports.handler = async () => {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = "https://fr0ntendpr0ject.netlify.app/callback";
  const SCOPES = [
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "streaming"
  ].join(" ");

  const state = crypto.randomBytes(16).toString("hex"); // Randomiserad sträng för att göra detta lite säkrare än vad det är. 
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&state=${state}`;

  return {
      statusCode: 302,
      headers: {
          Location: authUrl,
      },
  };
};
