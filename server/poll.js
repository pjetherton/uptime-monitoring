/* Copyright (c) 2014 Paul Etherton
 */

Meteor.startup(function () {

    var poll = function () {
	
	var urls = URLs.find().fetch();
	
	for (var i = 0; i < urls.length; i++) {
	    
	    var url = urls[i];
	    var start = new Date();
	    
	    // Insert a record before the poll starts.  This way we have a record
	    // that we tried to poll even if it just hangs forever.  This also
	    // allows us to find things that are being polled now.
	    Polls.insert({
		url: url.url,
		start: start
	    });
	    
	    (function (start, url) {
		HTTP.get(url, { timeout: 300000, followRedirects: false }, function (error, result) {
		    var end = new Date();
		    
		    var statusCode = -1;
		    
		    if (result) {
			var statusCode = result.statusCode;
		    }
		    
		    Polls.update(
			{
			    url: url,
			    start: start
			},
			{
			    url: url,
			    start: start,
			    duration: end - start,
			    statusCode: statusCode
			}
		    );

		    var urlRecord = URLs.findOne({
			url: url
		    });

		    var time = urlRecord.statusCode === statusCode && urlRecord.time ?
			urlRecord.time :
			(start > urlRecord.time ? start : urlRecord.time);

		    URLs.update(
			{
			    url: url
			},
			{
			    url: url,
			    statusCode: statusCode,
			    time: time,
			    duration: end - start
			}
		    );
		});
	    })(start, url.url);
	}
    }
    
    var cron = new Meteor.Cron({
	events: {
	    // Every minute
	    "* * * * *": poll
	}
    });
});
