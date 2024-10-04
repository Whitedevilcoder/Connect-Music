const express = require('express')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/', (req, res)=>{
   
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
