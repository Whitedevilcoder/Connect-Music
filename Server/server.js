const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const collection = require('./config/config'); // Ensure this path is correct

const app = express();
const port = 3000;

// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'client/public' directory
app.use('/public', express.static(path.join(__dirname, '../client/public')));
app.use('/src', express.static(path.join(__dirname, '../Client/src')));
app.use('/css', express.static(path.join(__dirname, '../client/src/css')));
app.use('/img', express.static(path.join(__dirname, '../client/src/img')));
app.use('/js', express.static(path.join(__dirname, '../client/src/js')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

app.get('/YTS', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/convert.html'));
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});
app.get('/profile', (req, res) => {
  // res.render('profile');
  const username = "johndoe"; // change after the user will logged in 


  res.render('profile', { username: username });
});

// Register User
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
      confirmPassword: hashedPassword,
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

    res.render('profile', { username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
});

