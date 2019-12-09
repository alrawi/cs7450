/* Formatting function for row details - modify as you need */
var table;
var curr_uni, curr_area;

$(document).ready(function () {
	$(".nav .nav-link").on("click", function () {
		$(".nav").find(".active").removeClass("active");
		$(this).addClass("active");
	})

	var list = document.getElementById("uni_select");
	$('#datatable').hide();
	author_list_file = '../data/author_gsid_mapping.csv'
	d3.csv(author_list_file, function (error, author_list) {
		uni_list = [];
		author_list.forEach(function (author) {
			uni_list.push(author['university']);
		});
		uni_list = Array.from(new Set(uni_list)).sort();

		uni_list.forEach(function (uni, ix) {
			var button = document.createElement("button");
			button.className = 'dropdown-item';
			button.href = "#";
			button.value = uni;
			button.style.width = '300px'
			button.addEventListener('click', function () {
				$('#uni_button').text(uni);
				curr_uni = uni;
				// fac_viz();
			});
			var text = document.createTextNode(uni);
			button.appendChild(text);
			list.appendChild(button);
		});
	});

	$("#uniSearchInput").on("keyup", function () {
		var value = $(this).val().toLowerCase();
		$(".dropdown-menu button").filter(function () {
			$(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
		});
	});

	author_interests_file = '../data/author_interest.json'
	d3.json(author_interests_file, function (error, author_interests) {
		var list = document.getElementById("area_select");
		area_list = [];
		for (var gsid of Object.keys(author_interests)) {
			area_list.push(...author_interests[gsid]);
		}
		area_list = Array.from(new Set(area_list));

		area_list.forEach(function (area) {
			var button = document.createElement("button");
			button.className = 'dropdown-item';
			button.href = "#";
			button.value = area;
			button.style.width = '300px'
			button.addEventListener('click', function () {
				$('#area_button').text(area);
				curr_area = area;
			});
			var text = document.createTextNode(area);
			button.appendChild(text);
			list.appendChild(button);
		});

		$("#areaSearchInput").on("keyup", function () {
			var value = $(this).val().toLowerCase();
			$(".dropdown-menu button").filter(function () {
				$(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
			});
		});

	});

});

function show_fac_options() {
	$("#faculty_view").show();
	$("#faculty_view_control_panel").show();
	$("#main").hide();
}

function clear_selection() {
	$('#uni_button').text('University');
	$('#area_button').text('Area');
	curr_uni = null;
	curr_area = null;
}
function format(d) {
	// `d` is the original data object for the row

	return '<div class="slider"><table class=".table" cellspacing="0" border="0" style="text-align:center;width:100%;">' +
		'<thead><tr>' +
		'<th></th>' +
		'<th>Representative Work</th>' +
		// '<th>Research Areas</th>' +
		'<th>Publication History <br/>(Last 5 years)</th>' +
		'<th>Collaborators</th>' +
		'</tr></thead>' +
		'<tr>' +
		'<td><img src="https://scholar.google.com/citations?view_op=medium_photo&user=' + d[0] + '" style="height:150px;"></img>' +
		'<br/><a href="https://scholar.google.com/citations?user=' + d[0] + '"><u>Google Scholar</u></a></td>' +
		'<td style="height:300px;text-align:center;" id="researchWC' + d[0] + '"></td>' +
		// '<td id="researchPie' + d.id + '"></td>' +
		'<td style="text-align:center;" id="citationGraph' + d[0] + '"></td>' +
		'<td><svg id="netviz' + d[0] + '" width="300px" height="300px"></svg></td>' +
		'</tr>' +
		'</table></div>';

}

function build_stacked_bar(ID, filtered_pubs_list, pub_details, author_details, pubid2area) {

	var curr_pub_details = filtered_pubs_list.map(function (pub) {
		details = pub_details[pub['pubid']];
		if (parseInt(pub['pubid']) in pubid2area) {
			details['area'] = pubid2area[pub['pubid']]
		} else {
			details['area'] = 'Other';
		}
		return details;
	});

	var margin = { top: 20, right: 200, bottom: 20, left: 20 };

	// var width = 960 - margin.left - margin.right,
	// 	height = 500 - margin.top - margin.bottom;
	var width = 500 - margin.left - margin.right;
	var height = 200 - margin.top - margin.bottom;

	// debugger;
	var svg = d3.select('#citationGraph' + ID)
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.style("margin-left", "50px")
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	/* Data in strings like it would be if imported from a csv */
	var actual_areas = curr_pub_details.map(function (pub) {
		if (pub['bib']['year'] >= 2015) {
			// return pub['area'];
		if (!('journal' in pub['bib']) || (pub['bib']['journal'] == "") || !('bib' in pub) || (pub['bib']['journal'] == undefined)) {
			return "Unknown";
		}
		else { return pub['bib']['journal']; }
		}
	});
	var actual_areas = actual_areas.filter(function (el) {
		return el != null;
	});
	var colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']
	area2color = {}
	actual_areas = Array.from(new Set(actual_areas));
	for (var i = 0; i < actual_areas.length; i++) {
		area2color[actual_areas[i]] = colors[i];
	}

	areas = ['all']
	year2toppubcount = {}
	curr_pub_details.forEach(function (pub) {
		if (pub['bib']['year'] >= 2015) {
			if (pub['bib']['year'] in year2toppubcount) { year2toppubcount[pub['bib']['year']] += 1 }
			else { year2toppubcount[pub['bib']['year']] = 1 }
		}
	});
	year_count = {};
	["2015", "2016", "2017", "2018", "2019"].forEach(function (year) {
		if (year in author_details[ID]['cites_per_year']) {
			year_count[year] = author_details[ID]['cites_per_year'][year];
		}
	});
	console.log(year_count);

	data = [];
	["2015", "2016", "2017", "2018", "2019"].forEach(function (year) {
		row = { "year": year }
		areas.forEach(function (area) {
			row[area] = year_count[year];
		});
		data.push(row);
	});

	var parse = d3.time.format("%Y").parse;

	// Transpose the data into layers
	var dataset = d3.layout.stack()(areas.map(function (area) {
		return data.map(function (d) {
			return { x: parse(d.year), y: +d[area] };
		});
	}));

	// Set x, y and colors
	var x = d3.scale.ordinal()
		.domain(dataset[0].map(function (d) { return d.x; }))
		.rangeRoundBands([10, width - 10], 0.02);

	var y = d3.scale.linear()
		.domain([0, d3.max(dataset, function (d) { return d3.max(d, function (d) { return d.y0 + d.y; }); })])
		.range([height, 0]);


	// Define and draw axes
	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(5)
		.tickSize(-width, 0, 0)
		.tickFormat(function (d) { return d });

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickFormat(d3.time.format("%Y"));

	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(30, 0)")
		.call(yAxis);

	var OFFSET = 20;
	svg.append("text")
		.attr("transform", "rotate(-90) translate(-20, -3)")
		.attr("y", 0 - margin.left)
		.attr("x", 0 - (height / 2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Citations");

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(" + OFFSET + "," + height + ")")
		.call(xAxis);

	// Create groups for each series, rects for each segment 
	var groups = svg.selectAll("g.cost")
		.data(dataset)
		.enter().append("g")
		.attr("class", "cost")
		.attr('transform', 'translate(0, 0)')
		.style("fill", function (d, i) { return 'white'; })
		.attr("stroke", "black")
		.attr("stroke-width", 1);

	var rect = groups.selectAll("rect")
		.data(function (d) { return d; })
		.enter()
		.append("rect")
		.attr("x", function (d) { return OFFSET + x(d.x); })
		.attr("y", function (d) { return y(d.y0 + d.y); })
		.attr("height", function (d) { return y(d.y0) - y(d.y0 + d.y); })
		.attr("width", x.rangeBand());
	debugger;
	// Draw legend
	var legend = svg.selectAll(".legend")
		.data(colors.slice(0, actual_areas.length))
		.enter().append("g")
		.attr("class", "legend")
		.attr("transform", function (d, i) { return "translate(30," + i * 19 + ")"; });

	legend.append("rect")
		.attr("x", width - 18)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", function (d, i) { return colors.slice()[i]; });

	legend.append("text")
		.attr("x", width + 5)
		.attr("y", 9)
		.attr("font-size","10px")
		.attr("dy", ".2em")
		.style("text-anchor", "start")
		.text(function (d, i) {
			return actual_areas[i];
		});


	// Prep the tooltip bits, initial display is hidden
	var tooltip = d3.tip()
		.attr("class", "d3-tip")
		.offset([0, -20])
		.html(function (d) {
			if (d.journal == undefined) { journal = 'Unknown'; }
			else { journal = d.journal; }
			return "<div style='padding:5px;max-width:300px;font-size:10pt;text-align:left;'><h6><a href=" + d.url + ">" + d.title + "</a></h6>" +
				"<table><tbody><tr><td><strong>Authors</strong></td><td>" + d.author + "</td></tr>" +
				"<tr><td><strong>Journal</strong></td><td>" + journal + "</td></tr>" +
				"<tr><td><strong>Year</strong></td><td>" + d.year + "</td></tr>" +
				"<tr><td><strong>Citations</strong></td></thead><td>" + d.citedby + "</td></tr></tbody></table></div>"
		})
		.style("background-color", "#f8f9fa")
		.style("text-align", "center")
		.style("box-sizing", "border-box");

	// Add the points!	
	points = []
	// debugger;
	year2toppubcount_copy = { ...year2toppubcount }
	curr_pub_details.forEach(function (pub) {
		if (pub['bib']['year'] >= 2015) {
			total_points = year2toppubcount_copy[pub['bib']['year']]
			max_y = year_count[pub['bib']['year']]
			points_left = year2toppubcount[pub['bib']['year']]
			// x_pos = OFFSET + 20 + (60 * (parseInt(pub['bib']['year']) - 2015)) + Math.floor(50*Math.random());
			x_pos = OFFSET + 40 + (50 * (parseInt(pub['bib']['year']) - 2015));
			y_pos = parseInt(y(Math.floor(max_y / total_points) * points_left)) + 10;
			// debugger;
			year2toppubcount[pub['bib']['year']] -= 1

			curr_point = { x: x_pos, y: y_pos };
			curr_point['title'] = pub['bib']['title'];
			curr_point['author'] = pub['bib']['author'];
			curr_point['journal'] = pub['bib']['journal'];
			curr_point['year'] = pub['bib']['year'];
			curr_point['citedby'] = pub['citedby'];
			curr_point['area'] = pub['area'];
			curr_point['url'] = pub['bib']['url'];
			points.push(curr_point);
		}
	});
	svg.call(tooltip);

	var clickFlag = false;
	svg.selectAll(".point")
		.data(points)
		.enter().append("path")
		.attr("class", "point")
		// .append('text')
		// .attr('font-family', 'FontAwesome')
		// .attr('font-size', function(d) { return d.size+'em'} )
		// .text(function(d) { return '\uf70e' })
		.attr("d", d3.svg.symbol().type("triangle-up").size(100))
		.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
		.style("fill", function (d, i) {
			if (!(d.journal in area2color)) {
				return area2color['Unknown']
			} else {
				return area2color[d.journal];
			}
		})
		.on('click', function (d) {
			if (clickFlag) {
				tooltip.hide(d, this);
			} else {
				tooltip.show(d, this);
			}
			return clickFlag = !clickFlag;
		})
	// });
}

function fac_viz() {

	if ($.fn.DataTable.isDataTable('#datatable')) {
		table.destroy();
		$("#datatable tbody").remove();
	}
	$("#spinner").show();
	$("#faculty").show();

	author_list_file = '../data/author_gsid_mapping.csv'
	author_details_file = '../data/all_author_info.json'
	pub_details_file = '../data/all_pub_info.json'
	pubid_to_area_file = '../data/pubid_area.json'
	d3.csv('../data/top_pub_author_mapping.csv', function (error, auth2pub_mapping) {
		d3.csv(author_list_file, function (error, author_list) {
			d3.json(author_details_file, function (error, author_details) {
				d3.json(pub_details_file, function (error, pub_details) {
					d3.json(pubid_to_area_file, function (error, pubid2area) {
						$('#datatable').show();
						$("#spinner").hide();
						var filtered_author_list = author_list;
						if (curr_uni != null || curr_area != null) {

							if (curr_uni != null) {
								filtered_author_list = filtered_author_list.filter(function (datum, i) {
									if (datum['university'] == curr_uni) { return datum; }
								});
							}
							// debugger;
							if (curr_area != null) {
								filtered_author_list = filtered_author_list.filter(function (datum, i) {
									author = author_details[datum['gsid']];
									if (author != null) {
										interests = author['interests'];
										interests = interests.map(function (x) { return x.toLowerCase() })
										if (interests.includes(curr_area)) { return datum; }
									}
								});
							}
						}

						var filtered_author_list_reformat = []
						filtered_author_list.forEach(function (row) {
							curr_author_details = author_details[row['gsid']]
							entry = [row['gsid'], row['name'], curr_author_details['affiliation'], curr_author_details['interests'], curr_author_details['citedby'], curr_author_details['hindex']]
							filtered_author_list_reformat.push(entry)
						});

						table = $('#datatable').DataTable({
							data: filtered_author_list_reformat,
							"columns": [
								{
									"className": 'details-control',
									"orderable": false,
									"data": null,
									"defaultContent": ''
								},
								{ "title": "Name" },
								{ "title": "Affiliation" },
								{ "title": "Interests" },
								{ "title": "Cited By" },
								{ "title": "H-Index" }
							],
							"order": [[1, 'asc']]
						});

						// Add event listener for opening and closing details
						$('#datatable tbody').on('click', 'td.details-control', function () {
							var tr = $(this).closest('tr');
							var row = table.row(tr);
							if (row.child.isShown()) {

								$('div.slider', row.child()).slideUp(function () {
									row.child.hide();
									tr.removeClass('shown');
								});

							}
							else {
								// Open this row
								row.child(format(row.data()), 'no-padding').show();
								tr.addClass('shown');

								$('div.slider', row.child()).slideDown();

								rowData = row.data()

								var filtered_pubs_list = auth2pub_mapping.filter(function (datum, i) {
									if (datum['gsid'] == rowData[0]) {
										return datum['pubid'];
									}
								});

								abstract_concat = ""
								filtered_pubs_list.forEach(function (pub) {
									abstract_concat = abstract_concat + pub_details[pub['pubid']]['bib']['abstract']
								});

								build_stacked_bar(rowData[0], filtered_pubs_list, pub_details, author_details, pubid2area)
								drawWordCloud(abstract_concat, rowData);
								network_viz(rowData, auth2pub_mapping, author_details, pub_details);
							}
						});

						function drawWordCloud(text_string, rowData) {
							var common = ["a", "about", "above", "after", "again", "against", "ain", "all", "am", "an", "and", "any", "are", "aren", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "couldn", "couldn't", "d", "did", "didn", "didn't", "do", "does", "doesn", "doesn't", "doing", "don", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn", "hadn't", "has", "hasn", "hasn't", "have", "haven", "haven't", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn", "isn't", "it", "it's", "its", "itself", "just", "ll", "m", "ma", "me", "mightn", "mightn't", "more", "most", "mustn", "mustn't", "my", "myself", "needn", "needn't", "no", "nor", "not", "now", "o", "of", "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "re", "s", "same", "shan", "shan't", "she", "she's", "should", "should've", "shouldn", "shouldn't", "so", "some", "such", "t", "than", "that", "that'll", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "ve", "very", "was", "wasn", "wasn't", "we", "were", "weren", "weren't", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "won", "won't", "wouldn", "wouldn't", "y", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "could", "he'd", "he'll", "he's", "here's", "how's", "i'd", "i'll", "i'm", "i've", "let's", "ought", "she'd", "she'll", "that's", "there's", "they'd", "they'll", "they're", "they've", "we'd", "we'll", "we're", "we've", "what's", "when's", "where's", "who's", "why's", "would", "able", "abst", "accordance", "according", "accordingly", "across", "act", "actually", "added", "adj", "affected", "affecting", "affects", "afterwards", "ah", "almost", "alone", "along", "already", "also", "although", "always", "among", "amongst", "announce", "another", "anybody", "anyhow", "anymore", "anyone", "anything", "anyway", "anyways", "anywhere", "apparently", "approximately", "arent", "arise", "around", "aside", "ask", "asking", "auth", "available", "away", "awfully", "b", "back", "became", "become", "becomes", "becoming", "beforehand", "begin", "beginning", "beginnings", "begins", "behind", "believe", "beside", "besides", "beyond", "biol", "brief", "briefly", "c", "ca", "came", "cannot", "can't", "cause", "causes", "certain", "certainly", "co", "com", "come", "comes", "contain", "containing", "contains", "couldnt", "date", "different", "done", "downwards", "due", "e", "ed", "edu", "effect", "eg", "eight", "eighty", "either", "else", "elsewhere", "end", "ending", "enough", "especially", "et", "etc", "even", "ever", "every", "everybody", "everyone", "everything", "everywhere", "ex", "except", "f", "far", "ff", "fifth", "first", "five", "fix", "followed", "following", "follows", "former", "formerly", "forth", "found", "four", "furthermore", "g", "gave", "get", "gets", "getting", "give", "given", "gives", "giving", "go", "goes", "gone", "got", "gotten", "h", "happens", "hardly", "hed", "hence", "hereafter", "hereby", "herein", "heres", "hereupon", "hes", "hi", "hid", "hither", "home", "howbeit", "however", "hundred", "id", "ie", "im", "immediate", "immediately", "importance", "important", "inc", "indeed", "index", "information", "instead", "invention", "inward", "itd", "it'll", "j", "k", "keep", "keeps", "kept", "kg", "km", "know", "known", "knows", "l", "largely", "last", "lately", "later", "latter", "latterly", "least", "less", "lest", "let", "lets", "like", "liked", "likely", "line", "little", "'ll", "look", "looking", "looks", "ltd", "made", "mainly", "make", "makes", "many", "may", "maybe", "mean", "means", "meantime", "meanwhile", "merely", "mg", "might", "million", "miss", "ml", "moreover", "mostly", "mr", "mrs", "much", "mug", "must", "n", "na", "name", "namely", "nay", "nd", "near", "nearly", "necessarily", "necessary", "need", "needs", "neither", "never", "nevertheless", "new", "next", "nine", "ninety", "nobody", "non", "none", "nonetheless", "noone", "normally", "nos", "noted", "nothing", "nowhere", "obtain", "obtained", "obviously", "often", "oh", "ok", "okay", "old", "omitted", "one", "ones", "onto", "ord", "others", "otherwise", "outside", "overall", "owing", "p", "page", "pages", "part", "particular", "particularly", "past", "per", "perhaps", "placed", "please", "plus", "poorly", "possible", "possibly", "potentially", "pp", "predominantly", "present", "previously", "primarily", "probably", "promptly", "proud", "provides", "put", "q", "que", "quickly", "quite", "qv", "r", "ran", "rather", "rd", "readily", "really", "recent", "recently", "ref", "refs", "regarding", "regardless", "regards", "related", "relatively", "research", "respectively", "resulted", "resulting", "results", "right", "run", "said", "saw", "say", "saying", "says", "sec", "section", "see", "seeing", "seem", "seemed", "seeming", "seems", "seen", "self", "selves", "sent", "seven", "several", "shall", "shed", "shes", "show", "showed", "shown", "showns", "shows", "significant", "significantly", "similar", "similarly", "since", "six", "slightly", "somebody", "somehow", "someone", "somethan", "something", "sometime", "sometimes", "somewhat", "somewhere", "soon", "sorry", "specifically", "specified", "specify", "specifying", "still", "stop", "strongly", "sub", "substantially", "successfully", "sufficiently", "suggest", "sup", "sure", "take", "taken", "taking", "tell", "tends", "th", "thank", "thanks", "thanx", "thats", "that've", "thence", "thereafter", "thereby", "thered", "therefore", "therein", "there'll", "thereof", "therere", "theres", "thereto", "thereupon", "there've", "theyd", "theyre", "think", "thou", "though", "thoughh", "thousand", "throug", "throughout", "thru", "thus", "til", "tip", "together", "took", "toward", "towards", "tried", "tries", "truly", "try", "trying", "ts", "twice", "two", "u", "un", "unfortunately", "unless", "unlike", "unlikely", "unto", "upon", "ups", "us", "use", "used", "useful", "usefully", "usefulness", "uses", "using", "usually", "v", "value", "various", "'ve", "via", "viz", "vol", "vols", "vs", "w", "want", "wants", "wasnt", "way", "wed", "welcome", "went", "werent", "whatever", "what'll", "whats", "whence", "whenever", "whereafter", "whereas", "whereby", "wherein", "wheres", "whereupon", "wherever", "whether", "whim", "whither", "whod", "whoever", "whole", "who'll", "whomever", "whos", "whose", "widely", "willing", "wish", "within", "without", "wont", "words", "world", "wouldnt", "www", "x", "yes", "yet", "youd", "youre", "z", "zero", "a's", "ain't", "allow", "allows", "apart", "appear", "appreciate", "appropriate", "associated", "best", "better", "c'mon", "c's", "cant", "changes", "clearly", "concerning", "consequently", "consider", "considering", "corresponding", "course", "currently", "definitely", "described", "despite", "entirely", "exactly", "example", "going", "greetings", "hello", "help", "hopefully", "ignored", "inasmuch", "indicate", "indicated", "indicates", "inner", "insofar", "it'd", "keep", "keeps", "novel", "presumably", "reasonably", "second", "secondly", "sensible", "serious", "seriously", "sure", "t's", "third", "thorough", "thoroughly", "three", "well", "wonder", "a", "about", "above", "above", "across", "after", "afterwards", "again", "against", "all", "almost", "alone", "along", "already", "also", "although", "always", "am", "among", "amongst", "amoungst", "amount", "an", "and", "another", "any", "anyhow", "anyone", "anything", "anyway", "anywhere", "are", "around", "as", "at", "back", "be", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "behind", "being", "below", "beside", "besides", "between", "beyond", "bill", "both", "bottom", "but", "by", "call", "can", "cannot", "cant", "co", "con", "could", "couldnt", "cry", "de", "describe", "detail", "do", "done", "down", "due", "during", "each", "eg", "eight", "either", "eleven", "else", "elsewhere", "empty", "enough", "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except", "few", "fifteen", "fify", "fill", "find", "fire", "first", "five", "for", "former", "formerly", "forty", "found", "four", "from", "front", "full", "further", "get", "give", "go", "had", "has", "hasnt", "have", "he", "hence", "her", "here", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how", "however", "hundred", "ie", "if", "in", "inc", "indeed", "interest", "into", "is", "it", "its", "itself", "keep", "last", "latter", "latterly", "least", "less", "ltd", "made", "many", "may", "me", "meanwhile", "might", "mill", "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my", "myself", "name", "namely", "neither", "never", "nevertheless", "next", "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or", "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own", "part", "per", "perhaps", "please", "put", "rather", "re", "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several", "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so", "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere", "still", "such", "system", "take", "ten", "than", "that", "the", "their", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore", "therein", "thereupon", "these", "they", "thickv", "thin", "third", "this", "those", "though", "three", "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward", "towards", "twelve", "twenty", "two", "un", "under", "until", "up", "upon", "us", "very", "via", "was", "we", "well", "were", "what", "whatever", "when", "whence", "whenever", "where", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", "which", "while", "whither", "who", "whoever", "whole", "whom", "whose", "why", "will", "with", "within", "without", "would", "yet", "you", "your", "yours", "yourself", "yourselves", "the", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "co", "op", "research-articl", "pagecount", "cit", "ibid", "les", "le", "au", "que", "est", "pas", "vol", "el", "los", "pp", "u201d", "well-b", "http", "volumtype", "par", "0o", "0s", "3a", "3b", "3d", "6b", "6o", "a1", "a2", "a3", "a4", "ab", "ac", "ad", "ae", "af", "ag", "aj", "al", "an", "ao", "ap", "ar", "av", "aw", "ax", "ay", "az", "b1", "b2", "b3", "ba", "bc", "bd", "be", "bi", "bj", "bk", "bl", "bn", "bp", "br", "bs", "bt", "bu", "bx", "c1", "c2", "c3", "cc", "cd", "ce", "cf", "cg", "ch", "ci", "cj", "cl", "cm", "cn", "cp", "cq", "cr", "cs", "ct", "cu", "cv", "cx", "cy", "cz", "d2", "da", "dc", "dd", "de", "df", "di", "dj", "dk", "dl", "do", "dp", "dr", "ds", "dt", "du", "dx", "dy", "e2", "e3", "ea", "ec", "ed", "ee", "ef", "ei", "ej", "el", "em", "en", "eo", "ep", "eq", "er", "es", "et", "eu", "ev", "ex", "ey", "f2", "fa", "fc", "ff", "fi", "fj", "fl", "fn", "fo", "fr", "fs", "ft", "fu", "fy", "ga", "ge", "gi", "gj", "gl", "go", "gr", "gs", "gy", "h2", "h3", "hh", "hi", "hj", "ho", "hr", "hs", "hu", "hy", "i", "i2", "i3", "i4", "i6", "i7", "i8", "ia", "ib", "ic", "ie", "ig", "ih", "ii", "ij", "il", "in", "io", "ip", "iq", "ir", "iv", "ix", "iy", "iz", "jj", "jr", "js", "jt", "ju", "ke", "kg", "kj", "km", "ko", "l2", "la", "lb", "lc", "lf", "lj", "ln", "lo", "lr", "ls", "lt", "m2", "ml", "mn", "mo", "ms", "mt", "mu", "n2", "nc", "nd", "ne", "ng", "ni", "nj", "nl", "nn", "nr", "ns", "nt", "ny", "oa", "ob", "oc", "od", "of", "og", "oi", "oj", "ol", "om", "on", "oo", "oq", "or", "os", "ot", "ou", "ow", "ox", "oz", "p1", "p2", "p3", "pc", "pd", "pe", "pf", "ph", "pi", "pj", "pk", "pl", "pm", "pn", "po", "pq", "pr", "ps", "pt", "pu", "py", "qj", "qu", "r2", "ra", "rc", "rd", "rf", "rh", "ri", "rj", "rl", "rm", "rn", "ro", "rq", "rr", "rs", "rt", "ru", "rv", "ry", "s2", "sa", "sc", "sd", "se", "sf", "si", "sj", "sl", "sm", "sn", "sp", "sq", "sr", "ss", "st", "sy", "sz", "t1", "t2", "t3", "tb", "tc", "td", "te", "tf", "th", "ti", "tj", "tl", "tm", "tn", "tp", "tq", "tr", "ts", "tt", "tv", "tx", "ue", "ui", "uj", "uk", "um", "un", "uo", "ur", "ut", "va", "wa", "vd", "wi", "vj", "vo", "wo", "vq", "vt", "vu", "x1", "x2", "x3", "xf", "xi", "xj", "xk", "xl", "xn", "xo", "xs", "xt", "xv", "xx", "y2", "yj", "yl", "yr", "ys", "yt", "zi", "zz"]

							var word_count = {};

							var words = text_string.split(/[ '\-\(\)\*":;\[\]|{},.!?]+/);
							if (words.length == 1) {
								word_count[words[0]] = 1;
							} else {
								words.forEach(function (word) {
									var word = word.toLowerCase();
									if (word != "" && common.indexOf(word) == -1 && word.length > 1 && isNaN(word)) {
										if (word_count[word]) {
											word_count[word]++;
										} else {
											word_count[word] = 1;
										}
									}
								})
							}

							var svg_location = "#researchWC" + rowData[0];
							var width = 250;
							var height = 250;

							var fill = d3.schemeCategory20;

							var word_entries = d3.entries(word_count);

							var xScale = d3.scale.linear()
								.domain([0, d3.max(word_entries, function (d) {
									return d.value;
								})
								])
								.range([10, 100]);

							d3.layout.cloud().size([width, height])
								.timeInterval(20)
								.words(word_entries)
								.fontSize(function (d) { return xScale(+d.value); })
								.text(function (d) { return d.key; })
								.rotate(function () { return ~~(Math.random() * 2) * 90; })
								.font("Impact")
								.on("end", draw)
								.start();

							function draw(words) {
								d3.select(svg_location).append("svg")
									.attr("width", width)
									.attr("height", height)
									.append("g")
									.attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
									.selectAll("text")
									.data(words)
									.enter().append("text")
									.style("font-size", function (d) { return xScale(d.value) + "px"; })
									.style("font-family", "Impact")
									.style("fill", function (d, i) { return i; })
									.attr("text-anchor", "middle")
									.attr("transform", function (d) {
										return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
									})
									.text(function (d) { return d.key; });
							}

							d3.layout.cloud().stop();
						}
					});
				});
			});
		});
	});
}





