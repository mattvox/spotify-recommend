var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromAPI = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    
    unirest.get('http://api.spotify.com/v1/' + endpoint)
        .qs(args)
        .end(function(response) {
            if (response.ok) {
                emitter.emit('end', response.body);
            } 
            else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
}

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var userLimit = req.query.limit;
    
    var searchReq = getFromAPI('search', {
        q: req.params.name,
        limit: userLimit,
        type: 'artist'
    });
    
    searchReq.on('end', function(item) {
        
        var artist = item.artists.items[0];
        
        var getRelated = getFromAPI('artists/'+ artist.id +'/related-artists', {});
        
        getRelated.on('end', function(item) {
            artist.related = item.artists;
            
            res.json(artist);
        })
        
        getRelated.on('error', function(code) {
            res.sendStatus(code);
        })
        //res.json(artist);
    });
    
    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});

// search for related artists

//first must obtain artist ID, then use artist ID to search for related artists



app.listen(process.env.PORT || 8080);