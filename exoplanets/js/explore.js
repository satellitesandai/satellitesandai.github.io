
function detectMobile() {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
        document.getElementById('mobileWarning').style.display = 'block';
        document.getElementById('descDiv').style.display = 'none';
        document.getElementById('filterDiv').style.display = 'none';
        document.getElementById('detailsDiv').style.display = 'none';
        document.getElementById('plotDiv').style.display = 'none';
    }
}

async function loadColumnMappings() {
    // Load JSON mappings
    const response = await fetch(mappingsFilePath

    );
    columnMappings = await response.json();
}

async function loadData() {
    // Load data from CSV
    const rows = await d3.csv(csvFilePath);
    originalData = rows; 
    return rows;
}

async function loadData() {
    // Load data from CSV
    const rows = await d3.csv(csvFilePath);

    // Filter out rows with missing or invalid x, y, z coordinates
    const filteredRows = rows.filter(row => {
        const x = parseFloat(row['cart_x']);
        const y = parseFloat(row['cart_y']);
        const z = parseFloat(row['cart_z']);

        // Check if x, y, z are valid numbers and not NaN
        return !isNaN(x) && !isNaN(y) && !isNaN(z);
    });

    originalData = filteredRows;
    return filteredRows;
}

function populateFilterOptions(rows) {
    
    const columns = Object.keys(columnMappings);

    const filterColumn = document.getElementById('filterColumn');
    
    // Clear existing options
    filterColumn.innerHTML = '<option value="" disabled selected>Select a column</option>';
    
    // Add new options based on the order in columnMappings, and excluding 'err' columns and the ones in excludedColumns
    columns.forEach(key => {
        // Check if the column includes 'err', 'lim', 'flag' or is in the excludedColumns list
        if (!key.toLowerCase().includes('err') && !key.toLowerCase().includes('lim') 
        && !key.toLowerCase().includes('flag') && !excludedColumns.includes(key)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = columnMappings[key] || key; // Use the columnMappings value for the label
            filterColumn.appendChild(option);
        }
    });

    filterColumn.addEventListener('change', function() {
        updateMinMaxValues(rows, filterColumn.value);
    });
}
function dynamicFilterUpdate() {
// Dynamically update the plot based on slider movements
    const filterColumn = document.getElementById('filterColumn').value;
    const minValue = parseFloat(document.getElementById('minValue').value);
    const maxValue = parseFloat(document.getElementById('maxValue').value);

    if (!filterColumn || isNaN(minValue) || isNaN(maxValue)) {
        return;
    }

    const filteredData = originalData.filter(row => {
        const value = parseFloat(row[filterColumn]);
        return value >= minValue && value <= maxValue && !isNaN(value);
    });

    updatePlot(filteredData);
}
 
function updateMinMaxValues(rows, selectedColumn) {
    const minSlider = document.getElementById('minValue');
    const maxSlider = document.getElementById('maxValue');
    const minLabel = document.getElementById('minValueLabel');
    const maxLabel = document.getElementById('maxValueLabel');
    const filterDiv = document.getElementById('filterDiv');

    let existingDropdown = document.getElementById('categoryDropdown');
    if (existingDropdown) {
        filterDiv.removeChild(existingDropdown);
    }

    // Extract values for the selected column
    const values = rows.map(row => row[selectedColumn]).filter(value => value !== null && value !== "" && value !== undefined)
    const numericValues = values.map(value => parseFloat(value)).filter(value => !isNaN(value));

    // Check if all values are numeric
    const isNumeric = numericValues.length === values.length;


    if (isNumeric) {
        // Handle as numeric: show sliders
        minSlider.style.display = 'inline';
        maxSlider.style.display = 'inline';
        minLabel.style.display = 'inline';
        maxLabel.style.display = 'inline';

        const minValue = Math.min(...numericValues);
        const maxValue = Math.max(...numericValues);

        minSlider.min = minValue;
        minSlider.max = maxValue;
        minSlider.value = minValue;

        maxSlider.min = minValue;
        maxSlider.max = maxValue;
        maxSlider.value = maxValue;

        minLabel.textContent = `Min Value (${minValue})`;
        maxLabel.textContent = `Max Value (${maxValue})`;

        updatePlot(originalData);
    } else {
        // Handle as categorical: show dropdown
        minSlider.style.display = 'none';
        maxSlider.style.display = 'none';
        minLabel.style.display = 'none';
        maxLabel.style.display = 'none';

        const dropdown = document.createElement('select');
        dropdown.id = 'categoryDropdown';
        dropdown.innerHTML = `<option value="" selected>Show all</option>`;

        // Create a list of unique (non-numeric) values
        const uniqueValues = [...new Set(values)];
        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            dropdown.appendChild(option);
        });

        dropdown.addEventListener('change', function () {
            const selectedFactor = this.value;

            if (selectedFactor) {
                // Apply filtering for categorical value
                const filteredData = originalData.filter(row => row[selectedColumn] === selectedFactor);
                updatePlot(filteredData);
            } else {
                // Show all data if "Show all" is selected
                updatePlot(originalData);
            }
        });

        filterDiv.insertBefore(dropdown, document.querySelector('button'));
        
        updatePlot(originalData); // Draw all elements initially (no filter applied yet)
    }
}

function resetFilter() {
    // Clear the filter column selection
    document.getElementById('filterColumn').value = '';

    // Clear sliders
    document.getElementById('minValue').style.display = 'none';
    document.getElementById('maxValue').style.display = 'none';
    document.getElementById('minValueLabel').style.display = 'none';
    document.getElementById('maxValueLabel').style.display = 'none';

    // Remove dropdown if it exists
    let existingDropdown = document.getElementById('categoryDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }

    // Reset the plot to the original data
    updatePlot(originalData);
}

function calculateMarkerSize(totalPoints, minSize, maxSize, scalingFactor) {
    return Math.max(minSize, maxSize * Math.pow(totalPoints, -scalingFactor));
}

function updatePlot(data) {
    const unpack = (rows, key) => rows.map(row => row[key]);

    const totalPoints = data.length;
    const minSize = 1; 
    const maxSize = 10; 
    const scalingFactor = 0.25;

    const markerSize = calculateMarkerSize(totalPoints, minSize, maxSize, scalingFactor);

    // Add "Earth" point at (0, 0, 0) with a distinct size and color
    const earthPoint = {
        x: [0],
        y: [0],
        z: [0],
        mode: 'markers',
        marker: {
            size: markerSize,
            color: 'blue',
            opacity: 0.8,
            line: { color: 'blue'}
        },
        text: ["Earth"],
        hoverinfo: 'text',
        type: 'scatter3d'
    };

    const exoplanetData = {
        x: unpack(data, 'cart_x'),
        y: unpack(data, 'cart_y'),
        z: unpack(data, 'cart_z'),
        mode: 'markers',
        marker: {
            size: markerSize,
            color: 'white',
            opacity: 0.8
        },
        text: unpack(data, 'pl_name'),
        hoverinfo: 'text',
        type: 'scatter3d'
    };

    const plotData = [earthPoint, exoplanetData];

    const layout = {
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
        },
        plot_bgcolor: "black",
        paper_bgcolor: "black",
        showlegend: false,
        scene: {
            xaxis: {
                title: '',
                autorange: true,
                showgrid: false,
                zeroline: false,
                showline: false,
                autotick: true,
                ticks: '',
                showticklabels: false,
                showspikes: false
            },
            yaxis: {
                title: '',
                autorange: true,
                showgrid: false,
                zeroline: false,
                showline: false,
                autotick: true,
                ticks: '',
                showticklabels: false,
                showspikes: false
            },
            zaxis: {
                title: '',
                autorange: true,
                showgrid: false,
                zeroline: false,
                showline: false,
                autotick: true,
                ticks: '',
                showticklabels: false,
                showspikes: false
            }
        }
    };

    Plotly.react('plotDiv', plotData, layout, { displaylogo: false });

    // Reattach the plot click event after the update
    document.getElementById('plotDiv').on('plotly_click', function(eventData) {
        if (eventData && eventData.points && eventData.points.length > 0) {
            const point = eventData.points[0];
            const clickedPlName = point.text;

            if (clickedPlName === "Earth") {
                document.getElementById('modal-body').innerHTML = "<p>You found home :)</p>";
            } else {
                loadData().then(function(rows) {
                    const matchingRow = rows.find(row => row.pl_name === clickedPlName);
                    if (matchingRow) {
                        let detailsContent = '<ul style="margin: 0; padding: 0; list-style-type: none;">';
                        Object.keys(columnMappings).forEach(key => {
                            if (!excludedColumns.includes(key) && matchingRow.hasOwnProperty(key)) {
                                const displayName = columnMappings[key] || key;
                                const value = matchingRow[key] === "" ? "NA" : matchingRow[key];
                                detailsContent += `
                                    <li>
                                        <strong>${displayName}:</strong>
                                        <span>${value}</span>
                                    </li>`;
                            }
                        });
                        detailsContent += '</ul>';
                        document.getElementById('modal-body').innerHTML = detailsContent;
                    }
                });
            }
        }
    });
}

// Run the function on page load
window.onload = detectMobile;

document.getElementById('loading').style.display = 'block';

const csvFilePath = 'data/exoplanets_cartesian.csv';
const mappingsFilePath = 'data/columnMappings.json';
let columnMappings = {}; 
let originalData = [];
const excludedColumns = ["cart_x", "cart_y", "cart_z", "loc_rowid"]; // Excluded Columns from Filter and Details

// Attach listeners to the sliders
document.getElementById('minValue').addEventListener('input', dynamicFilterUpdate);
document.getElementById('maxValue').addEventListener('input', dynamicFilterUpdate);
document.getElementById('filterColumn').addEventListener('change', function() {
    const selectedColumn = this.value;
    if (selectedColumn) {
        updateMinMaxValues(originalData, selectedColumn); 
        dynamicFilterUpdate(); 
    }
});

// Update label dynamically as slider values change
document.getElementById('minValue').addEventListener('input', function() {
    document.getElementById('minValueLabel').textContent = `Min Value (${this.value})`;
});

document.getElementById('maxValue').addEventListener('input', function() {
    document.getElementById('maxValueLabel').textContent = `Max Value (${this.value})`;
});

// Initialize the page
Promise.all([loadColumnMappings(), loadData()])
    .then(([_, rows]) => {
        populateFilterOptions(rows);
        updatePlot(rows);
        document.getElementById('loading').style.display = 'none';
    })
    .catch(error => console.error("Error loading data or mappings:", error));

document.querySelectorAll('.draggable').forEach(div => {
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

// Create an overlay to block interactions
const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.top = 0;
overlay.style.left = 0;
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.zIndex = 999;
overlay.style.pointerEvents = 'none'; // Initially disable pointer events

// Start dragging on mousedown
div.addEventListener('mousedown', (e) => {
// Ignore dragging if the target is a slider (or any input)
if (e.target.tagName === 'INPUT' && e.target.type === 'range') {
    return;
}

isDragging = true;

// Calculate the offset between the mouse position and the div's top-left corner
offsetX = e.clientX - div.getBoundingClientRect().left;
offsetY = e.clientY - div.getBoundingClientRect().top;

// Set higher z-index for the dragged div
div.style.zIndex = 1000;

// Prevent text selection while dragging
document.body.style.userSelect = 'none';

// Enable the overlay to block interactions
overlay.style.pointerEvents = 'all';
document.body.appendChild(overlay);
});

// Move the div on mousemove
document.addEventListener('mousemove', (e) => {
if (isDragging) {
    // Calculate the new position
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;

    // Apply the new position to the div
    div.style.left = `${newX}px`;
    div.style.top = `${newY}px`;
}
});

// Stop dragging on mouseup
document.addEventListener('mouseup', () => {
if (isDragging) {
    isDragging = false;

    // Reset user-select to allow text selection again
    document.body.style.userSelect = '';

    // Remove the overlay
    if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
    }
}
});
});