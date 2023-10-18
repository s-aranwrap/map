// python3 -m http.server

// Define the dimensions of the map container
const width = 640;
const height = 600;

let technologyType = "All";
let currentCountry = "All Countries";

const techTypes = new Set();
techTypes.add("All");

// Create the SVG container for the map
const svg = d3.select("#map-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Load GeoJSON data (world map)
d3.json("files/countries.geojson").then(data => {

    d3.csv("files/nuclear_startups.csv").then(csvData => {
        const numOfStartupsMap = new Map();
        csvData.forEach(d => {
            numOfStartupsMap.set()
            const country = d["Country of Origin"];
            if (numOfStartupsMap.has(country)) {
                numOfStartupsMap.set(country, numOfStartupsMap.get(country) + 1);
            } else {
                numOfStartupsMap.set(country, 1);
            }
            const types = d["Technology Type"].split("; ");
            types.forEach(type => {
                if (!techTypes.has(type)) {
                    techTypes.add(type);
                } 
            });
        });

        // select
        // Get a reference to the select element
        const selectElement = document.getElementById("types");

        // Loop through the Set and create options for each type
        techTypes.forEach(type => {
            const optionElement = document.createElement("option");
            optionElement.value = type; 
            optionElement.textContent = type; 
            selectElement.appendChild(optionElement);
        });

        selectElement.addEventListener("change", function(event) {
            const selectedValue = event.target.value;
            technologyType = selectedValue;
            updateTable(currentCountry, technologyType);
          });
        
        

    
        data.features.forEach(feature => {
          const countryName = feature.properties.ADMIN;
          feature.properties.dataValue = numOfStartupsMap.get(countryName);
        });

        //  projection for mapping GeoJSON to SVG
        const projection = d3.geoMercator()
            .fitSize([width, height], data);

        // path generator
        const pathGenerator = d3.geoPath().projection(projection);

        data.features.forEach(feature => {
            const countryName = feature.properties.ADMIN;
            if (numOfStartupsMap.has(countryName)) {
                feature.properties.dataValue = numOfStartupsMap.get(countryName);
            } else {
                feature.properties.dataValue = 0;
            }
        });

        //color scale
        const baseColorScale = d3.scaleSequential()
            .domain(d3.extent(data.features, d => d.properties.dataValue))
            .interpolator(colorInterpolator); // Replace with  preferred color scale
            // .range(domd3.rgb("#8ea4ed"), d3.rgb("#4b6ee3"));

        function colorInterpolator(t) {
            const n = Math.sqrt(t);
            return d3.rgb(234-74*n, 245-5*n, 230-69*n);
        }

        const colorScale = value => {
            if (value === 0) {
              // Return your desired color for the value "0"
              return d3.rgb("#d6d6d6"); // Replace with your color
            } else {
              // Use the base color scale for other values
              return baseColorScale(value);
            }
          };

        //initialize table
        updateTable(currentCountry, technologyType);

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        function showTooltip(event, countryData) {
            const countryValue = countryData.properties.dataValue; // Access the data value
            tooltip.transition().duration(200).style("opacity", 0.9);
            console.log(countryValue);
            tooltip.html(`Number of Startups: ${countryValue}`)
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 28 + "px");
        }
        
        function hideTooltip() {
            tooltip.transition().duration(200).style("opacity", 0);
        }

        // Function to handle country clicks
        function countryClicked(event, data) {
            currentCountry = data.properties.ADMIN;
            updateTable(currentCountry, technologyType);
        }

        function updateTable(country, type) {
            const infoTable = d3.select("#info-table");
            infoTable.html(""); // Clear previous content

            let filteredData = csvData;

            if (currentCountry !== "All Countries") {
                filteredData = filteredData.filter(d => d["Country of Origin"] === country);
            }
            if (type !== "All") {
                filteredData = filteredData.filter(d => d["Technology Type"].includes(type));
            }
            
            filteredData.sort((a,b) => parseInt(b["Funding Amount ($MM USD)"].replace(/,/g, '')) - parseInt(a["Funding Amount ($MM USD)"].replace(/,/g, '')));
            filteredData.unshift({"Entity": "Entity", "Technology Type": "Technology Type", "Funding Amount ($MM USD)": "Funding Amount ($MM USD)"});
        
            //update map 
            updateMap(filteredData);
            const table = infoTable.append("table");
            table.attr("class", "table");
            const rows = table.selectAll("tr")
            .data(filteredData) 
            .enter()
            .append("tr");
        
            rows.append("td").attr("class", "column1").text(d => d["Entity"]);
            rows.append("td").attr("class", "column2").text(d => d["Technology Type"]);
            rows.append("td").attr("class", "column3").text(d => d["Funding Amount ($MM USD)"]);

            const newTable = document.querySelector(".table");
            const firstTableRow = newTable.querySelector("tr:first-child");
            firstTableRow.classList.add("table-head");
            
        }

        function updateMap(filteredData) {
            //
            const numOfStartupsMap2 = new Map();
            filteredData.forEach(d => {
                numOfStartupsMap2.set()
                const country = d["Country of Origin"];
                if (numOfStartupsMap2.has(country)) {
                    numOfStartupsMap2.set(country, numOfStartupsMap2.get(country) + 1);
                } else {
                    numOfStartupsMap2.set(country, 1);
                }
                const types = d["Technology Type"].split("; ");
                types.forEach(type => {
                    if (!techTypes.has(type)) {
                        techTypes.add(type);
                    } 
                });
            });
            data.features.forEach(feature => {
                const countryName = feature.properties.ADMIN;
                if (numOfStartupsMap2.has(countryName)) {
                    feature.properties.dataValue = numOfStartupsMap2.get(countryName);
                } else {
                    feature.properties.dataValue = 0;
                }
            });
            // console.log(data.features);
            svg.selectAll("path")
            .data(data.features)
            .enter()
            .append("path")
            .attr("d", pathGenerator)
            .attr("class", "country")
            .attr("fill", d => colorScale(d.properties.dataValue))
            .on("mouseover", showTooltip) // Show tooltip on mouseover
            .on("mouseout", hideTooltip)
            .on("click", countryClicked);
        }
    });
});





