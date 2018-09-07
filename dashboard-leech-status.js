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
		return wkof.ItemData.get_items(config).then(filterItems);
	}

	function filterItems(items) {
		return items.filter(isLeech);
	}

	function isLeech(item) {
		return itemIsActiveAssignment(item) && itemIsOverLeechThreshold(item);
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

	function itemIsOverLeechThreshold(item) {
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

	function mapItemsToSrs(items) {
		let leechesBySrs = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 0,
			7: 0,
			8: 0
		};

		items.forEach(function(item) {
			let srsStage = getSrsStage(item.assignments);
			leechesBySrs[srsStage]++;
		});

		return leechesBySrs;
	}

	function updatePage(items) {

	}

})();