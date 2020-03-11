const URL = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"

d3.json(URL).then( (data) => drawGraph(data)); //use a promise!

function drawGraph(dataset) {
	// console.log(dataset);
	const width = 1600;
	const height = 600;
	const padding = 100; //find some other solution for the next one! maybe padding top/right/bottom/left and then add them in, too much empty space this way!

	dataset.monthlyVariance.forEach( (d) => d.month -= 1) //changes months from 1 - 12 to 0 - 11

	let monthlyVarianceArr = dataset.monthlyVariance.map( (d) => d.variance);
	let maxTempVariance = d3.max(monthlyVarianceArr)
	let minTempVariance = d3.min(monthlyVarianceArr)
	let months = [...new Set(dataset.monthlyVariance.map( (d) => d.month))]

	let yearsArr = dataset.monthlyVariance.map( (d) => d.year);
	// yearsArr = yearsArr.filter( (d, i) => yearsArr.indexOf(d) === i); //if duplicates, indexOf(d) won't be the same as i
	yearsArr = [...new Set(yearsArr)] // seems easier! :D
	let maxYear = d3.max(yearsArr);
	let minYear = d3.min(yearsArr);

	let cellWidth = (width - 2* padding)/yearsArr.length;
	let cellHeight = (height - 2*padding)/months.length;

	let xScale = d3.scaleLinear()
		.domain(d3.extent(yearsArr))
		.range([padding, width-padding])

	let yScale = d3.scaleLinear()
		.domain(d3.extent(months))
		.range([padding, height-padding-cellHeight])

	let colorScale = d3.scaleLinear()
		.domain([minTempVariance, 0, maxTempVariance*0.6, maxTempVariance])
		.range(["blue", "yellow", "red", "darkred"])

	let xAxis = d3.axisBottom(xScale)
			.tickFormat(d3.format("d"))
			.ticks(30)
			.tickSizeOuter(0)

	let monthName = function(num) {
		var date = new Date(0);
	  date.setUTCMonth(num);
	  return d3.timeFormat("%B")(date);
  }

	let yAxis = d3.axisLeft(yScale)
			.tickFormat(monthName)
			.tickSizeOuter(0)

	// DRAWING START
	let section = d3.select("body")
		.append("section")

	// HEADING - TITLE + DESCRIPTION
	let heading = d3.select("section")
		.append("heading")

	heading
		.append("h1")
			.attr("id", "title")
			.text("Monthly Global Land-Surface Temperature")

	heading
		.append("h2")
			.style("font-size", "17px")
			.attr("id", "description")
			.text(`Between ${minYear} and ${maxYear}. Base Temperature is ${dataset.baseTemperature}°C.`)
	// END HEADING

	// SVG MAP DRAWING
	let svg = d3.select("section")
		.append("svg")
			.attr("width", width)
			.attr("height", height)
			.style("background-color", "#222")

	svg
		.append("g")
			.attr("transform", `translate(0, ${height-padding})`)
			.attr("id", "x-axis")
		.call(xAxis)
		.selectAll("text")
			.style("font-size", "1.2em")

	let yAxisGroup = svg
		.append("g")
			.attr("transform", `translate(${padding}, 0)`)
			.attr("id", "y-axis")
		.call(yAxis)
		.selectAll("line, text")
			.attr("transform", `translate(0, ${cellHeight/2})`)
			.style("font-size", "1.2em")

	svg
		.selectAll(".cell")
		.data(dataset.monthlyVariance)
		.enter()
		.append("rect")
			.classed("cell", true)
			.attr("width", cellWidth)
			.attr("height", cellHeight)
			.attr("data-month", (d) => d.month)
			.attr("data-year", (d) => d.year)
			.attr("data-temp", (d) => d.variance)
			.attr("fill", (d) => colorScale(d.variance))
			.attr("x", (d) => xScale(d.year))
			.attr("y", (d) => yScale(d.month))
			.on("mouseenter", handleMouseOver)
			.on("mousemove", handleMouseMove)
			.on("mouseout", handleMouseOut)
	// END DRAWING

	// START LEGEND		
	let legendWidth = 300;
	let legendHeight = 15;
	let legend = svg
		.append("g")
			.attr("id", "legend")

	let colors = legend
		.append("defs")
		.append("svg:linearGradient")
			.attr("id", "gradient")
			.attr("x1", "0%")
			.attr("x2", "100%")
			.attr("y1", "100%")
			.attr("y2", "100%")
			.attr("spreadMethod", "pad")

	colors
		.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", "blue")
			.attr("stop-opacity", 1)

	colors
		.append("stop")
			.attr("offset", "50%")
			.attr("stop-color", "yellow")
			.attr("stop-opacity", 1)

	colors
		.append("stop")
			.attr("offset", "80%")
			.attr("stop-color", "red")
			.attr("stop-opacity", 1)

	colors
		.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", "darkred")
			.attr("stop-opacity", 1)

	legend.append("rect")
			.attr("width", legendWidth)
			.attr("height", legendHeight)
			.style("fill", "url(#gradient)")
			.attr("x", padding)
			.attr("y", height-padding/2)

	let legendScale = d3.scaleLinear()
		.range([0, legendWidth/2, legendWidth])
		.domain([minTempVariance, 0, maxTempVariance])

	let legendAxis = d3.axisBottom(legendScale)
			.ticks(10)
			.tickSizeOuter(0)
			.tickFormat((d) => d>0 ? `+${d}°` : `${d}°`)

	legend.append("g")
			.attr("id", "legendAxis")
			.attr("transform", `translate(${padding},${height-padding/2+legendHeight})`)
		.call(legendAxis)
		.selectAll("text")
			.style("font-size", "1.2em")
	// END LEGEND


	// START TOOLTIP

	let tooltip = d3.select("body")
		.append("div")
			.style("opacity", 0)
			.attr("id", "tooltip")
			.style("position", "absolute")
			.style("background-color", "#333")
			.style("padding", "10px")
			.style("text-align", "left")
			.style("border-radius", "10%")

	function handleMouseOver(el) {
		tooltip
				.transition()
				.style("opacity", 0.8)
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
				.attr("data-year", el.year)
				.html(
					`Month: ${monthName(el.month)}, ${el.year}<br>
					Temperature: ${Math.round((dataset.baseTemperature+el.variance)*1000)/1000}°C<br>
					Variance: ${el.variance > 0 ? "+" + el.variance : el.variance}°C`
				)
		d3.select(this)
				.style("opacity", 0.5)
	}

	function handleMouseOut(el) {
		tooltip
				.transition()
				.style("opacity", 0)
		tooltip
				.style("left", "-1000px") //solves a bug (bug? or feature?) if you go to an element under where tooltip used to be, it wouldn't open a new one
				.style("top", "-1000px") //still in the (now invisible) tooltip, so the mouseover doesn't activate, this moves it out of the way
		d3.select(this)
				.style("opacity", 1)
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
	}

	//END TOOLTIP
}