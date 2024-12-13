// const express = require('express');
// const path = require('path');
// const bcrypt = require('bcrypt');
// const mongoose = require('mongoose');

// const app = express();
// const port = 5000;


// // Serve static files from the 'client/public' directory
// app.use('/public', express.static(path.join(__dirname, '../client/public')));

// // Serve static files from the 'client/src' directory
// app.use('/src', express.static(path.join(__dirname, '../client/src')));

// // Parse JSON bodies (as sent by API clients)
// app.use(express.json());
// // Parse URL-encoded bodies (as sent by HTML forms)
// app.use(express.urlencoded({ extended: true }));

// app.set('view engine', 'ejs'); // or 'pug', 'hbs', etc.
// // app.set('views', path.join(__dirname, './client/views')); // Adjust if needed

// // console.log(path.join(__dirname, '')); // Check the resolved path



// app.get('/', (req, res)=>{
//     res.render("login");
// });
// app.get('/signup', (req, res)=>{
//     res.render("signup");
// });

// app.listen(port, ()=>{
//     console.log(`server is running on port: ${port}`);
    
// })