/* Copyright (c) 2014 Paul Etherton
 */

Meteor.startup(function () {
    URLs.allow({
	insert: function () {
	    return true;
	},
	
	remove: function() {
	    return true;
	}
    });
});
