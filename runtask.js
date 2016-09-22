#!/usr/bin/env node
var _ = require('lodash');
var async = require('async-chainable');
var colors = require('colors');
var program = require('commander');

global.config = require('./config');
require('./config/db');

program
	.version(require('./package.json').version)
	.option('-t, --task [id]', 'The Task ID to execute')
	.parse(process.argv);

var Tasks = require('./models/tasks');

async()
	.set('prefix', colors.blue('[TASK RUNNER' + (program.task ? '/' + program.task : '') + ']'))
	.then('task', function(next) {
		if (!program.task) return next('No Task ID specified');
		Tasks.findOne({_id: program.task}, next);
	})
	.then(function(next) {
		// Sanity checks {{{
		if (!this.task || !this.task._id) return next('Task ID not found: ' + program.task);
		if (this.task.status != 'pending') {
			if (program.force) {
				console.log(this.prefix, 'Task status is', colors.cyan(this.task.status), 'but forcing anyway');
			} else {
				return next('Task status is ' + this.task.status + '. Refusing to run without --force');
			}
		}
		next();
		// }}}
	})
	.then(function(next) { // Mark as processing so the next cycle doesn't grab it
		this.task.status = 'processing';
		this.task.save(next);
	})
	.then(function(next) {
		var task = this.task;
		try {
			var worker = require('./tasks/' + task.worker);
		} catch (e) {
			return next('Error loading worker ' + task.worker + ' - ' + e.toString());
		}

		console.log(this.prefix, 'Starting task', colors.cyan(task._id), 'with worker', colors.cyan(task.worker));

		worker(function(err) {
			if (err) {
				task.status = 'error';
				task.history.push({
					type: 'error',
					response: err.toString(),
				});
				task.save(next);
			} else {
				task.touched = new Date();
				task.status = 'completed';
				task.save(next);
			}
		}, task);
	})
	.end(function(err) {
		if (err) {
			console.log(this.prefix, colors.red('ERROR'), err.toString());
			process.exit(1);
		} else {
			console.log(this.prefix, colors.green('COMPLETE'));
			process.exit(0);
		}
	});
