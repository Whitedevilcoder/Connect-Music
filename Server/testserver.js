const express = require('express')
const path = require("path")
const app = express()
const port = 5000


app.use('/css', express.static(path.join(__dirname, '../client/src/css')))
app.use('/img', express.static(path.join(__dirname, '../client/src/img')))
app.use('/js', express.static(path.join(__dirname, '../client/src/js')))

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res)=> {
    res.render('signup');
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
