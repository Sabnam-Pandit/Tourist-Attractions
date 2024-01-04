let myMap;
let mappa;
let attractions = [];
let markers=[];
let failedRequests = 0; 
let mapPosition;
let textCanvas, mapCanvas;
let timeout = null;

function preload(){
img=loadImage("Image.jpeg");
myfont = loadFont('font.ttf');
let Icon= new Image();
  Icon.onload = function() {
    // Convert image to data URL and store it
    customIconUrl = Icon.src;
  };
 
 // Icon.src = 'Icons Images/Icon2.png'; 
   // Icon.src = 'Icon6.png';
  Icon.src = 'Icons Images/Icon4.png'; 
  //Icon.src = 'Icons Images/Icon_p5js.png'; // Path to your local icon file
}

function setup() {
   imgW=img.width;
  imgH=img.height;
 
  let textAreaHeight = windowHeight * 0.2;
  let mapAreaHeight = windowHeight * 0.8;

  // Create two separate canvases
  textCanvas = createCanvas(windowWidth, textAreaHeight);
  mapCanvas = createGraphics(windowWidth, mapAreaHeight);
   // Adjust the map canvas to be positioned after the text canvas
  mapCanvas.position(0, windowHeight * 0.2);
  mapCanvas.style('z-index', '1');
  mappa = new Mappa('Leaflet');
  myMap = mappa.tileMap({
    lat: 32.7157, // San Diego coordinates as default view
    lng: -117.1611,
    zoom: 13,
   style: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  });

  // Overlay the map with a callback to add the Leaflet tile layer
  myMap.overlay(mapCanvas, () => {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(myMap.map);
  });


  searchInput = createInput('');
  searchInput.id('search-input');
  searchInput.attribute('placeholder', 'Search Places...');
  searchInput.style('padding', '10px');
  searchInput.style('margin', '0');
  searchInput.style('border', 'none');
  searchInput.style('border-right', 'none');
  searchInput.style('border-radius', '5px 0 0 5px');
  searchInput.style('outline', 'none');
  searchInput.style('width', '250px');
  searchInput.style('position', 'absolute');
  searchInput.style('top', '105px');
  searchInput.style('left', '15px');
  searchInput.style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)');
 

  searchInput.input(executeSearch);
  
  
  searchButton = createButton('🔍');
  searchButton.style('padding', '10px 20px');
  searchButton.style('margin', '0');
  searchButton.style('border', 'none');
  //searchButton.style('background-color', '#f0f0f0');
  searchButton.style('border-radius', '0 5px 5px 0');
  searchButton.style('outline', 'none');
  searchButton.style('cursor', 'pointer');
  searchButton.style('position', 'absolute');
  searchButton.style('top', '105px');
  searchButton.style('left', 'calc(30px + 200px)'); // Position it right next to the input

searchButton.mousePressed(executeSearch); // Attach an event for when the button is pressed
  
  suggestionsDiv = createDiv(''); // Create a div for suggestions
  suggestionsDiv.id('suggestions-div'); // Assign an ID for styling
  
  // // Style the suggestions div
  // suggestionsDiv.style('position', 'absolute');
  // suggestionsDiv.style('top', '60px'); // You may need to adjust this based on the search input's position
  // suggestionsDiv.style('left', '50px'); // Adjust the left position as needed
  // suggestionsDiv.style('width', '200px'); // Match the width to your search input
  // suggestionsDiv.style('background-color', '#fff');
  // suggestionsDiv.style('border', '1px solid #aaa');
  // suggestionsDiv.style('border-radius', '4px');
  // suggestionsDiv.style('padding', '4px');
  // suggestionsDiv.style('box-shadow', '0px 4px 8px rgba(0, 0, 0, 0.2)');
  // suggestionsDiv.style('z-index', '100');
  // suggestionsDiv.style('display', 'none'); // Start with the div hidden
  


  // Event handler for the search input
  searchInput.input(() => {
    // Clear any existing timeout to debounce the function calls
    clearTimeout(timeout);

    // Set a timeout to delay the execution of the search
    timeout = setTimeout(() => {
      const query = searchInput.value();
      // Only call executeSearch if the query length is greater than a certain number of characters
      if (query.length > 2) {
        executeSearch(query);
      }
    }, 500); // Delay in milliseconds
  }); 
 
}
 


function executeSearch() {
   console.log(select('#search-input'));
  const searchinput = select('#search-input').value();
    // Use a geocoding service to find the location
  const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${searchinput}`;

  // Use the fetch API to get the data
  fetch(geocodingUrl)
    .then(response => response.json())
    .then(data => {
    console.log(data);
      if (data && data.length > 0) {
        // Assuming the first result is the most relevant
        const firstResult = data[0];
        // Use Leaflet's setView method to center the map
        myMap.map.setView([firstResult.lat, firstResult.lon], 13);
      } else {
        console.error('No results found for the search query.');
      }
    })
    .catch(error => console.error('Error with the geocoding request:', error));

const searchQuery = encodeURIComponent(searchinput + "Tourist Attractions");
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&utf8=&format=json&origin=*`;

loadJSON(url, gotSearchData, 'jsonp');
} 


function gotSearchData(data) {
  failedRequests = 0; // Reset the failed requests count for a new search
// console.log(data);
attractions = []; // Reset the attractions array for a new search
let searchResults = data.query.search;
totalAttractions = searchResults.length; // Update the total attractions count
  console.log(totalAttractions);
for (let result of searchResults) {
getCoordinates(result.title, result.pageid);
  }
}

function getCoordinates(title, pageID) {
  const apiURL = `https://en.wikipedia.org/w/api.php?action=query&prop=coordinates|pageimages&pageids=${pageID}&utf8=&format=json&origin=*&piprop=thumbnail&pithumbsize=100`;

  loadJSON(apiURL, (data) => gotCoordinates(data, title), 'jsonp');
 // console.log(title,pageID);
  
}

function errorCallback(error) {
  console.error("API request failed:", error); // Log the error
  failedRequests++;
  console.log('Failed requests:', failedRequests); // Log the number of failed requests

  if (attractions.length + failedRequests === totalAttractions) {
    console.log('All requests finished, some failed. Proceeding to plot available attractions.');
    plotAttractionsOnMap();
  }
}

function gotCoordinates(data, title) {
  let pages = data.query.pages;
  let pageProcessed = false; // Flag to check if at least one page has been processed

  for (let pageId in pages) {
    let page = pages[pageId];
    if (page.coordinates) {
      pageProcessed = true;
      let coordinates = page.coordinates[0];
      attractions.push({
        title: title,
        lat: coordinates.lat,
        lng: coordinates.lon,
        imageUrl: page.thumbnail ? page.thumbnail.source : null
      });
    }
  }
  
  // Increment failedRequests if no page had coordinates
  if (!pageProcessed) {
    failedRequests++;
  }

  // Check if we have processed all the results, including failed ones
  if (attractions.length + failedRequests === totalAttractions) {
    plotAttractionsOnMap();
  }
}


function plotAttractionsIconOnMap() {
 removeMarkers();//Remove Previous markers
 
  if (myMap && myMap.map) {
    // Then loop through all attractions in the array
    attractions.forEach((attraction) => {
        
let marker = L.marker([attraction.lat, attraction.lng]).addTo(myMap.map);
     markers.push(marker);
      // If there's an image URL, create a popup with the image and title
      if (attraction.imageUrl) {
        marker.bindPopup(`<b>${attraction.title}</b><br><img src="${attraction.imageUrl}" width="200">`);
      } else {
        // If there's no image, just show the title
        marker.bindPopup(`<b>${attraction.title}</b>`);
      }
    });
  } else {
    console.error('The map has not been initialized yet.');
  }
}


function plotAttractionsImageOnMap() {
  removeMarkers(); // Remove previous markers

  if (myMap && myMap.map) {
    // Loop through all attractions in the array
    attractions.forEach((attraction) => {
      // Create an icon for each attraction
       const icon = L.icon({
        iconUrl: attraction.imageUrl,
        iconSize: [40, 40], // Size of the icon
        iconAnchor: [22, 47], // Point of the icon which will correspond to marker's location
        popupAnchor: [-3, -76] // Point from which the popup should open relative to the iconAnchor
      });

      // Create a marker with the custom icon
      let marker = L.marker([attraction.lat, attraction.lng], { icon: icon }).addTo(myMap.map);

      // Push the marker to the global markers array
      markers.push(marker);

      // Create a popup with the image and title
      if (attraction.imageUrl) {
        marker.bindPopup(`<b>${attraction.title}</b><br><img src="${attraction.imageUrl}" width="200">`);
      } else {
        // If there's no image, just show the title
        marker.bindPopup(`<b>${attraction.title}</b>`);
      }
    });
  } else {
    console.error('The map has not been initialized yet.');
  }
}


function plotAttractionsOnMap() {
  removeMarkers(); // Remove previous markers

  if (myMap && myMap.map) {
    // Loop through all attractions in the array
    attractions.forEach((attraction) => {
      // Create an icon for each attraction
       const icon = L.icon({
        iconUrl:customIconUrl ,
        iconSize: [40, 40], // Size of the icon
        iconAnchor: [22, 47], // Point of the icon which will correspond to marker's location
        popupAnchor: [-3, -76] // Point from which the popup should open relative to the iconAnchor
      });

      // Create a marker with the custom icon
      let marker = L.marker([attraction.lat, attraction.lng], { icon: icon }).addTo(myMap.map);

      // Push the marker to the global markers array
      markers.push(marker);

      // Create a popup with the image and title
      if (attraction.imageUrl) {
        marker.bindPopup(`<b>${attraction.title}</b><br><img src="${attraction.imageUrl}" width="200">`);
      } else {
        // If there's no image, just show the title
        marker.bindPopup(`<b>${attraction.title}</b>`);
      }
    });
  } else {
    console.error('The map has not been initialized yet.');
  }
}

function removeMarkers() {
  // Loop through the markers array
  for (let i = 0; i < markers.length; i++) {
    myMap.map.removeLayer(markers[i]); // Remove the marker from the map
  }
  // Clear the array
  markers = [];
}




function draw() {
  let textAreaHeight = windowHeight * 0.2;

 

  //textCanvas.textFont(fontItalic);
   fill(0); // Black text
  noStroke(); // No border around the text
  textCanvas.textSize(24);
  textCanvas.background(135, 206, 235);
  textCanvas.textAlign(LEFT,TOP);

textFont(myfont);
textCanvas.textStyle(BOLD);
textCanvas.text('Explore the Unexplored: Attractions Just a Search Away', 20, 20,windowWidth/2- 10);
  

  // Draw the text canvas
  image(textCanvas, 0, 0);
  tint(255, 255);
  image(img,windowWidth/2,0,windowWidth/2, textAreaHeight);
  
  let mapAreaHeight = windowHeight * 0.8;
  strokeWeight(5);
  stroke(255);
  noFill();
  rect(0,0,windowWidth,textAreaHeight)
}


// If the window is resized, adjust the canvas and map container sizes
function windowResized() {
  
  let textAreaHeight = windowHeight * 0.2;
  let mapAreaHeight = windowHeight * 0.8;

  // Resize the main canvas and map canvas
  resizeCanvas(windowWidth, textAreaHeight);
  mapCanvas = createGraphics(windowWidth, mapAreaHeight);
  textCanvas=createCanvas(windowWidth, textAreaHeight);

  // Re-initialize Mappa and overlay on the resized mapCanvas
  myMap = mappa.tileMap({ lat: 0, lng: 0, zoom: 4, style: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png' });
  myMap.overlay(mapCanvas);

  // Resize the map accordingly
  myMap.map.invalidateSize();
}