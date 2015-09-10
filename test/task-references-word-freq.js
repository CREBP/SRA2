global.config = require('../config');
var _ = require('lodash').mixin(require('lodash-keyarrange'));
var async = require('async-chainable');
var expect = require('chai').expect;
var fs = require('fs');
var mlog = require('mocha-logger');
var moment = require('moment');
var reflib = require('reflib');
var request = require('superagent');

describe('Task: references-word-freq', function(){
	// Library specific info
	var libraryFile = __dirname + '/data/endnote-2.xml';
	var libraryCount = 5;

	var refs = [];
	var agent = request.agent();

	// Upload library for comparison {{{
	it('should read the original EndNote file', function(finish) {
		this.timeout(30 * 1000);
		reflib.parseFile(libraryFile)
			.on('error', finish)
			.on('ref', function(ref) {
				refs.push(ref);
			})
			.on('end', function(count) {
				expect(count).to.equal(libraryCount);
				finish();
			});
	});

	it('should login', function(finish) {
		agent.post(config.url + '/api/users/login')
			.send({username: 'mc', password: 'qwaszx'})
			.end(function(err, res) {
				if (err) return finish(err);
				expect(err).to.be.not.ok;
				expect(res.body).to.have.property('_id');
				expect(res.body).to.have.property('username');
				finish();
			});
	});

	var library;
	it('should upload a test library', function(finish) {
		this.timeout(60 * 1000);
		agent.post(config.url + '/api/libraries/import')
			.field('libraryTitle', 'TEST: references-word-freq')
			.field('libraryExpires', '3 hours')
			.field('json', 'true')
			.attach('file', libraryFile)
			.end(function(err, res) {
				if (err) return finish(err);
				library = res.body;
				expect(err).to.be.not.ok;
				expect(library).to.have.property('_id');
				expect(library).to.have.property('title');
				expect(library).to.have.property('url');
				finish();
			});
	});

	it('should provide the original reference library', function(finish) {
		this.timeout(60 * 1000);
		agent.get(config.url + '/api/references')
			.query({library: library._id})
			.end(function(err, res) {
				if (err) return finish(err);
				expect(err).to.be.not.ok;
				expect(res.body).to.be.an('array');
				expect(res.body).to.have.length(libraryCount);
				refs = res.body;
				finish();
			});
	});
	// }}}

	var task;
	it('should queue up the word-frequency task', function(finish) {
		this.timeout(60 * 1000);
		agent.post(config.url + '/api/tasks/library/' + library._id + '/references-word-freq')
			.send({settings: {debug: true}})
			.end(function(err, res) {
				if (err) return finish(err);
				task = res.body;
				expect(err).to.be.not.ok;
				expect(task).to.have.property('_id');
				finish();
			});
	});

	it('should keep checking until the task is complete', function(finish) {
		var pollInterval = 3 * 1000;
		this.timeout(5 * 60 * 1000);
		var checkTask = function() {
			agent.get(config.url + '/api/tasks/' + task._id)
				.end(function(err, res) {
					if (err) {
						checkTaskComplete(err, res);
					} else {
						var progress = res.body.progress;
						mlog.log('[' + moment().format('HH:mm:ss') + '] Task still pending' + (progress.current ? (' ' + progress.current + ' / ' + progress.max + ' ~ ' + Math.ceil(progress.current / progress.max * 100).toString() + '%') : ''));
						if (res.body.status == 'completed') {
							checkTaskComplete(err, res);
						} else {
							setTimeout(checkTask, pollInterval);
						}
					}
				});
		};
		setTimeout(checkTask, pollInterval);

		var checkTaskComplete = function(err, res) {
			expect(err).to.be.not.ok;
			expect(res.body).to.have.property('_id');
			expect(res.body).to.have.property('status', 'completed');
			task = res.body;
			mlog.log('Analysis URL:', task.destination);
			finish();
		};
	});

	it('should have a task result', function(finish) {
		expect(task.result).to.be.an.object;
		console.log('Top 10 results:',
			_(task.result)
				.map(function(val, key) {
					return {word: key, count: val};
				})
				.sortBy('-count')
				.slice(0, 10)
				.value()
		);

		expect(task.result['carcinomas']).to.equal(4);
		expect(task.result['female']).to.equal(3);
		expect(task.result['breast']).to.equal(17);
		expect(task.result['histological']).to.equal(3);
	});
});