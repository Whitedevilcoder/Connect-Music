const express = require('express')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcrypt');

const app = express()
const port = 3000

// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('viewa', path.join(__dirname, 'views'));

// Serve static files from the 'client/public' directory
app.use('/public', express.static(path.join(__dirname, '../client/public')));

// Serve static files from the 'client/src' directory
app.use('/src', express.static(path.join(__dirname, '../Client/src')));


app.use('/css', express.static(path.join(__dirname, '../client/src/css')))
app.use('/img', express.static(path.join(__dirname, '../client/src/img')))
app.use('/js', express.static(path.join(__dirname, '../client/src/js')))



app.get('/', (req, res)=>{
  res.sendFile(path.join(__dirname, '../client/public/index.html'))
})
// app.get('/login', (req, res)=>{
//   res.sendFile(path.join(__dirname, '../client/public/loginForm.html'))
// })
app.get('/YTS', (req, res)=>{
  res.sendFile(path.join(__dirname, '../client/public/convert.html'))
})

app.get('/login', (req, res)=>{
  res.render('login');
})
app.get('/signup', (req, res)=>{
  res.render("signup");
});

app.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
});
