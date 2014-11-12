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
		    
		    if (statusCode !== 200) {
			Downtime.update(
			    {
				$and: [
				    {url: url},
				    {end: {$exists: false}}
				]
			    },
			    {
				$setOnInsert: {
				    url: url,
				    start: start
				},
				$inc: {pollCount: 1}
			    },
			    {
				upsert: true
			    }
			);
		    } else {
			Downtime.update(
			    {
				$and: [
				    {url: url},
				    {end: {$exists: false}}
				]
			    },
			    {
				$set: {end: start}
			    },
			    {
				upsert: false
			    }
			)
		    }

		    Polls.update(
			{
			    url: url,
			    start: start
			},
			{
			    $set: {
				duration: end - start,
				statusCode: statusCode
			    }
			}
		    );

		    var urlRecord = URLs.findOne({
			url: url
		    });

		    var time = urlRecord.statusCode === statusCode && urlRecord.time ?
			urlRecord.time :
			((!urlRecord.time || (start > urlRecord.time)) ?
			 start :
			 urlRecord.time);

		    URLs.update(
			{
			    url: url
			},
			{
			    $set: {
				statusCode: statusCode,
			        time: time,
				duration: end - start
			    }
			}
		    );
		});
	    })(start, url.url);
	}
    }

    var notify = function () {
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	var downtimeRecords = Downtime.find({
	    end: {$exists: false}
	}).fetch();

	for (var i = 0; i < downtimeRecords.length; i++) {
	    var downtimeRecord = downtimeRecords;

	    var url = URLs.findOne({
		url: downtimeRecord.url
	    });

	    if (url && url.lastNotified && url.lastNotified > downtimeRecord.start) {
		continue;
	    }

	    var users = Meteor.users.find({}).fetch();

	    var twilioClient = Twilio(
		Meteor.settings["Twilio"]["Account_SID"],
		Meteor.settings["Twilio"]["Auth_Token"]
	    );

	    for (var j = 0; j < users.length; j++) {
		if (users.profile.mobile) {
		    twilioClient.sendSms({
			to: users.profile.mobile,
			from: Meteor.settings["Twilio"]["From_Number"],
			body: "Unfortunately, " + url.url + " appears to have gone down."
		    });
		}
	    }
	    
	    urls.update(
		{
		    url: url.url
		},
		{
		    $set: {lastNotified: new Date()}
		}
	    );
	}
    }

    var cron = new Meteor.Cron({
	events: {
	    // Every minute
	    "* * * * *": poll,
	    "* * * * *": notify
	}
    });
});
