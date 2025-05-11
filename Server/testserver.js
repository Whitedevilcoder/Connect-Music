// const express = require('express');
// const path = require('path');
// const bcrypt = require('bcrypt');
// const session = require('express-session');
// const axios = require('axios');
// const querystring = require('querystring');
// const crypto = require('crypto');
// require('dotenv').config();

// const collection = require('./config/config');

// const app = express();
// const port = 3000;

// const client_id = process.env.SPOTIFY_CLIENT_ID;
// const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
// const redirect_uri = 'http://localhost:3000/callback';

// const youtube_client_id = process.env.YOUTUBE_CLIENT_ID;
// const youtube_client_secret = process.env.YOUTUBE_CLIENT_SECRET;
// const youtube_redirect_uri = process.env.YOUTUBE_REDIRECT_URI;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// const sessionSecret = crypto.randomBytes(32).toString('hex');
// console.log("Session secret: " + sessionSecret);

// app.use((req, res, next) => {
//   res.setHeader('Cache-Control', 'no-store');
//   res.setHeader('Pragma', 'no-cache');
//   res.setHeader('Expires', '0');
//   next();
// });

// app.use(session({
//   secret: sessionSecret,
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: process.env.NODE_ENV === 'production' }
// }));

// app.use((req, res, next) => {
//   res.locals.user = req.session.user || null;
//   next();
// });

// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// app.use('/public', express.static(path.join(__dirname, '../client/public')));
// app.use('/src', express.static(path.join(__dirname, '../Client/src')));
// app.use('/css', express.static(path.join(__dirname, '../client/src/css')));
// app.use('/img', express.static(path.join(__dirname, '../client/src/img')));
// app.use('/js', express.static(path.join(__dirname, '../client/src/js')));

// function checkAuthenticated(req, res, next) {
//   if (req.session.user) return next();
//   console.log('User not authenticated');
//   res.redirect('/login');
// }

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/public/index.html'));
// });

// app.get('/STY', checkAuthenticated, (req, res) => {
//   const playlists = req.session.playlists || [];
//   res.render('pages/convertPage', { playlists });
// });

// app.get('/login', (req, res) => {
//   res.render('login');
// });

// app.get('/signup', (req, res) => {
//   res.render('signup');
// });

// app.post('/signup', async (req, res) => {
//   const { username, email, password, confirmPassword } = req.body;
//   if (password !== confirmPassword) return res.status(400).send('Passwords do not match');

//   try {
//     const existingUser = await collection.findOne({ $or: [{ email }, { username }] });
//     if (existingUser) return res.status(400).send('User already exists');

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new collection({ username, email, password: hashedPassword });
//     await newUser.save();
//     res.status(200).send('User registered successfully');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Internal Server Error');
//   }
// });

// app.post('/login', async (req, res) => {
//   const { identifier, password } = req.body;
//   try {
//     const user = await collection.findOne({ $or: [{ email: identifier }, { username: identifier }] });
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(400).send('Invalid credentials');
//     }
//     req.session.user = { username: user.username, email: user.email };
//     res.redirect('/profile');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Internal Server Error');
//   }
// });

// app.get('/logout', checkAuthenticated, (req, res) => {
//   req.session.destroy(err => {
//     if (err) return res.status(500).send('Failed to logout');
//     res.clearCookie('connect.sid');
//     res.redirect('/login');
//   });
// });

// app.get('/profile', checkAuthenticated, (req, res) => {
//   const { username, email } = req.session.user;
//   res.render('profile', { username, email, user: req.session.user });
// });

// app.get('/login/spotify', (req, res) => {
//   const scope = [
//     'user-read-private', 'user-read-email', 'playlist-read-private',
//     'playlist-modify-private', 'playlist-modify-public',
//     'user-library-read', 'user-library-modify',
//     'user-follow-read', 'user-follow-modify'
//   ].join(' ');

//   const params = querystring.stringify({
//     response_type: 'code',
//     client_id, scope, redirect_uri
//   });

//   res.redirect(`https://accounts.spotify.com/authorize?${params}`);
// });

// app.get('/callback', async (req, res) => {
//   const code = req.query.code;
//   try {
//     const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
//       code, redirect_uri, grant_type: 'authorization_code'
//     }), {
//       headers: {
//         'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
//         'Content-Type': 'application/x-www-form-urlencoded'
//       }
//     });

//     const { access_token, refresh_token } = response.data;
//     req.session.access_token = access_token;
//     req.session.refresh_token = refresh_token;

//     const profileRes = await axios.get('https://api.spotify.com/v1/me', {
//       headers: { Authorization: 'Bearer ' + access_token }
//     });

//     const userProfile = profileRes.data;
//     req.session.user = { username: userProfile.display_name, email: userProfile.email };

//     const playlistRes = await axios.get('https://api.spotify.com/v1/me/playlists', {
//       headers: { Authorization: 'Bearer ' + access_token }
//     });
//     req.session.playlists = playlistRes.data.items;

//     res.redirect('/STY');
//   } catch (error) {
//     console.error(error);
//     res.redirect('/login');
//   }
// });

// app.get('/playlist/:id/tracks', checkAuthenticated, async (req, res) => {
//   const playlistId = req.params.id;
//   const access_token = req.session.access_token;

//   try {
//     const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
//       headers: { Authorization: `Bearer ${access_token}` }
//     });

//     const tracks = response.data.items.map(item => {
//       const track = item.track;
//       const duration = msToMinSet(track.duration_ms);
//       const albumImage = track.album.images[0]?.url || null;
//       return {
//         name: track.name,
//         artists: track.artists.map(a => a.name),
//         duration,
//         image: albumImage
//       };
//     });
//     res.json(tracks);
//   } catch (error) {
//     console.error('Error fetching tracks', error.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to fetch tracks' });
//   }
// });

// function msToMinSet(ms) {
//   const minutes = Math.floor(ms / 60000);
//   const seconds = ((ms % 60000) / 1000).toFixed(0);
//   return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
// }

// app.post('/details-playlist', checkAuthenticated, (req, res) => {
//   const playlists = req.session.playlists || [];
//   res.render('pages/details', { playlists });
// });

// app.get('/login/youtube', (req, res) => {
//   const scope = 'https://www.googleapis.com/auth/youtube.force-ssl';
//   const authURL = `https://accounts.google.com/o/oauth2/v2/auth?${querystring.stringify({
//     client_id: youtube_client_id,
//     redirect_uri: youtube_redirect_uri,
//     response_type: 'code',
//     scope,
//     access_type: 'offline',
//     prompt: 'consent'
//   })}`;
//   res.redirect(authURL);
// });

// app.get('/youtube/callback', async (req, res) => {
//   const code = req.query.code;
//   try {
//     const response = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
//       code,
//       client_id: youtube_client_id,
//       client_secret: youtube_client_secret,
//       redirect_uri: youtube_redirect_uri,
//       grant_type: 'authorization_code'
//     }), {
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
//     });

//     const { access_token, refresh_token } = response.data;
//     req.session.youtube_access_token = access_token;
//     req.session.youtube_refresh_token = refresh_token;

//     const profileRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
//       headers: { Authorization: `Bearer ${access_token}` },
//       params: { part: 'snippet', mine: true }
//     });

//     const items = profileRes?.data?.items;
//     if (!Array.isArray(items) || items.length === 0) {
//       console.error('YouTube channel not found');
//       return res.status(400).send('No YouTube channel found');
//     }

//     const userProfile = items[0].snippet;
//     req.session.user = {
//       username: userProfile.title,
//       email: userProfile.customURL || 'unknown@example.com',
//       youtube: true,
//       loginType: 'youtube'
//     };

//     res.redirect('/STY');
//   } catch (err) {
//     console.error('YouTube Auth Error:', err.response?.data || err.message);
//     res.redirect('/login');
//   }
// });

// app.post('/create-youtube-playlist', async (req, res) => {
//   const { playlistId, playlistName } = req.body;
//   const spotifyToken = req.session.spotifyAccessToken;
//   const youtubeToken = req.session.youtubeAccessToken;

//   if (!spotifyToken || !youtubeToken) {
//     return res.status(401).send('Please connect both Spotify and YouTube accounts.');
//   }

//   try {
//     // 1. Get tracks from Spotify
//     const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
//       headers: {
//         Authorization: `Bearer ${spotifyToken}`,
//       },
//     });

//     const data = await response.json();

//     const trackNames = data.items.map(item => {
//       const track = item.track;
//       const artists = track.artists.map(a => a.name).join(', ');
//       return `${track.name} ${artists}`;
//     });

//     // 2. Search YouTube videos for each track
//     const { google } = require('googleapis');
//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: youtubeToken });

//     const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

//     const videoIds = [];
//     for (const query of trackNames) {
//       const searchRes = await youtube.search.list({
//         part: 'snippet',
//         q: query,
//         maxResults: 1,
//         type: 'video',
//       });

//       if (searchRes.data.items.length > 0) {
//         videoIds.push(searchRes.data.items[0].id.videoId);
//       }
//     }

//     // 3. Create a YouTube playlist
//     const playlistRes = await youtube.playlists.insert({
//       part: 'snippet,status',
//       requestBody: {
//         snippet: {
//           title: playlistName,
//           description: 'Converted from Spotify',
//         },
//         status: {
//           privacyStatus: 'private',
//         },
//       },
//     });

//     const youtubePlaylistId = playlistRes.data.id;

//     // 4. Add each video to the YouTube playlist
//     for (const videoId of videoIds) {
//       await youtube.playlistItems.insert({
//         part: 'snippet',
//         requestBody: {
//           snippet: {
//             playlistId: youtubePlaylistId,
//             resourceId: {
//               kind: 'youtube#video',
//               videoId: videoId,
//             },
//           },
//         },
//       });
//     }

//     res.send(`<h2>Successfully created YouTube playlist: ${playlistName}</h2>
//               <a href="https://www.youtube.com/playlist?list=${youtubePlaylistId}" target="_blank">View Playlist</a>`);
//   } catch (error) {
//     console.error('Error converting playlist:', error);
//     res.status(500).send('Failed to convert playlist.');
//   }
// });


// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
