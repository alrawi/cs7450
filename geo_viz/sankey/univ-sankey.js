var width = 700;
var height = 400;

d3.csv('/data/drafty_data.csv', function (u2u) {
    console.log(u2u[0]);
    var chart = d3.select("svg").chart("Sankey.Path");

    var doc2univ = d3.nest()
        .key(function (d) {
            return d.Doctorate;
        })
        .entries(u2u);
    console.log(doc2univ);
    graph = { "nodes": [], "links": [] };

});