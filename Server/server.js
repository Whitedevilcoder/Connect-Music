const express = require('express')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const port = 3000



app.use('/public', express.static(path.join(__dirname, '../client/public')));
app.use('/src', express.static(path.join(__dirname, '../client/src')));


// app.get('/', (req, res) => {
//   res.send('Hello World!')
// });



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
