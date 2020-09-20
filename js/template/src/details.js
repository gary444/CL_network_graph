import * as d3 from './modules/d3.min.js';


const detail_y_placement = 0.4
const line_gap = 0.03
		
export function add_detail_text(svg,width, height, title_line_pos, legend_middle_x){

	// details 
	legend_middle_x = 1.0 - ((1.0-title_line_pos) * 0.5) - 0.01

	svg.append("g").classed("details", true)


	svg.select("g.details").append("text")
		// .classed("detail", true)
		.classed("detail_label", true)
		.text("Team")
		.attr("x", width*legend_middle_x)
		.attr("y", height*(detail_y_placement))

	svg.select("g.details").append("text")
		// .classed("detail", true)
		.classed("detail_label", true)
		.text("Years Competed")
		.attr("x", width*legend_middle_x)
		.attr("y", height*(detail_y_placement+line_gap))
	svg.select("g.details").append("text")
		.classed("detail_label", true)
		.text("Trophies")
		.attr("x", width*legend_middle_x)
		.attr("y", height*(detail_y_placement+2*line_gap))
	svg.select("g.details").append("text")
		// .classed("detail", true)
		.classed("detail_label", true)
		.text("Matches")
		.attr("x", width*legend_middle_x)
		.attr("y", height*(detail_y_placement+3*line_gap))
	svg.select("g.details").append("text")
		// .classed("detail", true)
		.classed("detail_label", true)
		.text("Wins")
		.attr("x", width*legend_middle_x)
		.attr("y", height*(detail_y_placement+4*line_gap))

}

export function update_details_for_team(width, height, nodes, selected_team_idx, legend_middle_x) {


	d3.select("g.details").selectAll("text.detail").remove();

	d3.select("g.details").append("text")
		.classed("detail", true)
		.text(nodes[selected_team_idx].name)
		.attr("x", width*(legend_middle_x+0.01))
		.attr("y", height*(detail_y_placement))
	d3.select("g.details").append("text")
		.classed("detail", true)
		.text(nodes[selected_team_idx].years)
		.attr("x", width*(legend_middle_x+0.01))
		.attr("y", height*(detail_y_placement+line_gap))
	d3.select("g.details").append("text")
		.classed("detail", true)
		.text(nodes[selected_team_idx].trophies)
		.attr("x", width*(legend_middle_x+0.01))
		.attr("y", height*(detail_y_placement+2*line_gap))
	d3.select("g.details").append("text")
		.classed("detail", true)
		.text(nodes[selected_team_idx].matches)
		.attr("x", width*(legend_middle_x+0.01))
		.attr("y", height*(detail_y_placement+3*line_gap))
	d3.select("g.details").append("text")
		.classed("detail", true)
		.text((nodes[selected_team_idx].win_pc * 100).toFixed(0) + " %")
		.attr("x", width*(legend_middle_x+0.01))
		.attr("y", height*(detail_y_placement+4*line_gap))

}