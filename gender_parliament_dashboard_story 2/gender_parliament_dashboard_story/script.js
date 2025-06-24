d3.csv("data_gender_parliament.csv").then(data => {
  // Animasi loading
  const loadingAnimation = d3.select("body")
    .append("div")
    .attr("class", "loading")
    .style("position", "fixed")
    .style("top", "0")
    .style("left", "0")
    .style("width", "100%")
    .style("height", "100%")
    .style("background", "rgba(255,255,255,0.9)")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("z-index", "1000")
    .html("<div style='text-align:center;'><h2>Loading Data...</h2><p>Preparing visualizations</p></div>");
    drawHeatmap(data);
  // Parse data
  data.forEach(d => {
    d.Year = +d.Year;
    d.Value = +d.Value;
  });

  // Hapus animasi loading setelah data diproses
  setTimeout(() => {
    loadingAnimation.transition()
      .duration(500)
      .style("opacity", 0)
      .remove();
  }, 800);

  const countries = [...new Set(data.map(d => d.Country))];

  // Tambahkan opsi default
  d3.select("#countrySelect").append("option")
    .text("Select a country")
    .attr("value", "")
    .attr("disabled", true)
    .attr("selected", true);

  // Populate country dropdown with animation
  d3.select("#countrySelect").selectAll("option.country-option")
    .data(countries).enter()
    .append("option")
    .attr("class", "country-option")
    .text(d => d)
    .attr("value", d => d)
    .style("opacity", 0)
    .transition()
    .delay((d, i) => i * 20)
    .style("opacity", 1);

  function updateYearDropdown(country) {
    const filteredYears = [...new Set(data.filter(d => d.Country === country).map(d => d.Year))];
    const yearSelect = d3.select("#yearSelect");
    
    // Clear previous options with animation
    yearSelect.selectAll("option")
      .transition()
      .duration(300)
      .style("opacity", 0)
      .remove();
    
    // Add default option
    yearSelect.append("option")
      .text("Select a year")
      .attr("value", "")
      .attr("disabled", true)
      .attr("selected", true);
    
    // Add new options with animation
    yearSelect.selectAll("option.year-option")
      .data(filteredYears).enter()
      .append("option")
      .attr("class", "year-option")
      .text(d => d)
      .attr("value", d => d)
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 30)
      .style("opacity", 1);
  }

  function createTooltip() {
    // Create tooltip if it doesn't exist
    if (d3.select("#tooltip").empty()) {
      return d3.select("body").append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);
    }
    return d3.select("#tooltip");
  }

  function showTooltip(event, d, content) {
  const tooltip = createTooltip();
  tooltip.html(content)
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 30) + "px")
    .transition()
    .duration(100)
    .style("opacity", 1)
    .style("pointer-events", "none");
}

  function hideTooltip() {
  d3.select("#tooltip")
    .transition()
    .duration(100)
    .style("opacity", 0);
}

  function updateCharts() {
    const selectedCountry = d3.select("#countrySelect").node().value;
    const selectedYear = +d3.select("#yearSelect").node().value;

    if (!selectedCountry || !selectedYear) return;

    const filtered = data.filter(d => d.Country === selectedCountry);
    const yearData = data.filter(d => d.Year === selectedYear);
    const pieData = yearData.filter(d => d.Country === selectedCountry);

    // Line Chart with animations
const lineContainer = d3.select("#lineChart").html("").append("div").attr("class", "chart-container");
lineContainer.append("h2").text("Trend Over Time");
lineContainer.append("p").attr("class", "note")
  .html(`This line chart shows the yearly progression of women's parliamentary representation in <strong>${selectedCountry}</strong>. Hover over points for details.`);

// Set width and height for SVG
const svgWidth = 900;   // dari 700 jadi 900
const svgHeight = 400;  // dari 320 jadi 400
const margin = {top: 30, right: 40, bottom: 60, left: 60}; // margin lebih besar agar label tidak terpotong
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const svgLine = lineContainer.append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight)
  .style("width", "100%")
  .style("max-width", "800px")
  .style("height", "auto");

const g = svgLine.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const xL = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d.Year))
      .range([0, width]);
    
    const yL = d3.scaleLinear()
      .domain([0, Math.max(d3.max(filtered, d => d.Value), 30)])
      .range([height, 0]);

    // Add X and Y axes with animations
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xL).tickFormat(d3.format("d")))
      .attr("opacity", 0)
      .transition()
      .duration(800)
      .attr("opacity", 1);
    
    g.append("g")
      .call(d3.axisLeft(yL).ticks(5).tickFormat(d => d + "%"))
      .attr("opacity", 0)
      .transition()
      .duration(800)
      .attr("opacity", 1);

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(yL)
        .ticks(5)
        .tickSize(-width)
        .tickFormat(""));

    // Add line with animation
    const line = d3.line()
      .x(d => xL(d.Year))
      .y(d => yL(d.Value))
      .curve(d3.curveMonotoneX);

    const path = g.append("path")
      .datum(filtered)
      .attr("fill", "none")
      .attr("stroke", "#1e88e5")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Animate the line drawing
    const pathLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", pathLength + " " + pathLength)
      .attr("stroke-dashoffset", pathLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Add points with animation and enhanced tooltips
    g.selectAll(".data-point")
      .data(filtered)
      .join("circle")
      .attr("class", "data-point")
      .attr("cx", d => xL(d.Year))
      .attr("cy", d => yL(d.Value))
      .attr("r", 0)
      .attr("fill", "#1e88e5")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("r", 8)
          .attr("fill", "#0d47a1");
        
        const tooltipContent = `
          <div style="text-align:center;">
            <strong>${d.Country}</strong><br>
            <span style="font-size:1.2em;">${d.Value}%</span><br>
            <span>Year: ${d.Year}</span><br>
            <span>Period: ${d.Period}</span><br>
            <span>Level: ${d.Representation_Level}</span>
          </div>
        `;
        
        showTooltip(event, d, tooltipContent);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("r", 5)
          .attr("fill", "#1e88e5");
        
        hideTooltip();
      })
      .transition()
      .delay((d, i) => i * 50)
      .duration(500)
      .attr("r", 5);

    // Bar Chart with animations
    const barContainer = d3.select("#barChart").html("").append("div").attr("class", "chart-container");
    barContainer.append("h2").text("Cross-country Comparison");
    barContainer.append("p").attr("class", "note")
      .html(`Compare the performance of each country in <strong>${selectedYear}</strong>. Hover over bars for details.`);
    
    const svgBar = barContainer.append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .style("width", "100%")
      .style("max-width", "800px")
      .style("height", "auto");

    const gBar = svgBar.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Sort countries by value for better visualization
    const sortedYearData = [...yearData].sort((a, b) => a.Value - b.Value);
    
    const x = d3.scaleBand()
      .domain(sortedYearData.map(d => d.Country))
      .range([0, width])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, Math.max(d3.max(yearData, d => d.Value), 30)])
      .range([height, 0]);

    // Add X and Y axes with animations
    gBar.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .attr("opacity", 0)
      .transition()
      .duration(800)
      .attr("opacity", 1)
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");
    
    gBar.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
      .attr("opacity", 0)
      .transition()
      .duration(800)
      .attr("opacity", 1);

    // Add grid lines
    gBar.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width)
        .tickFormat(""));

    // Add bars with animation and enhanced tooltips
    gBar.selectAll(".bar")
      .data(sortedYearData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.Country))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", d => d.Country === selectedCountry ? "#0d47a1" : "#43a047")
      .attr("rx", 4)
      .attr("ry", 4)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("fill", d.Country === selectedCountry ? "#1565c0" : "#2e7d32")
          .attr("opacity", 0.9);
        
        const tooltipContent = `
          <div style="text-align:center;">
            <strong>${d.Country}</strong><br>
            <span style="font-size:1.2em;">${d.Value}%</span><br>
            <span>Year: ${d.Year}</span><br>
            <span>Level: ${d.Representation_Level}</span>
          </div>
        `;
        
        showTooltip(event, d, tooltipContent);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("fill", d.Country === selectedCountry ? "#0d47a1" : "#43a047")
          .attr("opacity", 1);
        
        hideTooltip();
      })
      .transition()
      .delay((d, i) => i * 50)
      .duration(800)
      .attr("y", d => y(d.Value))
      .attr("height", d => height - y(d.Value));

    // Donut Chart with animations
    const pieContainer = d3.select("#pieChart").html("").append("div").attr("class", "chart-container");
    pieContainer.append("h2").text("Representation Level");
    pieContainer.append("p").attr("class", "note")
      .html(`This chart illustrates the classification of gender representation for <strong>${selectedCountry}</strong> in <strong>${selectedYear}</strong>.`);

    const repCounts = d3.rollups(pieData, v => v.length, d => d.Representation_Level)
      .map(([label, value]) => ({ label, value }));

    if (repCounts.length === 0) {
      pieContainer.append("p")
        .style("text-align", "center")
        .style("padding", "2rem")
        .style("color", "#666")
        .text("No representation level data available for this selection.");
      return;
    }

    const pieSvg = pieContainer.append("svg")
      .attr("width", 400)
      .attr("height", 300);
    
    const pieG = pieSvg.append("g")
      .attr("transform", "translate(200,150)");

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(60).outerRadius(100);
    const labelArc = d3.arc().innerRadius(105).outerRadius(105);
    
    // Enhanced color scheme based on representation level
    const colorMap = {
      "<10% (Low)": "#e57373", // Red for low
      "10-20% (Medium)": "#ffb74d", // Orange for medium
      ">20% (High)": "#81c784" // Green for high
    };
    
    const color = d => colorMap[d.label] || d3.schemeSet2[0];

    // Add slices with animation and enhanced tooltips
    const slices = pieG.selectAll(".arc")
      .data(pie(repCounts))
      .join("g")
      .attr("class", "arc");

    slices.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("transform", "scale(1.05)")
          .style("opacity", 0.9);
        
        const tooltipContent = `
          <div style="text-align:center;">
            <strong>${d.data.label}</strong><br>
            <span style="font-size:1.2em;">${d.data.value} countries</span><br>
            <span>${((d.data.value / d3.sum(repCounts, d => d.value)) * 100).toFixed(1)}%</span>
          </div>
        `;
        
        showTooltip(event, d, tooltipContent);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("transform", "scale(1)")
          .style("opacity", 1);
        
        hideTooltip();
      })
      .transition()
      .duration(800)
      .style("opacity", 1);

    // Add percentage in the center for single value
    if (repCounts.length === 1) {
      pieG.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.2em")
        .attr("font-size", "16px")
        .attr("fill", "#333")
        .text(repCounts[0].label);
      
      pieG.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.2em")
        .attr("font-size", "22px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text("100%");
    } else {
      // Add labels with animation
      slices.append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#333")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .style("opacity", 0)
        .text(d => d.data.label)
        .transition()
        .delay(800)
        .duration(500)
        .style("opacity", 1);
    }

    // Update auto insights
    updateAutoInsight(filtered, selectedCountry, selectedYear);

    drawHeatmap(data); // Panggil fungsi heatmap setelah grafik lainnya
  }

  // Event listeners for dropdowns
  d3.select("#countrySelect").on("change", () => {
    const selectedCountry = d3.select("#countrySelect").node().value;
    if (selectedCountry) {
      updateYearDropdown(selectedCountry);
      updateCharts();
    }
  });

  d3.select("#yearSelect").on("change", updateCharts);

  // Initialize with first country
  if (countries.length > 0) {
    d3.select("#countrySelect").node().value = countries[0];
    updateYearDropdown(countries[0]);
    updateCharts();
  }

  // Add scroll animation for insights section
  const insightItems = document.querySelectorAll('ol li');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  insightItems.forEach((item, index) => {
    item.style.opacity = 0;
    item.style.transform = 'translateY(20px)';
    item.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
    observer.observe(item);
  });

  // Fade-in animation for background section
  const bgSection = document.getElementById('backgroundSection');
  if (bgSection) {
    bgSection.style.opacity = 0;
    bgSection.style.transform = 'translateY(30px)';
    setTimeout(() => {
      bgSection.style.transition = 'opacity 1s cubic-bezier(.4,0,.2,1), transform 1s cubic-bezier(.4,0,.2,1)';
      bgSection.style.opacity = 1;
      bgSection.style.transform = 'translateY(0)';
    }, 300);
  }
});

function drawHeatmap(data) {
  const years = [...new Set(data.map(d => d.Year))];
  const countries = [...new Set(data.map(d => d.Country))];

  const cellSize = 28;
  const margin = {top: 60, right: 30, bottom: 60, left: 140};
  const width = cellSize * years.length + margin.left + margin.right;
  const height = cellSize * countries.length + margin.top + margin.bottom;

  d3.select("#heatmapChart").html("");

  // Card style wrapper
  const card = d3.select("#heatmapChart")
    .append("div")
    .style("background", "#fff")
    .style("border-radius", "18px")
    .style("box-shadow", "0 4px 32px rgba(25,118,210,0.10)")
    .style("padding", "2.5rem 2rem 2.5rem 2rem")
    .style("overflow-x", "auto")
    .style("display", "inline-block");

  card.append("h2")
    .style("margin-bottom", "1.5rem")
    .style("color", "#1976d2")
    .style("font-size", "2rem")
    .style("font-weight", "700")
    .text("Heatmap: Representation Over Time");

  const svg = card.append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#f8fbff")
    .style("border-radius", "12px")
    .style("box-shadow", "0 2px 16px rgba(25,118,210,0.06)");

  // Skala warna
  const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
    .domain([0, d3.max(data, d => +d.Value)]);

  // Negara (Y axis)
  svg.selectAll(".countryLabel")
    .data(countries)
    .enter()
    .append("text")
    .attr("x", margin.left - 12)
    .attr("y", (d, i) => margin.top + i * cellSize + cellSize / 1.6)
    .attr("text-anchor", "end")
    .attr("font-size", "1.08rem")
    .attr("fill", "#1976d2")
    .attr("font-weight", 600)
    .text(d => d);

  // Tahun (X axis)
  svg.selectAll(".yearLabel")
  .data(years)
  .enter()
  .append("text")
  .attr("x", (d, i) => margin.left + i * cellSize + cellSize / 2 + 10)
  .attr("y", margin.top - 22) // lebih dekat ke cell
  .attr("text-anchor", "middle") // tengah
  .attr("font-size", "1.05rem")
  .attr("fill", "#1976d2")
  .attr("font-weight", 500)
  .attr("transform", (d, i) => `rotate(-45,${margin.left + i * cellSize + (cellSize - 3) / 2},${margin.top - 22})`)
    .text((d, i) => (i % 2 === 0 ? d : "")) // hanya tampilkan tahun genap

  // Cell
  svg.selectAll(".row")
    .data(countries)
    .enter()
    .append("g")
    .attr("class", "row")
    .attr("transform", (d, i) => `translate(0,${margin.top + i * cellSize})`)
    .each(function(country, rowIdx) {
      d3.select(this).selectAll(".cell")
        .data(years)
        .enter()
        .append("rect")
        .attr("x", (d, colIdx) => margin.left + colIdx * cellSize)
        .attr("width", cellSize - 3)
        .attr("height", cellSize - 3)
        .attr("rx", 7)
        .attr("ry", 7)
        .attr("fill", year => {
          const found = data.find(e => e.Country === country && e.Year === year);
          return found ? colorScale(+found.Value) : "#f0f4fa";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, year) {
          const found = data.find(e => e.Country === country && e.Year === year);
          d3.select(this)
            .attr("stroke", "#1976d2")
            .attr("stroke-width", 3)
            .attr("filter", "drop-shadow(0 0 8px #1976d2aa)");
          if (found) {
            const [x, y] = d3.pointer(event, svg.node());
            d3.select("#heatmapChart").append("div")
              .attr("class", "heatmap-tooltip")
              .style("position", "absolute")
              .style("left", `${x + 60}px`)
              .style("top", `${y + 30}px`)
              .style("background", "#fff")
              .style("border", "1.5px solid #1976d2")
              .style("padding", "8px 16px")
              .style("border-radius", "10px")
              .style("pointer-events", "none")
              .style("font-size", "1.05rem")
              .style("color", "#1976d2")
              .style("box-shadow", "0 4px 16px rgba(25,118,210,0.10)")
              .html(`<strong>${country}</strong><br>Year: ${year}<br>Value: <b>${found.Value}%</b>`);
          }
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("filter", null);
          d3.select("#heatmapChart").selectAll(".heatmap-tooltip").remove();
        });
    });

  // Legend
  const legendWidth = 160;
  const legendHeight = 14;
  const legendSvg = card.append("svg")
    .attr("width", legendWidth + 60)
    .attr("height", 40)
    .style("margin-top", "18px");

  // Gradient
  const defs = legendSvg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "heatmap-gradient");
  linearGradient.selectAll("stop")
    .data([
      {offset: "0%", color: colorScale.range()[0]},
      {offset: "100%", color: colorScale.range()[1]}
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  legendSvg.append("rect")
    .attr("x", 30)
    .attr("y", 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#heatmap-gradient)")
    .attr("rx", 6);

  // Legend label
  legendSvg.append("text")
    .attr("x", 30)
    .attr("y", 35)
    .attr("text-anchor", "start")
    .attr("font-size", "0.95rem")
    .attr("fill", "#1976d2")
    .text("0%");

  legendSvg.append("text")
    .attr("x", 30 + legendWidth)
    .attr("y", 35)
    .attr("text-anchor", "end")
    .attr("font-size", "0.95rem")
    .attr("fill", "#1976d2")
    .text(`${Math.round(colorScale.domain()[1])}%`);

  legendSvg.append("text")
    .attr("x", 30 + legendWidth / 2)
    .attr("y", 35)
    .attr("text-anchor", "middle")
    .attr("font-size", "0.95rem")
    .attr("fill", "#1976d2")
    .text("Higher");
}

const imageList = [
  "12.jpeg",
  "11.jpeg",
  "1.jpeg",
  "2.jpeg",
  "3.jpeg",
  "4.jpeg",
  "5.jpeg",
  "6.jpeg",
  "7.jpeg",
  "8.jpeg",
  "9.jpeg",
  "10.jpeg",
  "13.jpeg",
  "14.jpeg",
  "15.jpeg"
  // Tambahkan nama file gambar lain di folder /image
];

const popupPositions = [
  { left: '2%',  top: '8%'  }, // kiri atas
  { left: '2%',  top: '45%' }, // kiri tengah
  { left: '2%',  top: '82%' }, // kiri bawah
  { left: '82%', top: '8%'  }, // kanan atas
  { left: '82%', top: '45%' }, // kanan tengah
  { left: '82%', top: '82%' }  // kanan bawah
];
let occupied = [false, false, false, false, false, false];

function popupRandomImage() {
  const bg = document.querySelector('.interactive-bg');
  if (!bg) return;

  const available = popupPositions
    .map((pos, idx) => ({ pos, idx }))
    .filter((_, idx) => !occupied[idx]);
  if (available.length === 0) return;

  const { pos, idx } = available[Math.floor(Math.random() * available.length)];
  occupied[idx] = true;

  const img = document.createElement('img');
  const file = imageList[Math.floor(Math.random() * imageList.length)];
  img.src = `image/${file}`;
  img.style.position = 'absolute';
  img.style.width = '370px';
  img.style.opacity = 0;
  img.style.left = pos.left;
  img.style.top = pos.top;
  // Mulai dari scale kecil dan rotasi acak
  const rot = (Math.random() - 0.5) * 18; // -9deg sampai +9deg
  img.style.transform = `scale(0.7) rotate(${rot}deg)`;
  img.style.transition = 'transform 1.2s cubic-bezier(.4,0,.2,1), opacity 1.2s';
  img.style.filter = 'drop-shadow(0 2px 12px #1976d244)';
  bg.appendChild(img);

  // Fade-in dan scale ke normal
  setTimeout(() => {
    img.style.opacity = 0.22;
    img.style.transform = `scale(1.1) rotate(${rot}deg)`;
  }, 60);

  // Fade-out dan scale lebih besar sebelum hilang
  setTimeout(() => {
    img.style.opacity = 0;
    img.style.transform = `scale(1.5) rotate(${rot}deg)`;
    setTimeout(() => {
      img.remove();
      occupied[idx] = false;
    }, 1200);
  }, 3400 + Math.random() * 900); // bertahan 3-4 detik
}

// Munculkan gambar popup setiap 1200ms (lebih cepat)
setInterval(popupRandomImage, 1200);

function updateAutoInsight(filteredData, selectedCountry, selectedYear) {
  const el = document.getElementById('autoInsightText');
  if (!el) return;

  if (!filteredData.length) {
    el.textContent = "No data available for the selected filter.";
    return;
  }

  // Contoh insight: nilai tertinggi, terendah, rata-rata, tren
  const values = filteredData.map(d => +d.Value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);

  let trend = "";
  if (filteredData.length > 1) {
    const first = +filteredData[0].Value;
    const last = +filteredData[filteredData.length - 1].Value;
    if (last > first) trend = "an upward trend";
    else if (last < first) trend = "a downward trend";
    else trend = "a flat trend";
  }

  el.innerHTML = `
    <strong>${selectedCountry ? selectedCountry : "All Countries"}</strong> from <strong>${filteredData[0].Year}</strong> to <strong>${filteredData[filteredData.length-1].Year}</strong>:<br>
    Highest: <span class="highlight-blue">${max}%</span>, Lowest: <span class="highlight-blue">${min}%</span>, Average: <span class="highlight-blue">${avg}%</span>.<br>
    The data shows <strong>${trend}</strong> in women's parliamentary representation.
  `;
}

// Panggil fungsi ini setiap kali filter berubah, misal:
// updateAutoInsight(filteredData, selectedCountry, selectedYear);