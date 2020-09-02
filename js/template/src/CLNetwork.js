import * as d3 from './modules/d3.min.js';

function radius(d){
	return get_node_radius_for_matches(d.matches)
}
function get_node_radius_for_matches(matches) {
	// return Math.max(5,matches/5);
	// var scale = d3.scaleLinear()
	var scale = d3.scaleSqrt()
	  .domain([1, 250])
	  .range([3, 40]);

	return scale(matches);
}

function hide_elements_without_location(d,i,locations) {
	if (locations[i][0] == 0){
		return 0;
	}
	return 1;
}

export class CLNetwork {


	constructor (width, height, data, color){

		this.width = width
		this.height = height

		this.links = data.links.map(d => Object.create(d));
		this.nodes = data.nodes.map(d => Object.create(d));
		

		console.log(this.links)

		this.center = [width / 2, height / 2];

		// this.simulation = d3.forceSimulation(this.nodes)
		  // .force("collision", d3.forceCollide(radius).strength(1))
		  // .force("center", d3.forceCenter(this.center[0], this.center[1]))
		  // .force("charge", d3.forceManyBody().strength(0.5))
		  // .alphaMin(0.1)



		const svg = d3.select("body").append("svg")
		  .attr("width", width)
		  .attr("height", height);

		  
		const link = svg.append("g")
		    .classed("links", true)

		svg.append("g").classed("titles", true)
		svg.append("g").classed("rects", true)
		svg.append("g").classed("nodes", true)
		svg.append("g").classed("labels", true)
		svg.append("g").classed("details", true)

		this.node_enter = 
			svg.select("g.nodes")
			.selectAll("circle")
			.data(this.nodes)
		  .enter()

		const node = this.node_enter  
		  .append("circle")
		  .attr("r", radius)
		  .attr("cx", this.center[0])
		  .attr("cy", this.center[1])
		  .attr("fill", d => color(d.win_pc) )
		  .on("click", d => this.show_opponents(d))
		  .on("mouseover", d => this.show_details(d))
		  .on("mouseout", d => this.hide_details(d))


		// this.simulation.on("tick", () => {

		// 	node
		// 	    .attr("cx", d => d.x)
		// 	    .attr("cy", d => d.y);
			
		// });


		// this.simulation.on("end", () => {
			
		this.node_enter
			.append("text")
			.classed("label", true)
			.text(d => d.name)
		    .attr("x", d => d.x)
		    .attr("y", d => d.y);



		const title_line_pos = 0.75
		this.legend_middle_x = 1.0 - ((1.0-title_line_pos) * 0.5) - 0.01

		// titles
		svg.select("g.titles").append("text")
			.classed("title", true)
			.text("Champions League")
			// .attr("x", width*0.01)
			.attr("x", width*(title_line_pos + 0.02))
			.attr("y", height*0.1)

		// subtitle
		svg.select("g.titles").append("text")
			.classed("subtitle", true)
			.attr("x", width*(title_line_pos + 0.02))
			.attr("y", height*0.15)
			.text("All top-level European encounters since 1992 - visualised.")


		const legend_y_placement = 0.6

		const legend_circle_x = 0.78
		const legend_circle_x_gap = 0.04

		// legend - size
		svg.select("g.titles").append("text")
			.classed("legend", true)
			.text("Circle size shows number of Champions League matches played")
			.attr("x", width*(title_line_pos+0.02))
			.attr("y", height*legend_y_placement)

		let legend_circle_matches = [1, 50, 100, 150, 200]
		svg.select("g.titles").selectAll("circle.matches")
			.data(legend_circle_matches)
			.enter().append("circle")
			.attr("r", (d) => {
				return get_node_radius_for_matches(d);
			})
			.attr("cx", (d,i) => width*(i*legend_circle_x_gap + legend_circle_x))
			.attr("cy", height*(legend_y_placement+0.06))
			.attr("fill", "#888")

		svg.select("g.titles").selectAll("text.scale")
			.data(legend_circle_matches)
			.enter().append("text")
			.classed("legend", true)
			.classed("scale", true)
			.text( (d) => d )
			.attr("x", (d,i) => width*(i*legend_circle_x_gap + legend_circle_x))
			.attr("y", height*(legend_y_placement+0.12))



		//legend - colour 
		svg.select("g.titles").append("text")
			.classed("legend", true)
			.text("Circle colour shows win percentage")
			.attr("x", width*(title_line_pos+0.02))
			.attr("y", height*(legend_y_placement+0.17))
			
		let legend_circle_wins = [0,0.2,0.4, 0.6, 0.8]
		svg.select("g.titles").selectAll("circle.wins")
			.data(legend_circle_wins)
			.enter().append("circle")
			.attr("r", 20)
			.attr("cx", (d,i) => width*(i*legend_circle_x_gap + legend_circle_x))
			.attr("cy", height*(legend_y_placement+0.22))
			.attr("fill", color)

		svg.select("g.titles").selectAll("text.wins")
			.data(legend_circle_wins)
			.enter().append("text")
			.classed("legend", true)
			.classed("scale", true)
			.text( (d) => d*100 + " %" )
			.attr("x", (d,i) => width*(i*legend_circle_x_gap + legend_circle_x))
			.attr("y", height*(legend_y_placement+0.27))


		// details 
		const detail_y_placement = 0.4
		const line_gap = 0.03
		svg.select("g.details").append("text")
			// .classed("detail", true)
			.classed("detail_label", true)
			.text("Team")
			.attr("x", width*this.legend_middle_x)
			.attr("y", height*(detail_y_placement))

		svg.select("g.details").append("text")
			// .classed("detail", true)
			.classed("detail_label", true)
			.text("Years Competed")
			.attr("x", width*this.legend_middle_x)
			.attr("y", height*(detail_y_placement+line_gap))
		svg.select("g.details").append("text")
			.classed("detail_label", true)
			.text("Trophies")
			.attr("x", width*this.legend_middle_x)
			.attr("y", height*(detail_y_placement+2*line_gap))
		svg.select("g.details").append("text")
			// .classed("detail", true)
			.classed("detail_label", true)
			.text("Matches")
			.attr("x", width*this.legend_middle_x)
			.attr("y", height*(detail_y_placement+3*line_gap))
		svg.select("g.details").append("text")
			// .classed("detail", true)
			.classed("detail_label", true)
			.text("Wins")
			.attr("x", width*this.legend_middle_x)
			.attr("y", height*(detail_y_placement+4*line_gap))




		// styling

		svg.select("g.titles")
			.append("rect")
			.attr("x", width * title_line_pos)
			.attr("y", 0)
			.attr("width", width * 0.001)
			.attr("height", height * 0.9)
			.style("fill","#83bbd9")

		this.last_selected = -1
		this.show_opponents(this.nodes[0])

	}

	show_opponents (target_node){

		// stop simulation so that positions can be moved
		// this.simulation.stop();


		// console.log(target_node)

		const selected_team_idx = target_node.id;

		// filter links to get teams that are connected with the target team
		let active_links = this.links.filter( function(link)  {
			var prototype = Object.getPrototypeOf(link);
			return Number(prototype.source) == selected_team_idx || Number(prototype.target) == selected_team_idx;
		});

		const num_linked_teams = active_links.length;

		// console.log(num_linked_teams)

		// sort in descending order of weights - so most played against teams are added first
		active_links.sort(function (a,b) {
			return b.weight - a.weight;
		})

		console.log(active_links)

		// calculate positions for linked teams - distribute radially around centre team
		var degree_per_team = 2.0 * Math.PI / num_linked_teams;

		var locations = Array(this.nodes.length).fill([0,0]);


		var text_locations = Array(this.nodes.length).fill([0,0]);
		var angles = Array(this.nodes.length).fill(0);
		var opacities = Array(this.nodes.length).fill(0);

		//target team at centre
		locations[selected_team_idx] = [this.center[0],this.center[1]];
		text_locations[selected_team_idx] = [this.center[0],this.center[1]];
		opacities[selected_team_idx] = 1.0

		var weight_to_radius = d3.scaleLinear()
						.domain([1,20])
						.range([this.width*0.1,this.width*0.4]);

		active_links.forEach( (link, i) => {

			// get non target team
			let team_id = link.source;
			if (team_id == selected_team_idx ) {team_id = link.target;}

			// calculate final position according to degree and weight
			// TODO check this angle calculation
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




		// here - update opacity of nodes 
		d3.select("g.nodes")
			.selectAll("circle")
			// .transition()
			// .duration(100)
			// 	.style("opacity", 0)


		// here - update positions of nodes 
		// d3.select("g.nodes")
			// .selectAll("circle")
			// .transition()
			// .duration(10)
				.attr("cx", (d,i) => locations[i][0])
				.attr("cy", (d,i) => locations[i][1])
				// .style("opacity", (d,i) =>  
				// 	// {return hide_elements_without_location(d,i,locations);} )
				// 	{return opacities[i];})


		// here - update opacity of nodes 
		// d3.select("g.nodes")
		// 	.selectAll("circle")
			// .transition()
			// .duration(100)
				.style("opacity", (d,i) =>  
					{return opacities[i];})

			
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
		  		


		//add labels
		// d3.selectAll("text").remove();
		// d3.select("g.nodes")
		// 	.selectAll("circle")
		// 			// this.node_enter
		// 		.append("text")
		// 		.classed("label", true)
		// 		.text(d => d.name)
		// 	    .attr("x", d => d.x)
		// 	    .attr("y", d => d.y);

			// .attr("x", (d,i) => locations[i][0])
			// .attr("y", (d,i) => locations[i][1])
			// .attr("rotate",90)
			// .attr("x", 0)
			// .attr("y", 0)

		let label_width = (this.nodes[selected_team_idx].name).length * 10;
		let label_height = this.height * 0.025;
		let label_y = this.center[1] + get_node_radius_for_matches( this.nodes[selected_team_idx].matches )*1.25;


		// add label for highlighted team
		d3.select("g.rects").selectAll("rect").remove();
		d3.select("g.rects").append("rect")
			.classed("label_bg", true)
			.attr("x", this.center[0] - label_width/2)
			.attr("y", label_y)
			.attr("width", label_width)
			.attr("height", label_height)


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
					if (i == selected_team_idx){
						ang = 0;
						loc[1] = (label_y+(label_height*0.75) 	);
					}
					if (ang > 90 && ang < 270) {
						ang = (ang + 180) % 360;
					}

					return "translate(" + loc[0] + "," + loc[1] + ") rotate(" + ang + ")";})
			.style("opacity", (d,i) =>  
					{return opacities[i];})
				// {return hide_elements_without_location(d,i,locations);} )
			.style("text-anchor", (d,i) => {
				if (i == selected_team_idx){
					return "middle";
				}
				else if (angles[i] > 90 && angles[i] < 270){
					return "start"
				}
				else {
					return "end"
				}

			})
			.classed("selected", (d,i) => {return (i == selected_team_idx);})


			// details 

			d3.select("g.details").selectAll("text.detail").remove();


			const detail_y_placement = 0.4
			const line_gap = 0.03
			d3.select("g.details").append("text")
				.classed("detail", true)
				.text(this.nodes[selected_team_idx].name)
				.attr("x", this.width*(this.legend_middle_x+0.01))
				.attr("y", this.height*(detail_y_placement))
			d3.select("g.details").append("text")
				.classed("detail", true)
				.text(this.nodes[selected_team_idx].years)
				.attr("x", this.width*(this.legend_middle_x+0.01))
				.attr("y", this.height*(detail_y_placement+line_gap))
			d3.select("g.details").append("text")
				.classed("detail", true)
				.text(this.nodes[selected_team_idx].trophies)
				.attr("x", this.width*(this.legend_middle_x+0.01))
				.attr("y", this.height*(detail_y_placement+2*line_gap))
			d3.select("g.details").append("text")
				.classed("detail", true)
				.text(this.nodes[selected_team_idx].matches)
				.attr("x", this.width*(this.legend_middle_x+0.01))
				.attr("y", this.height*(detail_y_placement+3*line_gap))
			d3.select("g.details").append("text")
				.classed("detail", true)
				.text((this.nodes[selected_team_idx].win_pc * 100).toFixed(0) + " %")
				.attr("x", this.width*(this.legend_middle_x+0.01))
				.attr("y", this.height*(detail_y_placement+4*line_gap))

	}



	show_details (target_node){



		const selected_team_idx = target_node.id;


		// d3.select("g.details").selectAll("text").attr("opacity",1);


	}

	hide_details(target_node){

		// d3.select("g.details").selectAll("text").attr("opacity",0);
	}


}