var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;

var port = process.env.PORT || 3000;

var collection;


MongoClient.connect("mongodb://seb:password@ds151544.mlab.com:51544/leaderboard", function(err, db) {
  if(!err) {
    console.log("Mongodb connected");

    collection = db.collection('test', function(err, collection) {});

  }
  else
  {
    console.log(err);
  }
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



app.get('/:path', function(req, res, next) {
  res.sendFile(__dirname + '/views/' + req.params.path + '.html');
});



// command-post.html will post to this end point when the submit button is pressed
app.post('/update-leaderboard-command', function(req, res) {
  collection.insert(req.body);
  var formatedData = formatData(req.body);
  // check that this is not creating a new connection
  io.on('connection', function(socket){
      io.emit('new_score_update', formatedData);
  });
});




// command.html will directly use the same socket connection
io.on('connection', function(socket){
  socket.on('new_score_command', function(msg){
    collection.insert(msg);
    var data = JSON.parse(msg);
    if (!data.message)  {
      return false;
    }
    var formatedData = formatData(data);
    io.emit('new_score_update', formatedData);
  });
});




http.listen(port, function(){
  console.log('listening on *:' + port);
});



app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  res.status(err.status || 500);
  res.render('error');
});


function formatData(data)
{
  var data = JSON.stringify({
    message: '<strong>' + data.name + '</strong>: ' + data.message,
    leaderboard: data.leaderboard
  });
  console.log('data' + data);
  console.log('response' + '<strong>' + data.name + '</strong>: ' + data.message);
  return data;
}


module.exports = app;