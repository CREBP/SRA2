var _ = require('lodash');
var async = require('async-chainable');
var colors = require('colors');
var Libraries = require('../models/libraries');
var References = require('../models/references');
var Tasks = require('../models/tasks');

/**
* Create a combined on an entire library (assume all references, unless req.params.references is specified)
* @param string req.params.libid The library ID to operate on
* @param string req.params.worker The worker to allocate
* @param object req.body.settings Additional options to pass to the records (stored in processQueue.settings)
* @param string req.body.settings.references Specific references to operate on - otherwise all are assumed
*/
app.all('/api/tasks/library/:libid/:worker', function(req, res) {
	async()
		.set('settings', req.body.settings || {})
		// Sanity checks {{{
		.then(function(next) {
			if (!req.user) return next('You are not logged in');
			if (!req.params.libid) return next('libid must be specified');
			if (!req.params.worker) return next('worker must be specified');
			next();
		})
		// }}}
		.then('library', function(next) {
			Libraries.findOne({_id: req.params.libid, status: 'active'}, next);
		})
		.then('references', function(next) {
			var query = {library: this.library._id, status: 'active'};
			if (req.body.settings && req.body.settings.references) { // Work on specific references
				query['_id'] = {'$in': req.body.settings.references};
				delete(req.body.settings.references);
			}

			References
				.find(query)
				.select('_id')
				.exec(next);
		})
		.then('task', function(next) {
			Tasks.create({
				creator: req.user,
				worker: req.params.worker,
				owner: req.user._id,
				library: this.library._id,
				references: this.references.map(function(ref) { return ref._id }),
				history: [{type: 'queued'}],
				settings: this.settings || null,
			}, next);
		})
		.end(function(err) {
			if (err) {
				console.log(colors.red('TASK REJECTED'), err);
				return res.status(400).send(err);
			}
			res.send({_id: this.task._id});
		});
});


/**
* Get the status of a task
* @param string req.params.id The task ID to query
*/
app.get('/api/tasks/:id', function(req, res) {
	async()
		// Sanity checks {{{
		.then(function(next) {
			if (!req.user) return next('You are not logged in');
			if (!req.params.id) return next('id must be specified');
			next();
		})
		// }}}
		.then('task', function(next) {
			Tasks
				.findOne({_id: req.params.id})
				.select('_id created library status progress history result destination')
				.exec(next);
		})
		.end(function(err) {
			if (err) return res.status(400).send(err);
			res.send(this.task);
		});
});
