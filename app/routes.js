app.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider
		.otherwise('/');

	$stateProvider
		// General pages {{{
		.state('home', {
			url: '/',
			views: {main: {templateUrl: '/partials/dashboard.html'}},
			data: {
				title: 'Dashboard',
			}
		})
		// User management {{{
		.state('login', {
			url: '/login',
			views: {main: {templateUrl: '/partials/users/login.html'}},
			data: {
				title: 'Login',
			}
		})
		.state('logout', {
			url: '/logout',
			views: {main: {templateUrl: '/partials/users/logout.html'}},
			data: {
				title: 'Logout',
			}
		})
		.state('signup', {
			url: '/signup',
			views: {main: {templateUrl: '/partials/users/signup.html'}},
			data: {
				title: 'Signup',
			}
		})
		.state('profile', {
			url: '/profile',
			views: {main: {templateUrl: '/partials/users/profile.html'}},
			data: {
				title: 'Your Profile',
			}
		})
		// }}}
		.state('search', {
			url: '/search',
			views: {main: {templateUrl: '/partials/search/search.html'}},
			data: {
				title: 'Search',
			}
		})
		.state('polyglot', {
			url: '/polyglot',
			views: {main: {templateUrl: '/partials/search/polyglot.html'}},
			data: {
				title: 'Polyglot Search',
			}
		})
		.state('debug', {
			url: '/debug',
			views: {main: {templateUrl: '/partials/debug.html'}},
			data: {
				title: 'Debug testing area',
			}
		})
		// }}}
		// Library (collective) {{{
		.state('libraries', {
			url: '/libraries',
			views: {main: {templateUrl: '/partials/libraries/list.html'}},
			data: {
				title: 'Libraries',
			}
		})
		.state('libraries-import', {
			url: '/libraries/{operation:import}',
			views: {main: {templateUrl: '/partials/libraries/import.html'}},
			data: {
				title: 'Import',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-task-status', {
			url: '/libraries/task/:id',
			views: {main: {templateUrl: '/partials/libraries/taskStatus.html'}},
			data: {
				title: 'Performing operation',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('libraries-operation', {
			url: '/libraries/{operation:copy|export|dedupe|screen|compare|tags|share|request|collabmatrix|clear|delete|fulltext}',
			views: {main: {templateUrl: '/partials/libraries/operation.html'}},
			data: {
				title: 'Perform operation',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		// }}}
		// Library (specific) {{{
		.state('library-operation', {
			url: '/libraries/:id/{operation:delete|clear|fulltext|dummy}',
			views: {main: {templateUrl: '/partials/libraries/wait.html'}},
			data: {
				title: 'Performing operation',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-copy', {
			url: '/libraries/:id/{operation:copy}',
			views: {main: {templateUrl: '/partials/libraries/copy.html'}},
			data: {
				title: 'Copy',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-import', {
			url: '/libraries/:id/{operation:import}',
			views: {main: {templateUrl: '/partials/libraries/import.html'}},
			data: {
				title: 'Import',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-export', {
			url: '/libraries/:id/{operation:export}',
			views: {main: {templateUrl: '/partials/libraries/export.html'}},
			data: {
				title: 'Export',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-dedupe', {
			url: '/libraries/:id/{operation:dedupe}',
			views: {main: {templateUrl: '/partials/fixme.html'}},
			data: {
				title: 'Deduplicate',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-share', {
			url: '/libraries/:id/{operation:share}',
			views: {main: {templateUrl: '/partials/libraries/share.html'}},
			data: {
				title: 'Share',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-screen', {
			url: '/libraries/:id/{operation:screen}',
			views: {main: {templateUrl: '/partials/libraries/screen.html'}},
			data: {
				title: 'Screen',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-compare', {
			url: '/libraries/:id/{operation:compare}',
			views: {main: {templateUrl: '/partials/libraries/compare.html'}},
			data: {
				title: 'Compare',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-compare-review', {
			url: '/libraries/:id/compare/:taskid',
			views: {main: {templateUrl: '/partials/libraries/compare-review.html'}},
			data: {
				title: 'Comparison Results',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-collabmatrix', {
			url: '/libraries/:id/{operation:collabmatrix}',
			views: {main: {templateUrl: '/partials/fixme.html'}},
			data: {
				title: 'Collaboration Matrix',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-tags', {
			url: '/libraries/:id/{operation:tags}',
			views: {main: {templateUrl: '/partials/libraries/tags.html'}},
			data: {
				title: 'Edit Tags',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-request', {
			url: '/libraries/:id/{operation:request}',
			views: {main: {templateUrl: '/partials/libraries/request.html'}},
			data: {
				title: 'Journal Request',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		.state('library-view', {
			url: '/libraries/:id',
			reloadOnSearch: false,
			views: {main: {templateUrl: '/partials/libraries/view.html'}},
			data: {
				title: 'Library',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		// }}}
		// Reference {{{
		.state('reference-view', {
			url: '/references/:id',
			views: {main: {templateUrl: '/partials/fixme.html'}},
			data: {
				title: 'Reference',
				breadcrumbs: [{url: '/libraries', title: 'Libraries'}]
			}
		})
		// }}}
		// For testing textselect directive {{{
		.state('textselect', {
			url: '/textselect',
			views: {main: {templateUrl: '/partials/textselect/textselect.html'}},
			data: {
				title: 'Text Select'
			}
		})
		// }}}
});
