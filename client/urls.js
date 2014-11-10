/* Copyright (c) 2014 Paul Etherton
 */

var statusCodeMangle = function (statusCode) {
    var result = statusCode || -1;
    return result === -1 ? 1000 : result;
}

Template.urls.helpers({
    urls: function () {
	return URLs.find().fetch().sort(function (url1, url2) {
	    var statusCode1 = statusCodeMangle(url1.statusCode);
	    var statusCode2 = statusCodeMangle(url2.statusCode);
	    if (statusCode2 - statusCode1 !== 0) {
		return statusCode2 - statusCode1;
	    } else if (url1.time && url2.time &&
		       (url2.time.toUTCString() !== url1.time.toUTCString())) {
		return statusCode1 === 200 ?
		    (url2.time - url1.time) :
		    (url1.time - url2.time);
	    } else {
		return (url2.duration || 300000) - (url1.duration || 300000);
	    }
	});
    }
});

Template.urls.events({
    "submit form": function (event, template) {

	Meteor.call("validateUrl", event.target.url.value,
		    (function (url) {return function (error, result) {
	    if (result) {
		URLs.insert({
		    url: url
		});
	    }
	}})(event.target.url.value));

	// Clear the form.
	event.target.reset();
	// There is no need to actually submit the form.
	event.preventDefault();
    },

    "click .url": function (event, template) {
	Session.set("url", event.target.innerHTML);
    },

    "click .remove": function (event, template) {
	URLs.remove({ _id: event.target.id });
    }
});
