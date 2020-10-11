import * as Network from './CLNetwork.js';

export function draw_titles(svg, width, height, color, title_line_pos, legend_middle_x) {


		svg.append("g").classed("titles", true)
		
		// titles
		svg.select("g.titles").append("text")
			.classed("title", true)
			.text("Champions League")
			// .attr("x", width*0.01)
			.attr("x", width*legend_middle_x)
			// .attr("x", width*(title_line_pos + 0.02))
			.attr("y", height*0.1)


					// subtitle
		svg.select("g.titles").append("text")
			.classed("subtitle", true)
			.attr("x", width*legend_middle_x)
			// .attr("x", width*(title_line_pos + 0.02))
			.attr("y", height*0.15)
			.text("All top-level European encounters")

							// subtitle
		svg.select("g.titles").append("text")
			.classed("subtitle", true)
			.attr("x", width*legend_middle_x)
			// .attr("x", width*(title_line_pos + 0.02))
			.attr("y", height*0.175)
			.text("since 1992 - visualised.")


		const legend_y_placement = 0.6

		const legend_circle_x = 0.78
		const size_legend_circle_x_gap = 0.055

		// legend - size
		svg.select("g.titles").append("text")
			.classed("legend", true)
			.text("Circle size shows number of matches played")
			.attr("x", width*legend_middle_x)
			// .attr("x", width*(title_line_pos+0.02))
			.attr("y", height*legend_y_placement)

		let legend_circle_matches = [1, 50, 100, 150]
		svg.select("g.titles").selectAll("circle.matches")
			.data(legend_circle_matches)
			.enter().append("circle")
			.attr("r", (d) => {
				return Network.get_node_radius_for_matches(d, height);
			})
			.attr("cx", (d,i) => width*(i*size_legend_circle_x_gap + legend_circle_x))
			.attr("cy", height*(legend_y_placement+0.06))
			.attr("fill", "#888")

		svg.select("g.titles").selectAll("text.scale")
			.data(legend_circle_matches)
			.enter().append("text")
			.classed("legend", true)
			.classed("scale", true)
			.text( (d) => d )
			.attr("x", (d,i) => width*(i*size_legend_circle_x_gap + legend_circle_x))
			.attr("y", height*(legend_y_placement+0.13))

		const legend_circle_x_gap = 0.04525


		const win_legend_start_y = 0.19

		//legend - colour 
		svg.select("g.titles").append("text")
			.classed("legend", true)
			.text("Circle colour shows win percentage")
			// .attr("x", width*(title_line_pos+0.02))
			.attr("x", width*legend_middle_x)
			.attr("y", height*(legend_y_placement+win_legend_start_y))
			
		let legend_circle_wins = [0,0.2,0.4, 0.6, 0.8]
		svg.select("g.titles").selectAll("circle.wins")
			.data(legend_circle_wins)
			.enter().append("circle")
			.attr("r", 20)
			.attr("cx", (d,i) => width*(i*legend_circle_x_gap + legend_circle_x))
			.attr("cy", height*(legend_y_placement+win_legend_start_y+0.05))
			.attr("fill", color)

		svg.select("g.titles").selectAll("text.wins")
			.data(legend_circle_wins)
			.enter().append("text")
			.classed("legend", true)
			.classed("scale", true)
			.text( (d) => d*100 + " %" )
			.attr("x", (d,i) => width*(i*legend_circle_x_gap + legend_circle_x))
			.attr("y", height*(legend_y_placement+win_legend_start_y+0.1))


				// styling

		svg.select("g.titles")
			.append("rect")
			.attr("x", width * title_line_pos)
			.attr("y", 0)
			.attr("width", width * 0.001)
			.attr("height", height * 0.9)
			.style("fill","#83bbd9")
}