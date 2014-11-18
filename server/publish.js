/* Copyright (c) 2014 Paul Etherton
 */

Meteor.publish("urls", function () {
    return URLs.find();
});

Meteor.publish("polls", function () {
    return Polls.find({
	$or: [
	    {start: {$gte: new Date(new Date() - (1000 * 60 * 60))}},
	    {statusCode: {$ne: 200}}
	]
    });
});

Meteor.publish("downtime", function () {
    return Downtime.find();
});
