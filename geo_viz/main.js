/*  This visualization was made possible by modifying code provided by:

Scott Murray, Choropleth example from "Interactive Data Visualization for the Web" 
https://github.com/alignedleft/d3-book/blob/master/chapter_12/05_choropleth.html   
		
Malcolm Maclean, tooltips example tutorial
http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html

Mike Bostock, Pie Chart Legend
http://bl.ocks.org/mbostock/3888852  */

//Width and height of map
// var width = 2500;
// var height = 1000;


// A simple data key to label map
var key_label = {
  "total_fte_staff": "Total Full-time Employee Staff",
  "total_research_fte": "Total Full-time Research Employees",
  "phd_students_with_RA_scholarship": "PhD Students with RA / Scholarship",
  "student_to_faculty_ratio": "Student to Faculty Ratio",
  "total_applicants": "Total Applicants",
  "total_enrolled": "Total Enrolled",
  "total_nonresident_aliens": "Total Non-resident Aliens",
  "professors": "Professors",
  "associate_professors": "Associate Professors",
  "assistant_professors": "Assistant Professors",
  "inst_name": "Name of the Institute",
  "inst_address": "Address",
  "city_location_of_inst": "City",
  "inst_zip_code": "Zip Code",
  "combined_charge_room_board": "Combined Charge of Room and Board",
  "out_of_state_average_tuition_FT_grads": "Out-of-State Average Tuition"
}

function load_me() {
  $('#faculty_view').hide();
  $("#main").show()
  d3.select('svg').selectAll('*').remove();
  var newSvg = document.getElementById('addSvg');
  newSvg.outerHTML += '<svg id="mainSVG" width="1320" height="720" style="border: 1px solid #777;"><foreignobject class="node" x="9" y="200" width="310" height="360"><div id="scrollContainer"> <div class="dropdown"></div><div id="myDropdown" class="dropdown-content"><input type="text" placeholder="Search.." id="collegeSearch" onkeyup="findCollege()"><svg id="scrollSVG" width="310" height="360"></svg></div></div></div></foreignobject></svg>'
  geo_viz();
}

function findCollege() {
  input = document.getElementById("collegeSearch");
  filter = input.value.toUpperCase();
  debugger;
  div = document.getElementsByClassName("collegeList")[0];
  a = div.getElementsByTagName("g");
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}

function geo_viz() {

  $("#main").show()
  $('#faculty_view').hide();
  //Create SVG element and append map to the SVG
  var svg = d3
    // .select("body")
    .select("#mainSVG")
    // .append("svg")
    // .attr("width", width)
    // .attr("height", height)
    .attr("overflow-x", "auto")
    .attr("overflow-y", "auto")
    .attr("border", "2px solid black");

  var svgWidth = +svg.attr('width');
  var svgHeight = +svg.attr('height');

  var padding = {
    t: 20,
    r: 20,
    b: 20,
    l: 20
  };

  var compareWidth = svgWidth / 4 - padding.r;
  var compareHeight = (svgHeight) / 2;
  var barBand = (compareHeight - 50) / 7;
  var barHeight = barBand * 0.5;

  // D3 Projection
  var projection = d3.geo
    .albersUsa()
    // .translate([width / 2, height / 2]) // translate to center of screen
    .translate([svgWidth / 2, svgHeight / 2]) // translate to center of screen
    .scale([900]); // scale things down so see entire US

  // Define path generator
  var path = d3.geo
    .path() // path generator that will convert GeoJSON to SVG paths
    .projection(projection); // tell path generator to use albersUsa projection

  // Define linear scale for output
  var color = d3.scale
    .linear()
    .range([
      "darkgray",
    ]);

  // var legendText = ["Cities Lived", "States Lived", "States Visited", "Nada"];
  var legendText = [
    "Student to Faculty Ratio",
    "Student to Faculty Ratio",
    "Student to Faculty Ratio",
    "Student to Faculty Ratio"
  ];

  var scrollSVG = d3.select('#scrollSVG');

  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-5, 0])
    .html(function (d) {
      return "<h6>" + d.inst_name + "</h6><table><thead><tr><td><strong>City</strong></td><td><strong>Student-to-Faculty Ratio</strong></td></tr></thead>" +
        "<tbody><tr><td>" + d.city_location_of_inst + "</td><td>" + d.student_to_faculty_ratio + "</td></tr></tbody>" +
        "<thead><tr><td><strong>Out-of-State Average Tuition</strong></td><td><strong>PhD Students with RA/Scholarship</strong></td></tr></thead>" +
        "<tbody><tr><td>$" + d.out_of_state_average_tuition_FT_grads + "</td><td colspan='2'>" + d.phd_students_with_RA_scholarship + "</td></tr></tbody></table>"
    })
    .style("background-color", "#f8f9fa")
    .style("text-align", "center")
    .style("box-sizing", "border-box");
  svg.call(toolTip);

  // Load in my states data!
  d3.csv("../geo_viz/univ-info.csv", function (data) {
    //creates a rectangle - top right
    collegeList = scrollSVG.append('g')
      .attr('class', 'collegeList')
    // debugger;
    // Filter the data
    // Everything outside the US will be dropped
    data = data.filter(function (d) {
      if (projection([d.inst_long, d.inst_lat]) == null) {
        return false;
      }
      return true;
    });

    // Convert relevant attribute values to numbers
    data.forEach(function (d) {
      d.out_of_state_average_tuition_FT_grads = +d.out_of_state_average_tuition_FT_grads;
      d.student_to_faculty_ratio = +d.student_to_faculty_ratio;
      d.assistant_professors = +d.assistant_professors;
      d.associate_professors = +d.associate_professors;
      d.professors = +d.professors;
    });

    var map = d3.map(data);

    // Radius Scale for the universities
    var radExtent = d3.extent(data, function (d) {
      return d.out_of_state_average_tuition_FT_grads;
    });

    var radScale = d3.scale
      .linear()
      .domain(radExtent)
      .range([1, 10]);

    // Inverse scale
    var invradScale = d3.scale
      .linear()
      .domain([1, 10])
      .range(radExtent)

    color.domain([0, 1, 2, 3]); // setting the range of the input data
    var colorExtent = d3.extent(data, function (d) {
      return d.assistant_professors;
    });

    var colorScale = d3.scale
      .quantize()
      .domain(colorExtent)
      // .range(["brown", "steelblue"]);
      .range(["rgb(94, 16, 249)", "rgb(200, 65, 65)"]);
    // .range(["red", "green"]);

    // Load GeoJSON data and merge with states data
    d3.json("../geo_viz/states.json", function (json) {
      // Loop through each state data value in the .csv file
      for (var i = 0; i < data.length; i++) {
        // Grab State Name
        var dataState = data[i].State;
        var dataVal = data[i].assistant_professors;

        // Grab data value
        // var dataValue = data[i].visited;

        // Find the corresponding state inside the GeoJSON
        for (var j = 0; j < json.features.length; j++) {
          var jsonState = json.features[j].properties.name;

          json.features[j].properties.visited = dataVal;
          if (dataState == jsonState) {
            // Copy the data value into the JSON
            json.features[j].properties.visited = dataVal;

            // Stop looking through the JSON
            break;
          }
        }
      }

      // Bind the data to the SVG and create one path per GeoJSON feature
      svg
        .selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        // .style("fill", "#fee8c8");
        .style("fill", "#bdbdbd");

      svg
        .selectAll(".schools")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
          return projection([d.inst_long, d.inst_lat])[0];
        })
        .attr("cy", function (d) {
          return projection([d.inst_long, d.inst_lat])[1];
        })
        .attr("r", function (d) {
          return radScale(d.out_of_state_average_tuition_FT_grads);
        })
        .attr("class", "schools")
        // .style("fill", "#e34a33")
        .style("fill", "#2c7fb8")
        .style("opacity", 0.7)
        .on("mouseover", toolTip.show)
        .on('mouseout', toolTip.hide)
        .on('click', function (d) {
          collegeClick(d)
        });

      // Draw circular legend
      // Add 3 circles denoting the radius values to plot
      var radii = [10, 5.5, 1.5];
      for (let index = 0; index < radii.length; index++) {
        var radius = radii[index];
        var xpos = 1130;
        var ypos = 20 + (index + 1) * 18;
        var textypos = 25 + (index + 1) * 18;
        var legendVal = invradScale(radius).toFixed(2);
        svg.append("circle")
          .attr("cx", function (d) {
            // To set legend x-position
            return xpos;
          })
          .attr("cy", function (d) {
            // To set legend y position
            return ypos;
          })
          .attr("r", function (d) {
            return radius;
          })
          // .style("fill", "#e34a33")
          .style("fill", "#2c7fb8")
          .style("opacity", 0.7)
        var legendPrefix = "$";
        svg.append("text")
          .text(legendPrefix + legendVal)
          .attr("transform", "translate(1160," + textypos + ")")
          .attr("class", "legendText")
      }
      // Add text describing legends
      legendypos = textypos + 30
      svg.append("text")
        .text("Out-of-State Average Tuition")
        .attr("transform", "translate(1100," + legendypos + ")")
        .attr("class", "legendAnno")

      // We're going to update the list of colleges in thr scroll functionality
      showColleges = data;
      showColleges = showColleges.sort(function (a, b) {
        return d3.ascending(a.inst_name, b.inst_name);
      });

      document.getElementById('scrollSVG').setAttribute("height", (showColleges.length * 15 + 10) + "px");

      var collegeList = scrollSVG.selectAll('.collegeList')

      var collegeNames = collegeList.selectAll('.collegeName')
        .data(showColleges, function (d) {
          return d.inst_name;
        })

      var namesEnter = collegeNames.enter()
        .append('g')
        .attr('class', 'collegeName')
        .attr('transform', function (d, i) {
          return 'translate(' + [10, (i * 15) + 20] + ')'; // Update position based on index
        });

      namesEnter.append('text')
        .attr('class', 'collegeNameText')
        .text(function (d) {
          return d.inst_name;
        });


      namesEnter.on('mouseover', nameMouseover);
      // namesEnter.on('mouseover', function (d) {
      //   nameMouseover;
      //   toolTip.show;
      // });
      namesEnter.on('mouseout', nameMouseout);
      // College click function
      function collegeClick(college) {
        selectedCollege = college;
        // Remove old components
        var toRemove = d3.select('g.collegeCmp1').selectAll('.will_remove');
        toRemove.remove();
        var textlabel = college1.append("text")
          .attr('x', compareWidth / 2)
          .attr('y', 20)
          .attr('class', 'compare_title will_remove')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text(college.inst_name);

        if (textlabel.node().getComputedTextLength() > (compareWidth - 5)) {
          textlabel.text(college.inst_name.slice(0, 41) + "...");
        }
        updateDetailView();
        // Code snippet to add the node-link graph
        // Instead of going through this complicated node-link business
        // Just draw lines
        d3.json("../geo_viz/links.json", function (link_json) {
          link_json = link_json.filter(function (d) {
            if (d.source == selectedCollege.inst_name) {
              console.log(selectedCollege)
              console.log(d.source)
              return true
            }
            return false
          });
          console.log(link_json)

          // Draw lines here
          // eturn projection([d.inst_long, d.inst_lat])[0];
          var source_xy = []
          var target_xy = []
          var weights = []
          var source_college = selectedCollege.inst_name
          for (let i = 0; i < link_json.length; i++) {
            var target_college = link_json[i].target;
            for (let j = 0; j < data.length; j++) {
              if (data[j].inst_name == target_college) {
                target_xy.push(projection([data[j].inst_long, data[j].inst_lat]))
                source_xy.push(projection([selectedCollege.inst_long, selectedCollege.inst_lat]))
                weights.push(link_json[i].weight)
              }
            }
          }
          console.log(source_xy)
          console.log(target_xy)
          svg.selectAll("line")
            .remove()

          for (let index = 0; index < source_xy.length; index++) {
            svg.append("line")
              .attr("x1", source_xy[index][0])
              .attr("y1", source_xy[index][1])
              .attr("x2", target_xy[index][0])
              .attr("y2", target_xy[index][1])
              .style("stroke", "#8856a7")
              .style("stroke-width", weights[index] + 2);
          }
        })

      }
      namesEnter.on('click', function (d) {
        collegeClick(d)
      });

      collegeNames.exit().remove();

      //creates a rectangle - top right
      college1 = svg.append('g')
        .attr('class', 'collegeCmp1')
        // .attr('transform', 'translate(' + [padding.l, padding.t] + ')')
        .attr('transform', 'translate(1000,200)')

      college1.append('rect')
        .attr('width', compareWidth)
        .attr('height', compareHeight)
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', '1.5')
        .attr('stroke-opacity', '0.1');

      college1.append("text")
        .attr('x', compareWidth / 2)
        .attr('y', compareHeight / 2)
        .attr('class', 'instructions will_remove')
        .attr('id', 'start_instructions')
        .text('Select a school to learn more');

      // Funciton to update map
      function updateMap(selectedOption) {
        console.log(selectedOption)
        // Radius Scale for the universities
        var radExtent = d3.extent(data, function (d) {
          return d[selectedOption];
        });
        console.log(radExtent)

        var radScale = d3.scale
          .linear()
          .domain(radExtent)
          .range([1, 10]);

        var invradScale = d3.scale
          .linear()
          .domain([1, 10])
          .range(radExtent);

        var circles = svg.selectAll('.schools')
          .data(data)
          .transition()
          .duration(750)
          .attr("cx", function (d) {
            return projection([d.inst_long, d.inst_lat])[0];
          })
          .attr("cy", function (d) {
            return projection([d.inst_long, d.inst_lat])[1];
          })
          .attr("r", function (d) {
            return radScale(d[selectedOption]);
          });

        svg.selectAll('.legendText')
          .remove();

        svg.selectAll(".legendAnno")
          .remove();

        var radii = [10, 5.5, 1.5];
        for (let index = 0; index < radii.length; index++) {
          var radius = radii[index];
          var xpos = 1130;
          var ypos = 20 + (index + 1) * 18;
          var textypos = 25 + (index + 1) * 18;
          var legendVal = invradScale(radius).toFixed(2);
          var legendPrefix = "";
          if (selectedOption == "out_of_state_average_tuition_FT_grads") {
            legendPrefix = "$"
          }
          svg.append("text")
            .text(legendPrefix + legendVal)
            .attr("transform", "translate(1160," + textypos + ")")
            .attr("class", "legendText")
        }
        // Add text describing legends
        legendypos = textypos + 30
        legendAnnoText = key_label[selectedOption]
        svg.append("text")
          .text(legendAnnoText)
          .attr("transform", "translate(1100," + legendypos + ")")
          .attr("class", "legendAnno")
      }

      d3.select('#compareSelect')
        .on('change', function (d) {
          var selectOption = d3.select(this).property('value')
          updateMap(selectOption)
        });

      // Add annotation for detailed view
      svg.append("text")
        .text("Detailed Information")
        .attr("x", 1100)
        .attr("y", 180)
        .attr("class", "detailViewAnno");

      svg.append("text")
        .text("List of Universities")
        .attr("x", 100)
        .attr("y", 180);
    });

    // Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
    // var legend = d3
    //   .select("body")
    //   .append("svg")
    //   .attr("class", "legend")
    //   .attr("width", 140)
    //   .attr("height", 200)
    //   .selectAll("g")
    //   .data(
    //     color
    //     .domain()
    //     .slice()
    //     .reverse()
    //   )
    //   .enter()
    //   .append("g")
    //   .attr("transform", function (d, i) {
    //     return "translate(0," + i * 20 + ")";
    //   });

    // legend
    //   .append("rect")
    //   .attr("width", 18)
    //   .attr("height", 18)
    //   .style("fill", color);

    // legend
    //   .append("text")
    //   .data(legendText)
    //   .attr("x", 24)
    //   .attr("y", 9)
    //   .attr("dy", ".35em")
    //   .text(function (d) {
    //     return d;
    //   });
  });

  function nameMouseover() {
    var college = d3.select(this).data()[0].inst_name
    svg.selectAll('.schools')
      .classed('grow', function (d) {
        return college == d.inst_name
      });

  }

  function nameMouseout() {
    svg.selectAll('.foregroundLine').classed('hidden', false)
    svg.selectAll('.foregroundLine').classed('shown', false)
    svg.selectAll('.schools').classed('grow', false)
  }

  function updateDetailView() {
    d3.select('.temp_graph').remove();
    var select = d3.select('#compareSelect').node();
    if (selectedCollege == null) {
      return "";
    }
    var financeData = {
      one: {
        key: "city_location_of_inst",
        label: key_label["city_location_of_inst"]
      },
      two: {
        key: "student_to_faculty_ratio",
        label: key_label["student_to_faculty_ratio"]
      },
      three: {
        key: "out_of_state_average_tuition_FT_grads",
        label: key_label["out_of_state_average_tuition_FT_grads"]
      },
      four: {
        key: "phd_students_with_RA_scholarship",
        label: key_label["phd_students_with_RA_scholarship"]
      },
      five: {
        key: "professors",
        label: key_label["professors"]
      },
      six: {
        key: "assistant_professors",
        label: key_label["assistant_professors"]
      },
      seven: {
        key: "associate_professors",
        label: key_label["associate_professors"]
      },
    };
    var tempGroup = college1.append('g')
      .attr('class', 'temp_graph will_remove')
      .attr('transform', 'translate(' + ((compareWidth / 2) + 60) + ', 40)');

    var tempKeys = Object.keys(financeData);

    var bars = tempGroup.selectAll('.bar')
      .data(tempKeys);

    var barsEnter = bars.enter()
      .append('g')
      .attr('class', 'textbar')
      .attr('transform', function (d, i) {
        return 'translate(' + [0, i * barBand + 4] + ')';
      });

    barsEnter.append('text')
      .attr('x', 5)
      .attr('dy', '1.1em')
      .attr('font-size', '13px')
      .attr('text-anchor', 'start')
      .text(function (d, i) {
        return customFormat(selectedCollege[financeData[tempKeys[i]].key], i);
      });

    barsEnter.append('text')
      .attr('x', -5)
      .attr('dy', '1.2em')
      .attr('font-size', '12px')
      .attr('text-anchor', 'end')
      .attr('font-weight', 'bold')
      .text(function (d, i) {
        return financeData[tempKeys[i]].label + ": ";
      });

    bars.exit().remove();
  }

  function customFormat(word, idx) {
    // switch (idx) {
    //   case 0:
    //   case 1:
    //   case 4:
    //   case 5:
    //     return "$" + word.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    //   case 6:
    //     return "$" + (word * 10).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    //   case 2:
    //   case 3:
    //     return (word * 100).toFixed(2) + "%";
    //   default:
    //     return word;
    // }
    return word;

  }
}