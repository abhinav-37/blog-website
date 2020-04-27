require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyparser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//====================================================================================================
app.use(session({
  secret: "this is my secret to keep.",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

//=====================================================================================================================
 mongoose.connect("mongodb+srv://admin-Abhinav:admin-Abhinav@cluster0-fz1t0.mongodb.net/blogDB",{
 useNewUrlParser: true,
 useUnifiedTopology: true});

//=======================================================================================================================

const userSchema = new mongoose.Schema({

  username: String,
  password: String,
  googleId: String,
  content:[]
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("inputs", userSchema);
//==========================================================================================================================
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
//==============================================================================================================================
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/blog",

  },
  function(accessToken, refreshToken, profile, done) {

    User.findOrCreate({
      username:profile.name.givenName,
      googleId: profile.id
    }, function(err, user) {
      return done(err, user);
    });
  }
));





//============================================================================================================================
app.post("/show",function(req,res){
  res.redirect("/"+req.body.username);
});
app.get("/", function(req, res) {

  res.render("home");
});

app.get('/auth/google',passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/blog',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/compose');
  });
  app.get("/register", function(req, res) {
    res.render("register");
  });


app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/compose");
      });
    };
  });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(err) {
        res.redirect("/compose");
      });

    };
  });
});

app.get("/compose",function(req,res){
  if (req.isAuthenticated()) {

    res.render("compose",{
      nameOfUser:req.user.username
    });
    } else {
      res.redirect("/");
    }
  });


app.post("/compose",function(req, res) {

let data = {
  input:req.body.title,
  body:req.body.contentBody
};
req.user.content.unshift(data);
req.user.save();

res.redirect("/"+req.user.username);

});

app.get("/:newUser", function(req, res) {
  let name = req.params.newUser
  User.findOne({username:name},function(err,found){

      res.render("post",{
        username:name,
        contentarray:found.content
      });
  });


});
app.post("/showSingle",function(req,res){
  let myarray = req.body.postButton.split(",");
  console.log(myarray);
  User.findOne({username:myarray[0]},function(err,found){
    var fC = found.content
    for(var j=0;j<fC.length;j++){
      if (fC[j].input===myarray[1]) {
        res.render("singlePost",{
          username:myarray[0],
          title:myarray[1],
          body:fC[j].body
        });
      }


    }
  });


  });








app.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
