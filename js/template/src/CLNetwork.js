import * as d3 from './modules/d3.min.js';
import * as titles from './titles.js';
import * as details from './details.js';

function radius(d){
	return get_node_radius_for_matches(d.matches)
}

export function get_node_radius_for_matches(matches) {
	var scale = d3.scaleSqrt()
	  .domain([1, 250])
	  .range([3, 40]);

	return scale(matches);
}

export class CLNetwork {


	constructor (width, height, data, color){


		this.width = width
		this.height = height

		this.links = data.links.map(d => Object.create(d));
		this.nodes = data.nodes.map(d => Object.create(d));

		this.center = [width / 2, height / 2];

		const svg = d3.select("body").append("svg")
		  .attr("width", width)
		  .attr("height", height);

		const link = svg.append("g")
		    .classed("links", true)

		svg.append("g").classed("rects", true)

		// add nodes and labels
		this.add_nodes_marks(svg, color)
		this.add_labels(svg)

		// set title positions and add title and details
		const title_line_pos = 0.75
		this.legend_middle_x = 1.0 - ((1.0-title_line_pos) * 0.5) - 0.01
		titles.draw_titles(svg, width, height, color, title_line_pos);
		details.add_detail_text(svg, width, height, title_line_pos, this.legend_middle_x)

		// set positions of nodes and labels, and add links using show_opponents function
		this.show_opponents(this.nodes[0])

	}

	add_nodes_marks(svg, color){
		svg.append("g").classed("nodes", true)

		this.node_enter = 
			svg.select("g.nodes")
			.selectAll("circle")
			.data(this.nodes)
		  .enter()

		this.node_enter  
		  .append("circle")
		  .attr("r", radius)
		  .attr("cx", this.center[0])
		  .attr("cy", this.center[1])
		  .attr("fill", d => color(d.win_pc) )
		  .on("click", d => this.show_opponents(d))
		  .on("mouseover", d => this.highlight(d))
		  .on("mouseout", d => this.reset_highlight(d))
		  .attr('class', function(d){
						  return '_' + d.id + '_node';
						})
	}

	add_labels(svg){

		svg.append("g").classed("labels", true)

		this.node_enter
			.append("text")
			.text(d => d.name)
		    .attr("x", d => d.x)
		    .attr("y", d => d.y)
			.on("mouseover", d => this.highlight(d))
			.on("mouseout", d => this.reset_highlight(d))
			  .attr('class', function(d){
				  return '_' + d.id + '_label label';
				})
	}


	show_opponents (target_node){


		this.selected_team = target_node.id;

		// filter links to get teams that are connected with the target team
		let active_links = this.links.filter( (link) =>  {
			var prototype = Object.getPrototypeOf(link);
			return Number(prototype.source) == this.selected_team || Number(prototype.target) == this.selected_team;
		});

		// sort in descending order of weights - so most angles for most played-against teams are added first
		active_links.sort(function (a,b) {
			return b.weight - a.weight;
		})

		// calculate positions for linked teams - distribute radially around centre team
		var degree_per_team = 2.0 * Math.PI / active_links.length;

		var locations      = Array(this.nodes.length).fill([0,0]);
		var text_locations = Array(this.nodes.length).fill([0,0]);
		var angles         = Array(this.nodes.length).fill(0);
		var opacities      = Array(this.nodes.length).fill(0);

		//target team at centre
		locations[this.selected_team]      = [this.center[0],this.center[1]];
		text_locations[this.selected_team] = [this.center[0],this.center[1]];
		opacities[this.selected_team]      = 1.0

		var weight_to_radius = d3.scaleLinear()
									.domain([1,20])
									.range([this.width*0.1,this.width*0.4]);

		active_links.forEach( (link, i) => {

			// get non target team
			let team_id = link.source;
			if (team_id == this.selected_team ) {team_id = link.target;}

			// calculate final position according to degree and weight
			const angle = i*degree_per_team + Math.PI*1.5 
			let x_offset = weight_to_radius(link.weight) * Math.sin(angle);
			let y_offset = - weight_to_radius(link.weight) * Math.cos(angle);

			locations[team_id] = ([this.center[0]+x_offset, this.center[1]+y_offset]);

			// calculate the anchor position for the label of this node
			let text_shift =  get_node_radius_for_matches(this.nodes[team_id].matches) * 1.25;

			let text_x_offset = (weight_to_radius(link.weight) + text_shift) * Math.sin(angle-0.009);
			let text_y_offset = - (weight_to_radius(link.weight) + text_shift) * Math.cos(angle-0.009);
			text_locations[team_id] = ([this.center[0]+text_x_offset, this.center[1]+text_y_offset]);

			angles[team_id] = ((angle * 180 / Math.PI) + 90) % 360;

			opacities[team_id] = 1;
		});



		// here - update opacity of nodes to hide non linked teams
		d3.select("g.nodes")
			.selectAll("circle")
				.attr("cx", (d,i) => locations[i][0])
				.attr("cy", (d,i) => locations[i][1])
				.style("opacity", (d,i) =>  
					{return opacities[i];})

		this.reset_node_styles()

			
		// add links using new node positions
		d3.select("g.links").selectAll("line").remove();
		d3.select("g.links")
			  .attr("stroke", "#999")
			  .attr("stroke-opacity", 0.6)
			  .attr("stroke-width", 1)
			.selectAll("line")
			.data(active_links)
			.enter().append("line")
				.attr("x1", (d) => locations[d.source][0])
				.attr("y1", (d) => locations[d.source][1])
				.attr("x2", (d) => locations[d.target][0])
				.attr("y2", (d) => locations[d.target][1])
				.on("mouseover", d => this.highlight(d))
				.on("mouseout", d => this.reset_highlight(d))
				.attr('class', function(d){
				  return '_' + d.source + '_' + d.target + '_link';
				})
		  		


		let label_width = (this.nodes[this.selected_team].name).length * 10;
		let label_height = this.height * 0.025;
		let label_y = this.center[1] + get_node_radius_for_matches( this.nodes[this.selected_team].matches )*1.25;


		// add label for highlighted team
		d3.select("g.rects").selectAll("rect").remove();
		d3.select("g.rects").append("rect")
			.classed("label_bg", true)
			.attr("x", this.center[0] - label_width/2)
			.attr("y", label_y)
			.attr("width", label_width)
			.attr("height", label_height)


		// add text labels
		//reset transforms first
		d3.select("g.nodes").selectAll("text")
			.attr("x", 0)
			.attr("y", 0)
			.attr("transform","")

		d3.select("g.nodes").selectAll("text")
			.attr("transform", (d,i) => 
				{	
					let loc = text_locations[i]
					let ang = angles[i]

					// check if this label is for focused team
					if (i == this.selected_team){
						ang = 0;
						loc[1] = (label_y+(label_height*0.75) 	);
					}
					if (ang > 90 && ang < 270) {
						ang = (ang + 180) % 360;
					}

					return "translate(" + loc[0] + "," + loc[1] + ") rotate(" + ang + ")";})
			.style("opacity", (d,i) =>  
					{return opacities[i];})
			.style("text-anchor", (d,i) => {
				if (i == this.selected_team){
					return "middle";
				}
				else if (angles[i] > 90 && angles[i] < 270){
					return "start"
				}
				else {
					return "end"
				}

			})
			.classed("selected", (d,i) => {return (i == this.selected_team);})

		// details 
		details.update_details_for_team(this.width, this.height, this.nodes, this.selected_team, this.legend_middle_x)

	}



	highlight (target){


		var team_to_highlight_id;
		var prototype = Object.getPrototypeOf(target);
		if (prototype.hasOwnProperty("name")){
			if (prototype.id == this.selected_team){
				return;
			}
			team_to_highlight_id = prototype.id;
		}
		else if (prototype.hasOwnProperty("source")){
			if (prototype.source == this.selected_team){
				team_to_highlight_id = prototype.target;
			}
			else {
				team_to_highlight_id = prototype.source;
			}
		}

		d3.selectAll('._' + team_to_highlight_id + '_node')
			.style("stroke-width", 3)
		d3.selectAll('._' + team_to_highlight_id + '_label')
			.style("fill", "#fff")

		d3.selectAll('._' + team_to_highlight_id + '_' + this.selected_team + '_link')
			.style("stroke", "#fff")
		d3.selectAll('._' + this.selected_team + '_' + team_to_highlight_id + '_link')
			.style("stroke", "#fff")


	}

	reset_highlight(target){

		var team_to_reset_id;

		var prototype = Object.getPrototypeOf(target);
		if (prototype.hasOwnProperty("name")){
			if (prototype.id == this.selected_team){
				return;
			}			
			team_to_reset_id = prototype.id;
		}
		else if (prototype.hasOwnProperty("source")){
			if (prototype.source == this.selected_team){
				team_to_reset_id = prototype.target;
			}
			else {
				team_to_reset_id = prototype.source;
			}
		}

		this.reset_node_styles()

		d3.selectAll('._' + team_to_reset_id + '_label')
			.style("fill", "#888")

		d3.selectAll('._' + team_to_reset_id + '_' + this.selected_team + '_link')
			.style("stroke", "#888")
		d3.selectAll('._' + this.selected_team + '_' + team_to_reset_id + '_link')
			.style("stroke", "#888")
	}

	reset_node_styles(){
		d3.select("g.nodes")
			.selectAll("circle")
			.style("stroke-width", 0)
	}




}