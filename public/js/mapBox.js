/*eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoiaGVtYW50aDc4OCIsImEiOiJjbDJ1MTF2ZGowMTV3M29wNWxocTRsYnlsIn0.6PupbyTyjoMgQpUzOAU3Uw';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
});
