app.controller('replicantOptionsController', function($scope, $location, $q, $stateParams, Loader, Replicant) {
	$scope.options = {
		grammar: undefined,
	};

	$scope.revman;
	$scope.grammars;

	$scope.refresh = function() {
		if (!$stateParams.id) return $location.path('/replicant');

		Loader
			.title('Retrieving RevMan file...')
			.start();

		$q.all([
			// Load main RevMan comparisons object
			Replicant.comparisons({id: $stateParams.id}).$promise
				.then(function(data) {
					$scope.revman = data.map(function(study, studyIndex) {
						study.selected = studyIndex < 3;
						study.comparisons = study.comparisons.map(function(comparison) {
							comparison.selected = study.selected;
							comparison.subComparisons = comparison.subComparisons.map(function(subComparison) {
								subComparison.selected = false;
								return subComparison;
							});
							return comparison;
						});
						return study;
					});
				}),

			// Load Grammars list
			Replicant.grammars().$promise
				.then(data => $scope.grammars = data)
				.then(() => $scope.options.grammar = $scope.grammars[0].file),
		])
			.finally(() => Loader.finish())
	};

	$scope.submit = function() {
		$scope.options.primary = [];
		$scope.revman.forEach(function(study) {
			if (study.selected) $scope.options.primary.push(study.id);
			study.comparisons.forEach(function(comparison) {
				if (comparison.selected) $scope.options.primary.push(comparison.id);
				comparison.subComparisons.forEach(function(subComparison) {
					if (subComparison.selected) $scope.options.primary.push(subComparison.id);
				});
			});
		});

		console.log($scope.options);
	};

	$scope.$evalAsync($scope.refresh);
});
