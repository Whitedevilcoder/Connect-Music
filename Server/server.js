const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');

const collection = require('./config/config'); // Ensure this path is correct
const { url } = require('inspector');
const { name } = require('ejs');
const { error } = require('console');

const app = express();
const port = 3000;

// const youtubeAuthRoutes = require('./auth');
// app.use('/', youtubeAuthRoutes); // Or use a prefix like /auth/youtube if you want


require('dotenv').config();
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = 'http://localhost:3000/callback';



// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log("This is session secret: " + sessionSecret);

//Global Middleware 
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});


// Session management setup
app.use(session({
  secret: sessionSecret, // Use the generated session secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }

}));

// Make session user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


// Set EJS as the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'client/public' directory
app.use('/public', express.static(path.join(__dirname, '../client/public')));
app.use('/src', express.static(path.join(__dirname, '../Client/src')));
app.use('/css', express.static(path.join(__dirname, '../client/src/css')));
app.use('/img', express.static(path.join(__dirname, '../client/src/img')));
app.use('/js', express.static(path.join(__dirname, '../client/src/js')));



// Middleware to check if user is authenticated
function checkAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    console.log('User not authenticated, redirecting to login page.');
    res.redirect('/login');
  }
}


// Homepage route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// STY conversion page
app.get('/STY', checkAuthenticated, (req, res) => {
  const playlists = req.session.playlists || [];

  res.render('pages/convertPage', { playlists });

});

// Login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Spotify login route with updated scopes
app.get('/login/spotify', (req, res) => {
  const scope = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-library-read',
    'user-library-modify',
    'user-follow-read',
    'user-follow-modify'
  ].join(' ');

  const params = querystring.stringify({
    response_type: 'code',
    client_id,
    scope,
    redirect_uri
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Spotify callback route
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  const authOptions = {
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      code,
      redirect_uri,
      grant_type: 'authorization_code'
    }),
    headers: {
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };


  try {
    const response = await axios(authOptions);
    const { access_token, refresh_token } = response.data;

    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);

    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;

    // Fetch user profile
    const userProfileOptions = {
      method: 'get',
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    };

    const userProfileResponse = await axios(userProfileOptions);
    const userProfile = userProfileResponse.data;

    // console.log('User Profile:', userProfile);

    req.session.user = { username: userProfile.display_name, email: userProfile.email };

    // Fetch additional data if needed, e.g., playlists
    const playlistOptions = {
      method: 'get',
      url: 'https://api.spotify.com/v1/me/playlists',
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    };

    const playlistsResponse = await axios(playlistOptions);
    const playlists = playlistsResponse.data.items;
    // console.log(playlistId)


    // console.log('User Playlists:', playlistsResponse.data);

    // Save playlists to session
    req.session.playlists = playlists;

    // Redirect to the STY convert page instead of profile
    res.redirect('/STY');


    // Redirect to profile page with authorization info
    // res.redirect('/profile');


    // fetch tracks of the specific playlistId
    // const tracksOptions = {
    //   method: 'get',
    //   url: 'https://api.spotify.com/v1/playlists/{playlist_id}/tracks',
    //   headers: {
    //      'Authorization': 'Bearer '+ access_token
    //   }
    // };

  } catch (error) {
    console.log(error);
    res.redirect('/login');
  }
});

//fetching tracks route
app.get('/playlist/:id/tracks', checkAuthenticated, async (req, res) => {
  const playlistId = req.params.id;
  const access_token = req.session.access_token;

  try {
    const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    const tracks = response.data.items.map(item => {
      const track = item.track;
      const duration = msToMinSet(track.duration_ms);
      const albumImage = track.album.images.length > 0 ? track.album.images[0].url : null;


      return {
        name: track.name,
        artists: track.artists.map(a => a.name),
        duration,
        image: albumImage



      };

    });
    res.json(tracks);

  } catch (error) {
    console.error('error fetching tracks', err.response?.data || error.message);
    res.status(500).json({ error: 'failed to fetch tracks' });

  }
});



function msToMinSet(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}: ${seconds < 10 ? '0' : ''}${seconds}`;
}

app.post('/details-playlist', checkAuthenticated, (req, res) => {
  const playlists = req.session.playlists || [];
  const { playlistId, playlistName } = req.body;
  // console.log(`${playlistId}`)

  console.log(`Received request to convert playlist: ${playlistName} (ID: ${playlistId})`);

  // Later: you'll trigger YouTube API search + playlist creation here

  // For now, redirect back to /STY with a flash message (optional) 


  // res.send(`Playlist "${playlistName}" with ID ${playlistId} is being processed for YouTube conversion.`);
  res.render('pages/details', { playlists })
});

// Signup page
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Register User (Sign Up)
app.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const existingUser = await collection.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res.status(400).send('User already exists. Please choose a different email or username.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new collection({
      username,
      email,
      password: hashedPassword,
    });


    await newUser.save();
    console.log(newUser);

    res.status(200).send('User registered successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Login User
app.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await collection.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(400).send('User not found');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).send('Wrong password');
    }

    // Store user data in session
    req.session.user = { username: user.username, email: user.email };

    // Debugging: Log user session data
    console.log('User Session:', req.session.user);

    // Redirect to profile page after successful login
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// logout route
app.get('/logout', checkAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Failed to logout');
    }

    // Optional: explicitly clear the cookie
    res.clearCookie('connect.sid');


    // Redirect to login
    res.redirect('/login');
  });
});


// Profile page - Displays profile info from session
app.get('/profile', checkAuthenticated, (req, res) => {
  const { username, email } = req.session.user;

  // Debugging: Log session data before rendering profile page
  console.log('Rendering profile page for user:', req.session.user);

  res.render('profile', { username, email, user: req.session.user });
});



// Example protected route for testing navbar links
app.get('/protected', checkAuthenticated, (req, res) => {
  res.send('This is a protected route.');
});

const youtube_client_id = process.env.YOUTUBE_CLIENT_ID;
const youtube_client_secret = process.env.YOUTUBE_CLIENT_SECRET;
const youtube_redirect_uri = process.env.YOUTUBE_REDIRECT_URI;

// Start YouTube login
app.get('/login/youtube', (req, res) => {
  const scope = 'https://www.googleapis.com/auth/youtube.force-ssl';
  const authURL = `https://accounts.google.com/o/oauth2/v2/auth?${querystring.stringify({
    client_id: youtube_client_id,
    redirect_uri: youtube_redirect_uri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent'
  })}`;
  res.redirect(authURL);
});

// Handle YouTube auth callback
app.get('/youtube/callback', async (req, res) => {

  const scope = 'https://www.googleapis.com/auth/youtube.force-ssl';

  const code = req.query.code;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
      code,
      client_id: youtube_client_id,
      client_secret: youtube_client_secret,
      redirect_uri: youtube_redirect_uri,
      grant_type: 'authorization_code'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token } = response.data;

    req.session.youtube_access_token = access_token;
    req.session.youtube_refresh_token = refresh_token;



    //fetch user profile 
    const profileResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      headers: {
        Authorization: `Bearer ${access_token}`
      },
      params: {
        part: 'snippet',
        mine: true
      }
    });
   const items = profileResponse?.data?.items;

if (!Array.isArray(items) || items.length === 0) {
  console.error('YouTube user has no channel or API returned empty result:', profileResponse?.data);
  return res.status(400).send('No YouTube channel found for this account.');
}


    const userProfile = items[0].snippet;

    const username = userProfile.title;
    const email = userProfile.customURL || 'unknown@example.com';

    req.session.user = {
      username: username,
      email: email,
      youtube: true,
      loginType: 'youtube'
    };


    console.log("YouTube Access Token:", access_token);

    res.redirect('/STY'); // Or wherever you want to go next

  } catch (err) {
    const message = err.response?.data || err.message || err;
    console.error('YouTube Auth Error:', message);
    res.redirect('/login');
  }

});

app.post('/create-youtube-playlist', async (req, res) => {
  const { playlistId, playlistName } = req.body;
  
  // FIXED SESSION VARIABLES
  const spotifyToken = req.session.access_token;
  const youtubeToken = req.session.youtube_access_token;

  if (!spotifyToken || !youtubeToken) {
    return res.status(401).send('Please connect both Spotify and YouTube accounts.');
  }

  try {
    // 1. Get tracks from Spotify
    const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
    });

    const data = response.data;
    const trackNames = data.items.map(item => {
      const track = item.track;
      const artists = track.artists.map(a => a.name).join(', ');
      return `${track.name} ${artists}`;
    });

    // 2. Search YouTube videos
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: youtubeToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const videoIds = [];
    for (const query of trackNames) {
      const searchRes = await youtube.search.list({
        part: 'snippet',
        q: query,
        maxResults: 1,
        type: 'video',
      });

      if (searchRes.data.items.length > 0) {
        videoIds.push(searchRes.data.items[0].id.videoId);
      }
    }

    // 3. Create YouTube playlist
    const playlistRes = await youtube.playlists.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: playlistName,
          description: 'Playlist created via Spotify → YouTube converter',
        },
        status: {
          privacyStatus: 'private'
        }
      }
    });

    const youtubePlaylistId = playlistRes.data.id;

    // 4. Add videos to the playlist
    for (const videoId of videoIds) {
      await youtube.playlistItems.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            playlistId: youtubePlaylistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            }
          }
        }
      });
    }

    res.send(`YouTube playlist "${playlistName}" created with ${videoIds.length} songs.`);
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to convert playlist.');
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running at port: ${port} https//:localhost:${port}`);
});



