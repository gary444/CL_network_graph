import * as d3 from './modules/d3.min.js';


const detail_y_placement = 0.25
const match_detail_y_placement = 0.4
const line_gap = 0.03
		
export function add_detail_text(svg,width, height, title_line_pos, legend_middle_x){

	// details 
	legend_middle_x = 1.0 - ((1.0-title_line_pos) * 0.5) - 0.01

	svg.append("g").classed("details", true)

	let text_labels = ["Team", "Years Competed", "Trophies", "Matches", "Wins"]

	// d3.select("g.details").selectAll("text.detail").remove();
	d3.select("g.details").selectAll("text.detail")
		.data(text_labels).enter().append("text")
		.classed("detail_label", true)
		.text( (d) => d )
		.attr("x", width*legend_middle_x)
		.attr("y", (d,i) => {
			return height*(detail_y_placement+ (i)*line_gap );
		})


	let link_labels = ["Opponent", "Meetings", "Wins", "Draws", "Losses"]

	d3.select("g.details").selectAll("text.link_detail_label")
		.data(link_labels).enter().append("text")
		.classed("detail_label", true)
		.classed("link_detail_label", true)
		.text( (d) => d )
		.attr("x", width*legend_middle_x)
		.attr("y", (d,i) => {
			return height*(match_detail_y_placement+ (i+1)*line_gap );
		})

}

export function update_details_for_team(width, height, nodes, selected_team_idx, legend_middle_x) {

	let text_labels = [nodes[selected_team_idx].name,
					nodes[selected_team_idx].years,
					nodes[selected_team_idx].trophies,
					nodes[selected_team_idx].matches,
					(nodes[selected_team_idx].win_pc * 100).toFixed(0) + " %"
					]

	d3.select("g.details").selectAll("text.detail").remove();
	d3.select("g.details").selectAll("text.detail")
		.data(text_labels).enter().append("text")
		.classed("detail", true)
		.text( (d) => d )
		.attr("x", width*(legend_middle_x+0.01))
		.attr("y", (d,i) => {
			return height*(detail_y_placement+ (i)*line_gap );
		})

}

export function update_match_details_for_link(width, height, link, nodes, selected_team_idx, legend_middle_x) {



	let opponent_idx = link.source;
	let wins = link.source_wins;
	let draws = link.draws;
	let losses = link.target_wins;

	if (opponent_idx == selected_team_idx){
		opponent_idx = link.target;	
		wins = link.target_wins;
		losses = link.source_wins;
	} 

	let text_labels = [nodes[opponent_idx].name,
						Number(link.weight),
						Number(wins),
						Number(draws),
						Number(losses)
						]

	d3.select("g.details").selectAll("text.link_detail").remove();
	d3.select("g.details").selectAll("text.link_detail")
		.data(text_labels).enter().append("text")
		.classed("link_detail", true)
		.text( (d) => d )
		.attr("x", width*(legend_middle_x+0.01))
		.attr("y", (d,i) => {
			return height*(match_detail_y_placement+ (i+1)*line_gap );
		})

	let pc_text_labels = ["","",
					"(" + (wins / link.weight * 100).toFixed(0) + " %)",
					"(" + (draws / link.weight * 100).toFixed(0) + " %)",
					"(" + (losses / link.weight * 100).toFixed(0) + " %)",
					]

	d3.select("g.details").selectAll("text.pc_link_detail").remove();
	d3.select("g.details").selectAll("text.pc_link_detail")
		.data(pc_text_labels).enter().append("text")
		// .classed("link_detail", true)
		.classed("pc_link_detail", true)
		.text( (d) => d )
		.attr("x", width*(legend_middle_x+0.03))
		.attr("y", (d,i) => {
			return height*(match_detail_y_placement+ (i+1)*line_gap );
		})

}



export function remove_link_details(){
	d3.select("g.details").selectAll("text.link_detail").remove();
	d3.select("g.details").selectAll("text.pc_link_detail").remove();
}