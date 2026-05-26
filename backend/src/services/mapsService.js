const axios = require('axios');

async function geocodeAddress(address) {
  if (!process.env.GOOGLE_MAPS_API_KEY) return null;
  const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { address, key: process.env.GOOGLE_MAPS_API_KEY }
  });
  const first = data.results?.[0];
  if (!first) return null;
  return {
    address: first.formatted_address,
    coordinates: [first.geometry.location.lng, first.geometry.location.lat]
  };
}

module.exports = { geocodeAddress };

