var svg;
// var width = +svg.attr('width');
// var height = +svg.attr('height');
var width = 300;
var height = 150;
var authors_pubid = null; // mapping from author to publications
var pubid_authors = null; // mapping from publication to authors
var gAuth_info = null; // dictionary for all the author's information
var gPub_info = null; // dictionary for all the publication information
var gAuth_pub_univ = null; // global mapping of author publication and university
var auth_univ = {}; // global mapping for author and university
var univ_list = []; // global list of universities

function network_viz(rowData, auth2pub, auth_info, pub_info) {
	
	svg = d3.select('#netviz' + rowData[0]);
	
	d3.select("#net-canvas").append("a")
		.attr("class", "nav-link")
	.attr()
	// all needed data loaded set to global scope
	gAuth_info = auth_info;
	gPub_info = pub_info;
	gAuth_pub_univ = auth2pub;

	
	// initialize author university mapping
	d3.nest()
		.key(function (d) {
			return d.gsid;
		})
		.entries(gAuth_pub_univ)
		.forEach(element => {
			auth_univ[element.key] = element.values[0].university;
		});
	
	// generate a list of all universitites
	d3.nest()
		.key(function (d) {
			return d.university;
		})
		.entries(gAuth_pub_univ)
		.forEach(element => {
			univ_list.push(element.key);
		});

	var test = rowData[0];	
	console.log(univ_list.indexOf(auth_univ[test]))
	console.log(auth_univ[test])
	var authNet = createCoauthorNetwork(test);
	console.log(authNet);
	drawNetwork(authNet)



	function createCoauthorNetwork(gsid)
	{
		var publist = getPubList(gsid);
		console.log(publist);

		var coauthlist = getCoAuthors(gsid);
		console.log(coauthlist);
		
		coauthids = [];
		coauthlist.forEach(element => {
			coauthids.push(element.key)
		});

		var inNet = [];
		coauthlist.forEach(element => { //get coauth ids
			cocoauth = getCoAuthors(element.key)
				.filter(function (d) { 
					return coauthids.includes(d.key);
				});
			var obj = {};
			obj["key"] = element.key;
			obj["value"]=cocoauth;
			inNet.push(obj);
		});
		
		// create network structure
		// add nodes
		var nodes = [];
		var nodeIndex = {};
		var nIdx = 0;
		nodes.push({
			"id": gsid,
			"group": univ_list.indexOf(auth_univ[gsid])
		})
		nodeIndex[gsid] = nIdx;
		nIdx++;
		coauthids.forEach(element => {
			nodes.push({
				"id": element,
				"group": univ_list.indexOf(auth_univ[element])
			});
			nodeIndex[element] = nIdx;
			nIdx++;
		});
		console.log(nodeIndex);

		// add links
		var links = [];
		// add links to primary author
		coauthlist.forEach(element => {
			links.push({
				"source": nodeIndex[gsid],
				"target": nodeIndex[element.key],
				"weight": element.values.length,
				"pubs": element.values
			});
		});
		// add links to in-network authors
		var processed = [];
		inNet.forEach(src => {
			src.value.forEach(trg => {
				if (!processed.includes(trg.key)) {
					links.push({
						"source": nodeIndex[src.key],
						"target": nodeIndex[trg.key],
						"weight": trg.values.length,
						"pubs": trg.values
					});
				}
			});
			processed.push(src.key);
		});
		return { "nodes": nodes, "links": links };
	}

	/*
	Get a list of publications for a given author
		parameter: gsid - Author's Google Scholar ID
		return: list of publication IDs associated
				with the given scholar
	*/
	function getPubList(gsid) {
		var authors_pubid = d3.nest()
			.key(function (d) { return d.gsid; })
			.rollup(function (d) {
				var pubidlist = [];
				d.forEach(element => {
					pubidlist.push(element.pubid);
				});
				return pubidlist;
			})
			.entries(gAuth_pub_univ);
		
		var publist = authors_pubid.filter(function (d) {
			return gsid == d.key;
		});
		return publist[0];
	}

	/*
	Get a list of coauthors and their associated articles
	or publications.
		parameter: gsid - Author's Google Scholar ID
		return: Nested object with coauthor gsid as key
				and a list of publication ids as the
	*/
	function getCoAuthors(gsid) {
		
		var publist = getPubList(gsid);
		
		var pubid_authors = d3.nest()
			.key(function (d) { return d.pubid; })
			.rollup(function (d) {
				var authidlist = [];
				d.forEach(element => {
					authidlist.push(element.gsid);
				});
				return authidlist;
			})
			.entries(gAuth_pub_univ);

		var coauthlist = [];
		publist.values.forEach(pubid => {
			// get pubs for target author
			var coauth = pubid_authors.filter(function (d) {
				return pubid == d.key;
			});
			//get each coauth per pub
			var cPub = coauth[0].key;
			coauth[0].values.forEach(element => {
				if (element != gsid) {
					var obj = {};
					obj["key"] = element;
					obj["value"] = cPub;
					coauthlist.push(obj);
				}
			});
		});

		var nestedCoAuth = d3.nest()
			.key(function (d) {
			return d.key;
			})
			.entries(coauthlist);
		return nestedCoAuth
	}

	function distinct(value, index, self) {
		return self.indexOf(value) === index;
	}

	/*
	Given a network, this function uses d3.layout.force
	to draw an interactive network graph. The elements
	are dynamically added, but requires an svg element
	in the HTML page to anchor the viz to.
		parameter: authNet - Dictionary of nodes and links
					of the author's network
		return: None
	*/
	function drawNetwork(authNet) {
		var force = d3.layout.force()
			//.gravity(-0.1)
			.linkDistance(50)
			.charge(-400)
			//.friction(0.8)
			.size([width, height]);
		
		force
			.nodes(authNet.nodes)
			.links(authNet.links)
			.start();
		
		var tooltip = d3.tip()
			.attr("class", "d3-tip")
			.offset([0, -20])
			.html(function (d) {
				var pubsHtml = "<ul>";
				d.pubs.forEach(element => {
					pubsHtml += "<li>" + gPub_info[element.value].bib.title + "</li>"
				})
				return pubsHtml + "</ul>";
			})
			.style("background-color", "#f8f9fa")
			.style("text-align", "left")
			.style("box-sizing", "border-box");
		
		svg.call(tooltip);
		
		var link = svg.selectAll(".link")
			.data(authNet.links)
			.enter().append("line")
			.attr('class', 'link')
			.attr("stroke-width", function (d) {
				return (d.weight*1);
			})
			.style('stroke', 'blue')
			.style("stroke-opacity", 0.6)
			.on("mouseover", function (d) {
				tooltip.show(d, this);
			})
			.on("mouseout", function (d) {
				tooltip.hide(d, this);
			});
		
		var drag = force.drag()
			.on("dragstart", dragstart);
		
		var node = svg.selectAll(".node")
			.data(authNet.nodes)
			.enter().append("g")
			.attr("class", "node")
			.on("dblclick", dblclick)
			.call(drag);
			//.call(force.drag);
		
		node.append("image")
			.attr("xlink:href", function (d) { 
				return gAuth_info[d.id].url_picture
			})
			.attr("x", -15)
			.attr("y", -15)
			.attr("width", 30)
			.attr("height", 30);
		
		node.append("a")
			.attr("target","_blank")
			.attr("href", function (d) { 
				return "https://scholar.google.com/citations?user="+d.id;
			})
			.append("text")
			.attr("dx", -25)
			.attr("dy", 30)
			.text(function (d) { return gAuth_info[d.id].name });
		
		force.on("tick", function () {
			link.attr("x1", function (d) { return d.source.x; })
				.attr("y1", function (d) { return d.source.y; })
				.attr("x2", function (d) { return d.target.x; })
				.attr("y2", function (d) { return d.target.y; });

			node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
		});


		function dblclick(d) {
			d3.select(this).classed("fixed", d.fixed = false);
		}

		function dragstart(d) {
			d3.select(this).classed("fixed", d.fixed = true);
		}
	}
}