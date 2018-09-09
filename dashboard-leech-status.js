// ==UserScript==
// @name          WaniKani Dashboard Leech Status
// @namespace     https://www.wanikani.com
// @description   Show leech status on dashboard
// @author        seanblue
// @version       0.9.0
// @include       https://www.wanikani.com/dashboard
// @include       https://www.wanikani.com/
// @grant         none
// ==/UserScript==

(function() {
    'use strict';

	if (!window.wkof) {
		let response = confirm('WaniKani Dashboard Leech Status script requires WaniKani Open Framework.\n Click "OK" to be forwarded to installation instructions.');

		if (response) {
			window.location.href = 'https://community.wanikani.com/t/instructions-installing-wanikani-open-framework/28549';
		}

		return;
	}

	const leechThreshold = 1;
	const config = {
		wk_items: {
			options: {
				review_statistics: true,
				assignments: true
			}
		}
	};

	wkof.include('ItemData');
	wkof.ready('ItemData').then(getItems).then(mapItemsToSrs).then(updatePage);

	function getItems(items) {
		return wkof.ItemData.get_items(config).then(filterToActiveAssignments);
	}

	function filterToActiveAssignments(items) {
		return items.filter(itemIsActiveAssignment);
	}

	function itemIsActiveAssignment(item) {
		let assignments = item.assignments;
		if (assignments === undefined) {
			return false;
		}

		let srsStage = getSrsStage(assignments);

		return srsStage >= 1 && srsStage <= 8;
	}

	function getSrsStage(assignments) {
		return assignments.srs_stage;
	}

	function mapItemsToSrs(items) {
		let itemsBySrs = [1, 2, 3, 4, 5, 6, 7, 8].reduce((result, srs) => {
			result[srs] = {
				total: 0,
				leech: 0
			};

			return result;
		}, {});

		items.forEach(function(item) {
			let srsStage = getSrsStage(item.assignments);
			itemsBySrs[srsStage].total++;

			if (isLeech(item)) {
				itemsBySrs[srsStage].leech++;
			}
		});

		return itemsBySrs;
	}

	function isLeech(item) {
		if (item.review_statistics === undefined) {
			return false;
		}

		let reviewStats = item.review_statistics;
		let meaningScore = getLeechScore(reviewStats.meaning_incorrect, reviewStats.meaning_current_streak);
		let readingScore = getLeechScore(reviewStats.reading_incorrect, reviewStats.reading_current_streak);

		return meaningScore >= leechThreshold || readingScore >= leechThreshold;
	}

	function getLeechScore(incorrect, currentStreak) {
		return incorrect / Math.pow((currentStreak || 0.5), 1.5);
	}

	function updatePage(itemsBySrs) {

	}

})();