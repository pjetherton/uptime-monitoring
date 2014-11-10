/* Copyright (c) 2014 Paul Etherton
 */

Template.mobileSet.events({
    "submit form": function (event, template) {
	event.preventDefault();

	if (!Meteor.user()) {
	    return;
	}

	Meteor.call("setMobile", Meteor.userId(), event.target.mobile.value, function (error, result) {
	    if (error) {
		alert(error);
	    } else {
		alert(result);
	    }
	});
    }
});
