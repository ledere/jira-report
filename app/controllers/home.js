var express = require('express'),
    _ = require('lodash'),
    router = express.Router(),
    Article = require('../models/article'),
    fs = require("fs"),
    parseString = require('xml2js').parseString,
    util = require("util");

module.exports = function (app) {
    app.use('/', router);
    app.use('/mvp', router);
};


router.get('/mvp', function (req, res, next) {

    var report = {};

    // read file
    fs.readFile('/Users/frank/Sites/jira-report/data/SearchRequest-10413.xml', function (err, data) {
        if (err) throw err;
        console.log(data);

        // convert xml > json
        json = parseString(data, function (err, result) {

            data = result.rss.channel[0];

            var versions = [],
                components = [],
                epics = [],
                stories = [],
                reportData = [],
                report;

            issues = data.item;

            for(var i = 0; i < issues.length;i++){

                var issue = issues[i],
                    mvp,
                    component,
                    epic;

                // add mvp to versions
                if (typeof(issue.fixVersion) === "object") {
                    mvp = issue.fixVersion[0];
                    if(versions.indexOf(mvp) === -1) {
                        versions.push(mvp);
                    }
                }

                // add component to components
                if (typeof(issue.component) === "object") {
                    component = issue.component[0];
                    if(components.indexOf(component) === -1) {
                        components.push(component);
                    }
                }

                // add epic to epic list
                if (issue.type[0]._ === "Epic") {
                    epic = {
                        summary: issue.summary[0],
                        key: issue.key[0]._,
                        component: component,
                        version: mvp,
                        stories: []
                    }
                    epics.push(epic);

                }

            }


            // find stories under epic
            for(var j = 0; j < issues.length;j++){
                issue = issues[j];

                if (issue.type[0]._ === "Story" && issue.customfields.length > 0) {
                    // loop through customfields
                    for(var k = 0; k < issue.customfields.length;k++){

                        cfs = issue.customfields[k];
                        for(var l = 0; l < cfs.customfield.length;l++){
                            cf = cfs.customfield[l];
                            if (cf.customfieldname[0] === "Epic Link") {

                                // get Epic
                                var epicLink = cf.customfieldvalues[0].customfieldvalue[0];

                                // find Corresponding Epic by key
                                epicIndex = _.findIndex(epics, {key: epicLink});

                                var story = {
                                    summary: issue.summary[0],
                                    status: issue.status[0]._
                                }

                                // push story to Epic
                                epics[epicIndex].stories.push(story);

                            }
                        }
                    }
                }
            }


            // sort versions
            versions = versions.sort();
//            console.log("versions", versions);

            // sort Components list
            components = components.sort();
//            console.log("components", components);

            epics = epics.sort();
//            console.log("epics", epics);


            for(var i = 0; i < versions.length;i++){
                // loop through components

                MVP = {
                    version: versions[i],
                    components: []
                }


                for(var j = 0; j < components.length;j++){


                    COMPONENT = {
                        component: components[j],
                        componentParent: components[j].substr(0, 1),
                        epics: []
                    }

                    // find epic with MVP and COMPONENT
                    for(var k = 0; k < epics.length;k++){
                        epic = epics[k];

                        if (epic.version === versions[i] && epic.component === components[j]) {

//                            console.log("VERSION", versions[i]);
//                            console.log("COMPONENT", components[j]);
//                            console.log("EPIC", epic);

                            COMPONENT.epics.push(epic);
                        }
                    }

                    MVP.components.push(COMPONENT);

                }

                reportData.push(MVP);
//                console.log("reportData", reportData);
                console.log(util.inspect(reportData, {showHidden: false, depth: null}));

            }

            // render template with report
            res.render('mvp', {
                title: 'mvp-report',
                report: reportData,
                components: components,
                versions: versions
            });
        });

    });



});


router.get('/', function (req, res, next) {

    // declare local variables
    var report = {};

    // read file
    fs.readFile('/Users/frank/Sites/jira-report/data/all.xml', function (err, data) {
        if (err) throw err;
        console.log(data);

        // convert xml > json
        json = parseString(data, function (err, result) {

            report = result.rss.channel[0];

            // get number of issues
            report.numberOfIssues = Object.keys(report.item).length;
            report.dateCreated = report["build-info"][0]["build-date"][0];

            // get unique Epics in list
            var epics = [];


//			console.log(report.item[7].attachments[0].attachment.length);

            // render template with report
            res.render('report', {
                title: 'jira-report',
                report: report
            });
        });

    });



});
