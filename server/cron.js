/* Copyright (c) 2014 Paul Etherton
 */

Meteor.startup(function () {

    var poll = function () {
	console.log("Polling...");
	var urls = URLs.find().fetch();
	
	for (var i = 0; i < urls.length; i++) {
	    
	    var url = urls[i];
	    console.log("Polling "+ url.url);
	    var start = new Date();

	    // Insert a record before the poll starts.  This way we have a record
	    // that we tried to poll even if it just hangs forever.  This also
	    // allows us to find things that are being polled now.
	    Polls.insert({
		url: url.url,
		start: start
	    });
	    
	    (function (start, url) {
		HTTP.get(
		    url,
		    {
			headers: {
			    "User-Agent": "uptimeMonitorBot/0.1 (+" + Meteor.absoluteUrl() + ")"
			},
			timeout: 300000,
			followRedirects: false
		    },
		    function (error, result) {
			var end = new Date();
		    
			var statusCode = -1;
		    
			if (result) {
			    statusCode = result.statusCode;
			}
			
			if (statusCode === 200) {
			    if (/text\/html/.test(result.headers["content-type"])) {
				statusCode = /<html.*?>/.test(result.content) ? 200 : -3;
				statusCode = /<html.*?>[^]*<html.*?>/.test(result.content) ? -2 : statusCode;
			    }
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

			if (statusCode != 200) {
			    Polls.update(
				{
				    url: url,
				    start: start
				},
				{
				    $set: {
					error: error,
					result: result
				    }
				}
			    );
			}
			
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
	console.log("Polled.");
    }

    var text = function () {
	console.log("Texting...");
	var downtimeRecords = Downtime.find({
	    $and: [
		{end: {$exists: false}},
		{pollCount: {$gte: 2}}
	    ]
	}).fetch();

	for (var i = 0; i < downtimeRecords.length; i++) {
	    var downtimeRecord = downtimeRecords[i];

	    var url = URLs.findOne({
		url: downtimeRecord.url
	    });

	    if (!url) {
		continue;
	    }

	    if (url.lastNotified && url.lastNotified > downtimeRecord.start) {
		continue;
	    }

	    var users = Meteor.users.find({}).fetch();

	    var twilioClient = Twilio(
		Meteor.settings["Twilio"]["Account_SID"],
		Meteor.settings["Twilio"]["Auth_Token"]
	    );

	    for (var j = 0; j < users.length; j++) {
		var user = users[j];
		if (user.profile && user.profile.mobile) {
		    twilioClient.sendSms({
			to: user.profile.mobile,
			from: Meteor.settings["Twilio"]["From_Number"],
			body: "Unfortunately, " + downtimeRecord.url + " appears to have gone down.  Visit " + Meteor.absoluteUrl() + " for up to date information."
		    });
		}
	    }
	    
	    URLs.update(
		{
		    url: downtimeRecord.url
		},
		{
		    $set: {lastNotified: new Date()}
		}
	    );
	}
	console.log("Texted.");
    }

    var email = function() {
	console.log("Emailing...");

	var downtimeRecords = Downtime.find({
	    end: {$exists: false}
	}).fetch();

	for (var i = 0; i < downtimeRecords.length; i++) {
	    var downtimeRecord = downtimeRecords[i];

	    var url = URLs.findOne({
		url: downtimeRecord.url
	    });

	    if (!url) {
		continue;
	    }

	    if (url.lastEmailed && url.lastEmailed > downtimeRecord.start) {
		continue;
	    }

	    var users = Meteor.users.find({}).fetch();

	    for (var j = 0; j < users.length; j++) {
		var user = users[j];
		if (user.emails && user.emails.length > 0) {
		    for (var k = 0; k < user.emails.length; k++) {
			var emailAddress = user.emails[k].address;
			Email.send({
			    from: "no-reply@" + Meteor.absoluteUrl().replace('http://', '').replace('/', ''),
			    to: emailAddress,
			    subject: "Uptime Monitoring: " + downtimeRecord.url + " has gone down.",
			    text: "Unfortunately, " + downtimeRecord.url + " appears to have gone down.  Visit " + Meteor.absoluteUrl() + " for up to date information.",
			    headers: {
				"X-Mailer": "uptimeMonitorBot/0.1 (+" + Meteor.absoluteUrl() + ")"
			});
		    }
		}
	    }
	    
	    URLs.update(
		{
		    url: downtimeRecord.url
		},
		{
		    $set: {lastEmailed: new Date()}
		}
	    );
	}
	console.log("Emailed.");
    }

    var cron = new Meteor.Cron({
	events: {
	    // Every minute
	    "* * * * *": function() {
		poll();
		text();
		email();
	    }
	}
    });
});
