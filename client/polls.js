/* Copyright (c) 2014 Paul Etherton
 */

Template.polls.helpers({
    url: function () {
	return Session.get("url");
    },

    polls: function () {
	var url = Session.get("url");
	if (url) {
	    return (
		Polls.find(
		    {
			url: url
		    },
		    {
			sort: {
			    start: -1
			},
			// One hour's worth of poll data.
			limit: 60
		    }
		)
	    );
	}
    }
});
