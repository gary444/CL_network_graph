import * as d3 from './modules/d3.min.js';
import * as titles from './titles.js';
import * as details from './details.js';

function radius(d){
	return get_node_radius_for_matches(d.matches)
}


export function get_node_radius_for_matches(matches, height) {


	var scale = d3.scaleSqrt()
	  .domain([1, 250])
	  .range([3.0*height/920.0, 40.0*height/920.0]);

	return scale(matches);
}

export class CLNetwork {


	constructor (width, height, data, color){


		this.width = width
		this.height = height

		this.links = data.links.map(d => Object.create(d));
		this.nodes = data.nodes.map(d => Object.create(d));

		this.center = [width / 2 * 0.9, height / 2];

		const svg = d3.select("body").append("svg")
		  .attr("width", width)
		  .attr("height", height);

		const link = svg.append("g")
		    .classed("links", true)

		svg.append("g").classed("labels", true)

		// add nodes and labels
		this.add_nodes_marks(svg, color)
		this.add_labels(svg)

		// set title positions and add title and details
		const title_line_pos = 0.75
		this.legend_middle_x = 1.0 - ((1.0-title_line_pos) * 0.5)
		titles.draw_titles(svg, width, height, color, title_line_pos, this.legend_middle_x);
		details.add_detail_text(svg, width, height, title_line_pos, this.legend_middle_x)


		this.weight_to_distance = d3.scaleLinear()
							.domain([0,20])
							.range([this.width*0.1,this.width*0.3]);

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
		  // .attr("r", (d) => radius(d.matches,this.height))
		  .attr("r", (d) => get_node_radius_for_matches(d.matches, this.height))

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

		// sort in descending order of weights - so most this.angles for most played-against teams are added first
		active_links.sort(function (a,b) {
			return b.weight - a.weight;
		})

		// calculate positions for linked teams - distribute radially around centre team
		var degree_per_team = 2.0 * Math.PI / active_links.length;

		this.locations      = Array(this.nodes.length).fill([0,0]);
		var text_locations  = Array(this.nodes.length).fill([0,0]);
		this.angles         = Array(this.nodes.length).fill(0);
		var opacities       = Array(this.nodes.length).fill(0);



		//target team at centre
		this.locations[this.selected_team]      = [this.center[0],this.center[1]];
		text_locations[this.selected_team] = [this.center[0],this.center[1]];
		opacities[this.selected_team]      = 1.0

		console.log("centre")
		console.log(this.center)
		console.log("label location")
		console.log(text_locations[this.selected_team])


		active_links.forEach( (link, i) => {

			// get non target team
			let team_id = link.source;
			if (team_id == this.selected_team ) {team_id = link.target;}

			let node_shift =  get_node_radius_for_matches(this.nodes[team_id].matches, this.height) 
							+ get_node_radius_for_matches(this.nodes[this.selected_team].matches, this.height);

			// calculate final position according to degree and weight
			const angle = i*degree_per_team + Math.PI*1.5 
			let x_offset = (this.weight_to_distance(link.weight) + node_shift) * Math.sin(angle);
			let y_offset = - (this.weight_to_distance(link.weight) + node_shift) * Math.cos(angle);

			this.locations[team_id] = ([this.center[0]+x_offset, this.center[1]+y_offset]);

			// calculate the anchor position for the label of this node
			// let text_shift =  get_node_radius_for_matches(this.nodes[team_id].matches) * 1.25;
			
			let text_shift =  (get_node_radius_for_matches(this.nodes[team_id].matches, this.height) * 2.5)
							+ get_node_radius_for_matches(this.nodes[this.selected_team].matches, this.height);

			let text_x_offset = (this.weight_to_distance(link.weight) + text_shift) * Math.sin(angle-0.009);
			let text_y_offset = - (this.weight_to_distance(link.weight) + text_shift) * Math.cos(angle-0.009);
			text_locations[team_id] = ([this.center[0]+text_x_offset, this.center[1]+text_y_offset]);

			this.angles[team_id] = ((angle * 180 / Math.PI) + 90) % 360;

			opacities[team_id] = 1;
		});



		// here - update opacity of nodes to hide non linked teams
		d3.select("g.nodes")
			.selectAll("circle")
				.attr("cx", (d,i) => this.locations[i][0])
				.attr("cy", (d,i) => this.locations[i][1])
				.style("opacity", (d,i) =>  
					// {return 0;})
					{return opacities[i];})

		this.reset_node_styles()
		this.remove_link_labels()
		this.reset_label_styles()

		details.remove_link_details()

		// add links using new node positions
		d3.select("g.links").selectAll("line").remove();

		var link_enter = d3.select("g.links")
			.selectAll("line")
			.data(active_links)
			.enter()

		//underlying link for highlighting and hovering
		link_enter.append("line")
				.attr("stroke-width", 6)
				.attr("stroke-opacity", 0)
				.attr("x1", (d) => this.locations[d.source][0])
				.attr("y1", (d) => this.locations[d.source][1])
				.attr("x2", (d) => this.locations[d.target][0])
				.attr("y2", (d) => this.locations[d.target][1])
				.on("mouseover", d => this.highlight(d))
				.on("mouseout", d => this.reset_highlight(d))
				.attr('class', function(d){
				  return '_' + d.source + '_' + d.target + '_link under';
				})

		// // visible lines - draws wins
		// link_enter.append("line")
		// 	.attr("x1", (d) => this.locations[d.source][0])
		// 	.attr("y1", (d) => this.locations[d.source][1])
		// 	.attr("x2", (d) => this.locations[d.target][0])
		// 	.attr("y2", (d) => this.locations[d.target][1])
		// 	.classed("target_wins", true)

		// visible lines - draws wins
		link_enter.append("line")
			.attr("x1", (d) => {return this.calculate_draw_line(d)[0][0];})
			.attr("y1", (d) => {return this.calculate_draw_line(d)[0][1];})
			.attr("x2", (d) => {return this.calculate_draw_line(d)[1][0];})
			.attr("y2", (d) => {return this.calculate_draw_line(d)[1][1];})
			.classed("draw", true)

		// visible lines - source wins
		link_enter.append("line")
			.attr("x1", (d) => {return this.calculate_source_win_line(d)[0][0];})
			.attr("y1", (d) => {return this.calculate_source_win_line(d)[0][1];})
			.attr("x2", (d) => {return this.calculate_source_win_line(d)[1][0];})
			.attr("y2", (d) => {return this.calculate_source_win_line(d)[1][1];})
			.classed("source_win", true)

		link_enter.append("line")
			.attr("x1", (d) => {return this.calculate_target_win_line(d, this.locations)[0][0];})
			.attr("y1", (d) => {return this.calculate_target_win_line(d, this.locations)[0][1];})
			.attr("x2", (d) => {return this.calculate_target_win_line(d, this.locations)[1][0];})
			.attr("y2", (d) => {return this.calculate_target_win_line(d, this.locations)[1][1];})
			.classed("target_wins", true)


		// todo add lines showing wins or losses per team



		  		


		let label_width = (this.nodes[this.selected_team].name).length * 10;
		let label_height = this.height * 0.025;
		let label_y = this.center[1] + get_node_radius_for_matches( this.nodes[this.selected_team].matches, this.height )*1.25;


		// add label for highlighted team
		d3.select("g.labels").selectAll("rect").remove();
		d3.select("g.labels").append("rect")
			.classed("label_bg", true)
			.attr("x", this.center[0] - label_width/2)
			.attr("y", label_y)
			.attr("width", label_width)
			.attr("height", label_height)

		d3.selectAll('._' + this.selected_team + '_label')
			.style("fill", "#fff")



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
					let ang = this.angles[i]

					// check if this label is for focused team
					if (i == this.selected_team){
						ang = 0;
						loc[1] = (label_y+(label_height*0.75) 	);
					}
					if (ang > 90 && ang < 270) {
						ang = (ang + 180) % 360;
					}

					return "rotate(" + ang + "," + loc[0] + "," + loc[1] + ") translate(" + loc[0] + "," + loc[1] + ") ";})
			.style("opacity", (d,i) =>  
					{return opacities[i];})
			.style("text-anchor", (d,i) => {
				if (i == this.selected_team){
					return "middle";
				}
				else if (this.angles[i] > 90 && this.angles[i] < 270){
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

	calculate_source_win_line(d){

		var dest_id = d.target;
		if (dest_id == this.selected_team) dest_id = d.source;

		let start_shift = get_node_radius_for_matches(this.nodes[this.selected_team].matches, this.height);

		let start_point = [0,0]
		start_point[0] = this.center[0] + (start_shift) * Math.sin((this.angles[dest_id]-90) / 180.0 * Math.PI);
		start_point[1] = this.center[1] - (start_shift) * Math.cos((this.angles[dest_id]-90) / 180.0 * Math.PI);

		const full_line_length = this.weight_to_distance(d.weight);
		const adjusted_length = full_line_length * d.source_wins/d.weight;

		let end_point = [0,0]
		end_point[0] = this.center[0] + (adjusted_length + start_shift) * Math.sin((this.angles[dest_id]-90) / 180.0 * Math.PI);
		end_point[1] = this.center[1] - (adjusted_length + start_shift) * Math.cos((this.angles[dest_id]-90) / 180.0 * Math.PI);

		return [start_point, end_point];
	}

	// calculates only correct endpoint so should be added before source win lines
	calculate_draw_line(d){

		var dest_id = d.target;
		if (dest_id == this.selected_team) dest_id = d.source;

		let start_shift = get_node_radius_for_matches(this.nodes[this.selected_team].matches, this.height);
		const full_line_length = this.weight_to_distance(d.weight);

		const adjusted_start = full_line_length * d.source_wins/d.weight;

		let start_point = [0,0]
		start_point[0] = this.center[0] + (adjusted_start + start_shift) * Math.sin((this.angles[dest_id]-90) / 180.0 * Math.PI);
		start_point[1] = this.center[1] - (adjusted_start + start_shift) * Math.cos((this.angles[dest_id]-90) / 180.0 * Math.PI);

		const adjusted_length = full_line_length * ((Number(d.source_wins) + Number(d.draws)) / d.weight);

		let end_point = [0,0]
		end_point[0] = this.center[0] + (adjusted_length + start_shift) * Math.sin((this.angles[dest_id]-90) / 180.0 * Math.PI);
		end_point[1] = this.center[1] - (adjusted_length + start_shift) * Math.cos((this.angles[dest_id]-90) / 180.0 * Math.PI);

		return [start_point, end_point];
	}

	// calculates only correct endpoint so should be added before source win lines
	calculate_target_win_line(d){

		var dest_id = d.target;
		if (dest_id == this.selected_team) dest_id = d.source;

		let start_shift = get_node_radius_for_matches(this.nodes[this.selected_team].matches, this.height);
		const full_line_length = this.weight_to_distance(d.weight);

		const adjusted_start = full_line_length * ((Number(d.source_wins) + Number(d.draws)) / d.weight);

		let start_point = [0,0]
		start_point[0] = this.center[0] + (adjusted_start + start_shift) * Math.sin((this.angles[dest_id]-90) / 180.0 * Math.PI);
		start_point[1] = this.center[1] - (adjusted_start + start_shift) * Math.cos((this.angles[dest_id]-90) / 180.0 * Math.PI);

		let end_point = this.locations[dest_id]

		return [start_point, end_point];
	}


	highlight (target){

		let link_weight = -1
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
			link_weight = prototype.weight
		}

		d3.selectAll('._' + team_to_highlight_id + '_node')
			.style("stroke-width", 3)
			.style("stroke-opacity", 0.6)
		d3.selectAll('._' + team_to_highlight_id + '_label')
			.style("fill", "#fff")

		d3.selectAll('._' + team_to_highlight_id + '_' + this.selected_team + '_link')
			// .style("stroke", "#fff")
			.style("stroke-opacity", 0.2)
		d3.selectAll('._' + this.selected_team + '_' + team_to_highlight_id + '_link')
			.style("stroke-opacity", 0.2)

		let label_pos = [0,0]
		let label_displacement_from_centre = 0.06 * this.width;
		label_pos[0] = this.center[0] + (label_displacement_from_centre) * Math.sin((this.angles[team_to_highlight_id]-100) / 180.0 * Math.PI);
		label_pos[1] = this.center[1] - (label_displacement_from_centre) * Math.cos((this.angles[team_to_highlight_id]-100) / 180.0 * Math.PI);

		d3.select("g.labels").append("circle")
			.classed("weight_label", true)
			.attr("cx", label_pos[0])
			.attr("cy", label_pos[1])
			.attr("r", this.width * 0.008)

		// find weight
		if (link_weight < 0){

			let active_links = this.links.filter( (link) =>  {
				var prototype = Object.getPrototypeOf(link);
				return (Number(prototype.source) == this.selected_team && Number(prototype.target) == team_to_highlight_id)
				    || (Number(prototype.target) == this.selected_team && Number(prototype.source) == team_to_highlight_id);
			});
			link_weight = active_links[0].weight;

			// show link details
			details.update_match_details_for_link(this.width, 
												  this.height, 
												  active_links[0], 
												  this.nodes, 
												  this.selected_team, 
												  this.legend_middle_x);

		}

		d3.select("g.labels").append("text")
			.classed("weight_label", true)
			.attr("x", label_pos[0])
			.attr("y", label_pos[1] + (this.height*0.005))
			.text(Number(link_weight))


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
			.style("stroke-opacity", 0)

		d3.selectAll('._' + this.selected_team + '_' + team_to_reset_id + '_link')
			.style("stroke-opacity", 0)

		this.remove_link_labels()

		details.remove_link_details();

	}

	reset_node_styles(){
		d3.select("g.nodes")
			.selectAll("circle")
			.style("stroke-width", 0)
	}
	reset_label_styles(){
		d3.select("g.nodes")
			.selectAll("text")
			.style("fill", "#888")
	}
	remove_link_labels(){
		d3.selectAll(".weight_label").remove()
	}




}