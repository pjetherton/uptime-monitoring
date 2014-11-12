/* Copyright (c) 2014 Paul Etherton
 */

Template.registerHelper("dateFormat", function (date) {
    today = new Date();
    if (today.getFullYear() === date.getFullYear() &&
	today.getMonth() === date.getMonth() &&
	today.getDate() === date.getDate()) {
	return date.toLocaleTimeString();
    } else {
	return date.toLocaleDateString();
    }
});

Template.registerHelper("pollStyle", function (statusCode) {
    return (statusCode && statusCode !== 200) ? "color: red; background: pink" : "";
});
