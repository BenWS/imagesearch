//9-27-16: Image search not working - the URL is working fine in the browser:

//https://www.googleapis.com/customsearch/v1?q=cats&cx=006801059266696537146%3Adp5kyaaobiw&num=10&searchType=image&fields
//=items(formattedUrl%2Cimage(contextLink%2CthumbnailLink)%2Clink%2Csnippet)&key=AIzaSyAbMY7RMmAbTSOrDCyVKRn9HR-ug4TLoBQ

var express = require('express');
var app = express();
var httpRequest = require('request');
var mongo = require('mongodb').MongoClient;
var dateformat = require('dateformat');

//logs search terms and time search was made whenever user visits path
app.get('/imageSearch/:searchTerms', function(request, response) {

    mongo.connect('mongodb://heroku_sv3gzsts:ghanjlbubvodkmbra92slljng9@ds041536.mlab.com:41536/heroku_sv3gzsts', function (err, db) {
        
        //google api request URL
         var apiRequest = "https://www.googleapis.com/customsearch/v1?q=+" + request.params.searchTerms + 
        "&cx=006801059266696537146%3Adp5kyaaobiw&num=10&searchType=image&start=" + (1 + request.query.offset*10) +
        "&fields=items(formattedUrl%2Cimage(contextLink%2CthumbnailLink)%2Clink%2Csnippet)" +
        "&key=AIzaSyAbMY7RMmAbTSOrDCyVKRn9HR-ug4TLoBQ";
        
        //creating record of search
        var currentTime = dateformat(Date.now(),"isoDateTime");
        var searchHistory = db.collection("searchHistory");
        searchHistory.insert({"terms":request.params.searchTerms, "when":currentTime});
        
        
        //image search request
        httpRequest("https://www.googleapis.com/customsearch/v1?q=+" + request.params.searchTerms + 
        "&cx=006801059266696537146%3Adp5kyaaobiw&num=10&searchType=image&start=" + (1 + request.query.offset*10) +
        "&fields=items(formattedUrl%2Cimage(contextLink%2CthumbnailLink)%2Clink%2Csnippet)" +
        "&key=AIzaSyAbMY7RMmAbTSOrDCyVKRn9HR-ug4TLoBQ", 
        (error, httpResponse, body) => {
                
            var result = JSON.parse(body);
            
            var output = [];
            
            var snippet;
            var context;
            var thumbnail;
            var url;
            var jsonResponse
            
            if (httpResponse.statusCode == 200) {
                for (var i = 0; i < result["items"].length; i++) {
                         url = result["items"][i].link;
                         snippet = result["items"][i].snippet;
                         context = result["items"][i].image.contextLink;
                         thumbnail = result["items"][i].image.thumbnailLink
                         output.push({"url":url, "alt":snippet, "contextLink":context, "thumbnailLink":thumbnail});
                }
                response.send(output);
                response.end();
                
            } else if (httpResponse.statusCode == 400) {
                response.send(httpResponse.statusCode + ' Bad Request:' + httpResponse.statusMessage);
                response.end(apiRequest);
            }
        })
        
        db.close();
    })
})

//pull top 10 mongodb records sorted by the newest
//

app.get('/imageSearch', function (request, response) {
    
    mongo.connect('mongodb://heroku_sv3gzsts:ghanjlbubvodkmbra92slljng9@ds041536.mlab.com:41536/heroku_sv3gzsts', function (err, db) {
        
        var searchHistory = db.collection("searchHistory");
        
        searchHistory.find().sort({"when": -1}).toArray( (err, docs) => {
            response.json(docs);
        })
        
        db.close();
    })
})

app.listen(process.env.PORT);