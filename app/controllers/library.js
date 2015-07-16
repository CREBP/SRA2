app.controller('libraryController', function($scope, $rootScope, $httpParamSerializer, $filter, $interval, $location, $stateParams, $window, Libraries, Settings, References, ReferenceTags, Tasks) {
	$scope.loading = true;
	$scope.library = null;
	$scope.tags = null;
	$scope.tagsObj = null; // Object lookup for tags
	$scope.activeTag = null;
	$scope.references = null;
	
	// Data refresher {{{
	$scope.refresh = function() {
		if (!$scope.library) return;

		// Library {{{
		Libraries.get({id: $scope.library._id}).$promise.then(function(data) {
			$scope.library = data;
			// Decorators {{{
			// Default values {{{
			if (!$scope.library.screening) $scope.library.screening = {};
			if (!$scope.library.screening.weightings) $scope.library.screening.weightings = [];
			// }}}
			// .referenceCount {{{
			$scope.library.referenceCount = null;
			References.count({library: $scope.library._id}).$promise.then(function(countData) {
				$scope.library.referenceCount = countData.count;
			});
			// }}}
			// Files {{{
			if ($scope.library.files) {
				var fileIcons = [
					{re: /\.pdf$/i, icon: 'fa fa-file-pdf-o'},
					{re: /\.(jpe?g|gif|png|webm)$/i, icon: 'fa fa-file-image-o'},
					{re: /\.txt$/i, icon: 'fa fa-file-text-o'},
					{re: /\.docx?$/i, icon: 'fa fa-file-word-o'},
					{re: /\.(zip|rar)$/i, icon: 'fa fa-file-archive-o'},
					{re: /\.pptx?$/i, icon: 'fa fa-file-powerpoint-o'},
					{re: /\.(mov|avi|mp4|mpe?g)?$/i, icon: 'fa fa-file-video-o'},
					{re: /\.(au|mp3|ogg?)?$/i, icon: 'fa fa-file-audio-o'},
					{re: /./, icon: 'fa fa-file-o'},
				];
				$scope.library.files = $scope.library.files.map(file => {
					file.icon = (fileIcons.find(function(fi) { return re.match(file.name) })).icon;
				});
			}
			// }}}
			// }}}
		});
		// }}}
		$scope.refreshReferences();

		// Reference Tags {{{
		ReferenceTags.query({library: $scope.library._id}).$promise.then(function(data) {
			$scope.tagsObj = {};

			// Add meta tags {{{
			data.push({
				_id: '_all',
				meta: true,
				title: 'All',
				icon: 'fa fa-star',
				filter: function(ref) { return true },
			});
			data.push({
				_id: '_untagged',
				meta: true,
				title: 'Untagged',
				icon: 'fa fa-star-o',
				filter: function(ref) { return !ref.tags || !ref.tags.length },
			});
			// }}}

			$scope.tags = data
				.sort(function(a, b) {
					if (a.meta && !b.meta) {
						return -1;
					} else if (b.meta && !a.meta) {
						return 1;
					} else if (a.title > b.title) {
						return 1;
					} else if (b.title < a.title) {
						return -1;
					} else {
						return 0;
					}
				})
				.map(function(tag) {
					if (tag.meta) return tag;
					tag.meta = false;
					// Decorators {{{
					// .referenceCount {{{
					tag.referenceCount = null;
					References.count({library: $scope.library._id, tags: tag._id}).$promise.then(function(countData) {
						tag.referenceCount = countData.count;
					});
					// }}}
					// Add to tagsObj lookup {{{
					$scope.tagsObj[tag._id] = tag;
					// }}}
					return tag;
					// }}}
				})
			if ($location.search()['tag']) $scope.activeTag = _.find($scope.tags, {_id: $location.search()['tag']});
		});
		// }}}
	};

	$scope.refreshReferences = function() {
		$scope.references = [];
		$scope.refChunk = 0;
		$scope._refreshReferenceChunk();
	};

	/**
	* Load references in to the system in chunks (determined by Settings.getLimits.references)
	*/
	$scope._refreshReferenceChunk = function() {
		var rQuery = {
			library: $scope.library._id,
			status: 'active',
			limit: Settings.getLimits.references,
			skip: Settings.getLimits.references * $scope.refChunk,
		};
		if ($scope.activeTag && !$scope.activeTag.meta) rQuery.tags = $scope.activeTag._id;

		References.query(rQuery).$promise.then(function(data) {
			$scope.references = $scope.references.concat(
				data.map(ref => {
					// Decorators {{{
					// select already selected references (e.g. if changing tabs) {{{
					if (_.find($scope.selected, {_id: ref._id})) ref.selected = true;
					// }}}
					return ref;
					// }}}
				})
			);
			if ($scope.activeTag && $scope.activeTag.filter) { // Meta tag filtering
				$scope.references = $scope.references.filter($scope.activeTag.filter);
			}
			$scope.references = $filter('orderBy')($scope.references, $scope.sort, $scope.sortReverse);
			$scope.determineSelected();

			if (data.length < $scope.refChunk) { // Exhausted refs from server
				$scope.loading = false;
			} else {
				console.log('REQ', $scope.refChunk);
				$scope.refChunk++;
				$scope._refreshReferenceChunk();
			}
		});
	};
	// }}}

	// Selected references {{{
	$scope.selected = [];
	/**
	* Called on each references.selected change to populate $scope.selected
	*/
	$scope.determineSelected = function() {
		$scope.selected = $scope.references.filter(ref => { return !! ref.selected });
	};

	$scope.selectAction = function(what, operand) {
		switch (what) {
			case 'all':
				$scope.references.forEach(ref => { ref.selected = true });
				break;
			case 'none':
				$scope.references.forEach(ref => { ref.selected = false });
				break;
			case 'invert':
				$scope.references.forEach(ref => { ref.selected = !ref.selected });
				break;
			case 'byTag':
				$scope.references.forEach(ref => {
					ref.selected = _.contains(ref.tags, operand._id);
				});
				break;
			case 'byNoTag':
				$scope.references.forEach(ref => {
					ref.selected = !ref.tags.length;
				});
				break;
			case 'tag':
				if ($scope.selected.every(ref => { return _.contains(ref.tags, operand._id) })) { // Are we untagging?
					$scope.selected.forEach(ref => {
						ref.tags = _.without(ref.tags, operand._id);
					});
				} else { // Tagging
					$scope.selected.forEach(ref => {
						if (!_.contains(ref.tags, operand._id)) ref.tags.push(operand._id);
					});
				}
				$scope.selected.forEach(ref => {
					References.save({id: ref._id}, {tags: ref.tags});
				});
				break;
			case 'tag-clear':
				$scope.selected.forEach(ref => {
					ref.tags = [];
					References.save({id: ref._id}, {tags: ref.tags});
				});
				break;
			case 'export': // Operation -> Export
				$rootScope.$broadcast('referenceBucket', $scope.selected.map(r => { return r._id }));
				$location.path('/libraries/' + $scope.library._id + '/export');
				break;
			case 'request': // Operation -> Journal request
				$rootScope.$broadcast('referenceBucket', $scope.selected.map(r => { return r._id }));
				$location.path('/libraries/' + $scope.library._id + '/request');
				break;
			case 'dedupe': // Operation -> Dedupe
				$rootScope.$broadcast('referenceBucket', $scope.selected.map(r => { return r._id }));
				$location.path('/libraries/' + $scope.library._id + '/dedupe');
				break;
			case 'screen': // Operation -> Screen
				$rootScope.$broadcast('referenceBucket', $scope.selected.map(r => { return r._id }));
				$location.path('/libraries/' + $scope.library._id + '/screen');
				break;
			case 'delete':
				$scope.selected.forEach(ref => {
					ref.status = 'deleted';
					References.save({id: ref._id}, {status: ref.status});
				});
				break;
		}
		$scope.determineSelected();
	};
	// }}}

	// Sorting {{{
	$scope.sort = 'title';
	$scope.sortReverse = false;
	$scope.setSort = function(method) {
		if ($scope.sort == method) { // Already set - reverse method
			$scope.sortReverse = !$scope.sortReverse;
		} else if (method.substr(0, 1) == '-') { // Set into reverse
			$scope.sort = method.substr(1);
			$scope.sortReverse = true;
		} else { // Changing method
			$scope.sort = method;
			$scope.sortReverse = false;
		}
		$scope.references = $filter('orderBy')($scope.references, $scope.sort, $scope.sortReverse);
	};
	// }}}

	// Saver {{{
	/**
	* Attempt to save various library information and reload from server
	* @param array|string keys Optional key or keys of information to save, if omitted all safe fields will be used
	* @param string url Optional URL to navigate to after saving
	*/
	$scope.save = function(keys, url) {
		Libraries.save(
			{id: $scope.library._id},
			_.pick($scope.library, keys || ['status', 'title', 'tags'])
		).$promise.then(function() {
			if (url) {
				$location.path(url);
			} else {
				$scope.refresh();
			}
		});
	};
	// }}}

	// Settters {{{
	$scope.set = function(key, value) {
		$scope.library[key] = value;
		$scope.save(key);
	};
	// }}}

	// Display columns {{{
	$scope.isScreening = false;
	$scope.$watch('library', function() {
		$scope.isScreening = (
			$scope.library &&
			$scope.library.screening &&
			$scope.library.screening.lastWeighting &&
			$scope.library.screening.lastWeighting.hash
		);
	});
	// }}}

	// Watchers {{{
	// Set the breadcrumb title if we dont already have one {{{
	$scope.$watch('library.title', function() {
		if (!$scope.library) return;
		$rootScope.$broadcast('setTitle', $scope.library.title);
	});
	// }}}

	// Recalculate the meta tag numbers {{{
	$scope.$watch('references', function() {
		if (!$scope.references || !$scope.tags) return;

		var tag = _.find($scope.tags, {_id: '_all'});
		tag.referenceCount = $scope.references.length;

		var tag = _.find($scope.tags, {_id: '_untagged'});
		tag.referenceCount = $scope.references.filter(function(ref) {
			return !ref.tags || !ref.tags.length;
		}).length;
	});
	// }}}

	// Reset the active tag if we're coming from another location {{{
	$scope.$on('$locationChangeSuccess', function() {
		if ($scope.tags) {
			$scope.activeTag = _.find($scope.tags, {_id: $location.search()['tag']});
			$scope.refresh();
		}
	});
	// }}}

	// .isOwner / .isEditable {{{
	$scope.isOwner = false;
	$scope.isEditable = false;
	$scope.$watchGroup(['library', 'user'], function() {
		if (!$scope.library || !$scope.library.title || !$scope.user || !$scope.user._id) return; // Not loaded yet
		if (_.indexOf($scope.library.owners, $scope.user._id) >= 0) { // User is already an owner
			$scope.isOwner = true;
			$scope.isEditable = true;
		} else {
			$scope.isOwner = false;
			$scope.isEditable = false;
		}
	});
	// }}}
	// }}}

	// Reference inline edit {{{
	$scope.reference = null;

	$scope.editTags = function(reference) {
		$scope.reference = reference;
		$('#modal-tagEdit').modal('show');
	};

	$scope.toggleTag = function(tag) {
		var index = _.indexOf($scope.reference.tags, tag._id);
		if (index > -1) {
			$scope.reference.tags.splice(index, 1);
		} else {
			$scope.reference.tags.push(tag._id);
		}
	};

	$scope.saveReference = function() {
		References.save({id: $scope.reference._id}, _.pick($scope.reference, ['title', 'tags'])).$promise
			.then($scope.refresh);
	};

	$scope.openFullText = function(reference) {
		if ($scope.isFullTextDownloaded(reference)) {
			$window.open(reference.fullTextURL, '_blank');
		} else if (reference.fullTextURL) { // External link
			$window.open(reference.fullTextURL, '_blank');
		} else { // No link available - throw via OpenURL resolver
			var params = {
				'ctx_enc': 'info:ofi/enc:UTF-8',
				'ctx_id': '10_1',
				'ctx_tim': '2015-06-11T08%3A29%3A09IST',
				'ctx_ver': 'Z39.88-2004',
				'url_ctx_fmt': 'info:ofi/fmt:kev:mtx:ctx',
				'url_ver': 'Z39.88-2004',
				'rft.genre': 'article',
			};

			// Scan over reference fields and populate what we have into the search
			// Standards docs available at http://ocoins.info/cobg.html
			// See docs/alma-openurl-email.txt for reverse engineered splat
			_.forEach({
				title: 'rft.atitle',
				journal: 'rft.jtitle',
				volume: 'rft.volume',
				issue: 'rft.issue',
				issn: 'rft.isbn',
				pages: 'rft.pages',
				edition: 'rft.edition',
				// Unknown: rft.btitle, aulast, auinit, auinit1, auinitm, ausuffix, au, aucorp, date, part, quarter, ssn, pages, artnum, eissn, eisbn, sici, coden, pub, series, stitle, spage, epage
				// Unknown: rft_id, rft.object_id, rft_dat
			}, function(outField, inField) {
				if (reference[inField]) params[outField] = reference[inField];
			});
			$window.open('https://ap01.alma.exlibrisgroup.com/view/uresolver/61BOND_INST/openurl?' + $httpParamSerializer(params), '_blank');
		}
	};

	$scope.isFullTextDownloaded = function(reference) {
		return (/^\/api\/fulltext\//.test(reference.fullTextURL));
	};
	// }}}

	// Load state / Deal with simple operations {{{
	if (!$stateParams.id) {
		$location.path('/libraries');
	} else if ($stateParams.id == 'create') {
		Libraries.create({creator: $scope.user._id}).$promise.then(function(data) {
			$location.path('/libraries/' + data._id);
		});
	} else if ($stateParams.operation == 'delete') {
		Libraries.save({id: $stateParams.id}, {status: 'deleted'}).$promise.then(function() {
			$location.path('/libraries');
		});
	} else if ($stateParams.operation == 'clear') {
		Libraries.clear({id: $stateParams.id}).$promise.then(function(data) {
			$location.path('/libraries/' + data._id);
		});
	} else if ($stateParams.operation == 'fulltext') {
		Tasks.fromLibrary({id: $stateParams.id, worker: 'dummy'}).$promise.then(function(data) {
			$location.path('/libraries/task/' + data._id);
		});
	} else if ($stateParams.operation == 'dummy') {
		Tasks.fromLibrary({id: $stateParams.id, worker: 'dummy'}).$promise.then(function(data) {
			$location.path('/libraries/task/' + data._id);
		});
	} else {
		$scope.library = {_id: $stateParams.id};
		$scope.refresh();
	}

	if ($location.search()['sort']) $scope.setSort($location.search()['sort']);
	// }}}
});
