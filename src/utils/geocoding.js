// Reverse geocoding through Nominatim, shared by the manifest generator (Node)
// and the apps (browser), so both name places the same way. The settings are
// the "geocoding" block of src/data/game-config.json.

// The request URL for one GPS position. With a language set, Nominatim answers
// in it; without one, each place comes back in its own language (日本, Ελλάς).
export const reverseGeocodeUrl = (geocoding, latitude, longitude) => {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(latitude),
    lon: String(longitude),
    zoom: String(geocoding.zoom),
    addressdetails: '1',
  });
  if (geocoding.language) params.set('accept-language', geocoding.language);
  return `${geocoding.baseUrl}?${params}`;
};

// Country, state and city from a Nominatim address. Places are tagged
// differently around the world, so the state and city are the first of the
// fields listed in addressPriority that the address has.
export const placeFromAddress = (geocoding, address = {}) => {
  const first = (fields) => fields.map((field) => address[field]).find(Boolean) || null;
  return {
    country: address.country || null,
    state: first(geocoding.addressPriority.state),
    city: first(geocoding.addressPriority.city),
  };
};
