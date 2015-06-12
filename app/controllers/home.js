var express = require('express'),
	router = express.Router(),
	Article = require('../models/article'),
	fs = require("fs"),
	parseString = require('xml2js').parseString;

module.exports = function (app) {
	app.use('/', router);
};

router.get('/', function (req, res, next) {

	// declare local variables
	var report = {};

 	// read file
 	fs.readFile('/Users/frank/Sites/jira-report/data/report.xml', function (err, data) {
 		if (err) throw err;
 		console.log(data);

		// convert xml > json
		json = parseString(data, function (err, result) {

			report = result.rss.channel[0];



			console.log(report.item[0].key[0]);

	    	// render template with report
	    	res.render('report', {
	    		title: 'jira-report',
	    		report: report
	    	});
	    });


	});
 	


 });
