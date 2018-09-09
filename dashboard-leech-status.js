// ==UserScript==
// @name          WaniKani Dashboard SRS and Leech Breakdown
// @namespace     https://www.wanikani.com
// @description   Show SRS and leech breakdown on dashboard
// @author        seanblue
// @version       0.9.0
// @include       https://www.wanikani.com/dashboard
// @include       https://www.wanikani.com/
// @grant         none
// ==/UserScript==

(function() {
    'use strict';

	if (!window.wkof) {
		let response = confirm('WaniKani Dashboard SRS and Leech Breakdown script requires WaniKani Open Framework.\n Click "OK" to be forwarded to installation instructions.');

		if (response) {
			window.location.href = 'https://community.wanikani.com/t/instructions-installing-wanikani-open-framework/28549';
		}

		return;
	}

     let style =
		`<style>
.srs-inner-progress {
	position: relative;
	color: #fff;
}
.srs-progress .srs-inner-progress span.srs-inner-progress-count {
    display: inline;
    font-size: 15px;
    font-weight: initial;
    text-shadow: initial;
}
.dashboard section.srs-progress span {
    margin-bottom: 4px;
}
.dashboard section.srs-progress .srs-inner-progress .leech-count .leech-breakdown {
    background-color: black;
    font-size: 0.8em;
    font-weight: 100;
    opacity: 0.75;
    display: none;
}
.dashboard section.srs-progress .srs-inner-progress .leech-count {
    background-color: black;
    position: absolute;
    right: -1.0em;
    bottom: -2.5em;
    padding-left: 0.3em;
    padding-right: 0.3em;
    font-size: 1em;
    opacity: 0.25;
    font-weight: 100;
}
.dashboard section.srs-progress .srs-inner-progress .leech-count a {
    color: white;
}
.dashboard section.srs-progress li:hover .srs-inner-progress .leech-count {
    opacity: 1.0;
}
.dashboard section.srs-progress li:hover .srs-inner-progress .leech-count .leech-breakdown {
    display: inline;
}
</style>`

	$('head').append(style);

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
		displayDetailedSection(itemsBySrs, 'apprentice', [1, 2, 3, 4]);
		displayDetailedSection(itemsBySrs, 'guru', [5, 6]);
		displaySimpleSection(itemsBySrs, 'master', 7);
		displaySimpleSection(itemsBySrs, 'enlightened', 8);
		displayEmptySection('burned');
	}

	function displayDetailedSection(itemsBySrs, srsSectionId, srsLevelsArray) {
		addFilledTotalBreakdownSection(srsSectionId, itemsBySrs, srsLevelsArray);
		addDetailedLeechSection(srsSectionId, itemsBySrs, srsLevelsArray);
	}

	function displaySimpleSection(itemsBySrs, srsSectionId, srsLevel) {
		addEmptyTotalBreakdownSection(srsSectionId);
		addSimpleLeechSection(srsSectionId, itemsBySrs, srsLevel);
	}

	function displayEmptySection(srsSectionId) {
		addEmptyTotalBreakdownSection(srsSectionId);
	}

	function addFilledTotalBreakdownSection(srsSectionId, itemsBySrs, srsLevelsArray) {
		let totals = srsLevelsArray.map(srs => itemsBySrs[srs].total).join('&nbsp;/&nbsp;');
		addTotalBreakdownSection(srsSectionId, `${totals}`);
	}

	function addEmptyTotalBreakdownSection(srsSectionId) {
		addTotalBreakdownSection(srsSectionId, '&nbsp;');
	}

	function addTotalBreakdownSection(srsSectionId, sectionContent) {
		let section = $(`<div class="srs-inner-progress">${sectionContent}</div>`);
		$(`#${srsSectionId} span`).after(section);
	}

	function addDetailedLeechSection(srsSectionId, itemsBySrs, srsLevelsArray) {
		let leechArray = srsLevelsArray.map(srsLevel => itemsBySrs[srsLevel].leech);
		let leechBreakdown = leechArray.join('&nbsp;/&nbsp;');
		let leechTotal = leechArray.reduce((total, val) => total + val, 0);

		let sectionContent = `<span class="leech-breakdown">(${leechBreakdown})&nbsp;</span>${leechTotal}`;

		addLeechSection(srsSectionId, sectionContent);
	}

	function addSimpleLeechSection(srsSectionId, itemsBySrs, srsLevel) {
		addLeechSection(srsSectionId, `${itemsBySrs[srsLevel].leech}`);
	}

	function addLeechSection(srsSectionId, sectionContent) {
		let section = `<span class="leech-count">${sectionContent}</span>`;

		$(`#${srsSectionId} .srs-inner-progress`).append(section);
	}
})();