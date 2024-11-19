const { name } = require('ejs');
const mongoose = require("mongoose")
const connect = mongoose.connect('mongodb://localhost:27017/login')


// check db is connected

connect.then(() => {
    console.log("db is connected");

})

    .catch(() => {
        console.log("db cannot be connected");

    })

// schema
const loginSchema = new mongoose.Schema({
   
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
  
    password: {
        type: String,
        required: true
    },
    confirmPassword: {
        type: String,
        required: true
    }
  
});

// moddel

const collection = new mongoose.model("userdetails", loginSchema);

module.exports = collection;
