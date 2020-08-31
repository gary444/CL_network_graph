import * as d3 from './modules/d3.v5.min.js';
import * as Network from './CLNetwork.js';

const svg_width = window.innerWidth;
const svg_height = window.innerHeight-4;

// function color (d) {
// 	return d3.scaleSequential(d3.interpolateRdBu);
// }

d3.json("./data/cl_nodes_links_ordered.json").then(function(data) {
  console.log(data); // Hello, world!

	const color = d3.scaleSequentialSqrt(d3.interpolateRdBu).domain([0.1,0.7]);

	let network = new Network.CLNetwork(svg_width, svg_height, data, color);


});
