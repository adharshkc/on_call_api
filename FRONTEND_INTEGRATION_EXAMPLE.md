# Frontend Integration Example

## Admin Panel Service Creation Form

This is an example of how the frontend should integrate with the new location and postcode APIs.

### React/Vue.js Example

```typescript
interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  lat: number;
  lng: number;
  placeType?: string;
  category?: string;
}

interface PostcodeData {
  postcode: string;
  displayName: string;
}

class LocationService {
  private baseUrl = 'http://localhost:3333/api';
  private authToken = localStorage.getItem('authToken');

  // Debounced autocomplete search
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (query.length < 2) return [];
    
    try {
      const response = await fetch(
        `${this.baseUrl}/locations/autocomplete?q=${encodeURIComponent(query)}&country=gb&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  }

  // Get postcodes for selected location
  async getPostcodes(lat: number, lng: number, radius: number = 5000): Promise<PostcodeData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/locations/postcodes?lat=${lat}&lng=${lng}&radius=${radius}&countryCode=gb&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Postcode fetch failed:', error);
      return [];
    }
  }
}

class ServiceManagementService {
  private baseUrl = 'http://localhost:3333/api';
  private authToken = localStorage.getItem('authToken');

  // Create service with location and postcodes
  async createService(serviceData: any, locationData?: LocationSuggestion, postcodes?: string[]) {
    try {
      const payload: any = {
        ...serviceData
      };

      // Add location and postcodes if provided
      if (locationData && postcodes && postcodes.length > 0) {
        payload.locationData = {
          name: locationData.name,
          lat: locationData.lat,
          lng: locationData.lng,
          type: locationData.placeType || 'area',
          region: 'england',
          county: locationData.state || locationData.city || '',
          zipCode: locationData.zipCode
        };
        payload.postcodes = postcodes;
      }

      const response = await fetch(`${this.baseUrl}/services`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Service creation failed:', error);
      throw error;
    }
  }

  // Add postcodes to existing service
  async addPostcodesToService(serviceId: number, locationData: LocationSuggestion, postcodes: string[]) {
    try {
      const response = await fetch(
        `${this.baseUrl}/services/add-availability-with-postcodes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            serviceId,
            locationData: {
              name: locationData.name,
              lat: locationData.lat,
              lng: locationData.lng,
              type: locationData.placeType || 'area',
              region: 'england',
              county: locationData.state || locationData.city || '',
              zipCode: locationData.zipCode
            },
            postcodes
          })
        }
      );
      
      return await response.json();
    } catch (error) {
      console.error('Adding postcodes failed:', error);
      throw error;
    }
  }
}

// Usage in React Component
export const ServiceCreationForm = () => {
  // Service form fields
  const [serviceData, setServiceData] = useState({
    name: '',
    slug: '',
    description: '',
    fullDescription: '',
    category: '',
    price: '',
    duration: '',
    services: [],
    benefits: '',
    gettingStarted: '',
    gettingStartedPoints: [],
    image: '',
    icon: '',
    stats: []
  });

  // Location and postcode fields
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [availablePostcodes, setAvailablePostcodes] = useState<PostcodeData[]>([]);
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const locationService = new LocationService();
  const serviceManagementService = new ServiceManagementService();

  // Debounced location search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        try {
          const suggestions = await locationService.searchLocations(searchQuery);
          setLocationSuggestions(suggestions);
        } finally {
          setLoading(false);
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Get postcodes when location is selected
  const handleLocationSelect = async (location: LocationSuggestion) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setLocationSuggestions([]);
    setLoading(true);

    try {
      const postcodes = await locationService.getPostcodes(location.lat, location.lng);
      setAvailablePostcodes(postcodes);
      // Auto-select all postcodes by default
      setSelectedPostcodes(postcodes.map(p => p.postcode));
    } catch (error) {
      console.error('Failed to fetch postcodes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle service form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceData.name || !serviceData.description) {
      alert('Please fill in required service fields');
      return;
    }

    setLoading(true);
    try {
      const result = await serviceManagementService.createService(
        serviceData,
        selectedLocation || undefined,
        selectedPostcodes.length > 0 ? selectedPostcodes : undefined
      );
      
      alert(result.message || 'Service created successfully!');
      
      // Reset form
      setServiceData({
        name: '',
        slug: '',
        description: '',
        fullDescription: '',
        category: '',
        price: '',
        duration: '',
        services: [],
        benefits: '',
        gettingStarted: '',
        gettingStartedPoints: [],
        image: '',
        icon: '',
        stats: []
      });
      setSelectedLocation(null);
      setSearchQuery('');
      setAvailablePostcodes([]);
      setSelectedPostcodes([]);
    } catch (error) {
      console.error('Failed to create service:', error);
      alert('Failed to create service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="service-creation-form">
      {/* Service Details Section */}
      <div className="form-section">
        <h2>Service Details</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Service Name *</label>
            <input
              id="name"
              type="text"
              value={serviceData.name}
              onChange={(e) => setServiceData({...serviceData, name: e.target.value})}
              placeholder="Enter service name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={serviceData.category}
              onChange={(e) => setServiceData({...serviceData, category: e.target.value})}
            >
              <option value="">Select category</option>
              <option value="healthcare">Healthcare</option>
              <option value="homecare">Home Care</option>
              <option value="companionship">Companionship</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={serviceData.description}
            onChange={(e) => setServiceData({...serviceData, description: e.target.value})}
            placeholder="Brief description of the service"
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="fullDescription">Full Description</label>
          <textarea
            id="fullDescription"
            value={serviceData.fullDescription}
            onChange={(e) => setServiceData({...serviceData, fullDescription: e.target.value})}
            placeholder="Detailed description of the service"
            rows={5}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              type="text"
              value={serviceData.price}
              onChange={(e) => setServiceData({...serviceData, price: e.target.value})}
              placeholder="e.g., £25/hour"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="duration">Duration</label>
            <input
              id="duration"
              type="text"
              value={serviceData.duration}
              onChange={(e) => setServiceData({...serviceData, duration: e.target.value})}
              placeholder="e.g., 1-2 hours"
            />
          </div>
        </div>
      </div>

      {/* Location & Postcodes Section */}
      <div className="form-section">
        <h2>Service Location (Optional)</h2>
        <p className="form-help">Add location and postcodes where this service is available</p>
        
        <div className="form-group">
          <label htmlFor="location-search">Search Location:</label>
          <div className="location-search">
            <input
              id="location-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type city, town, or area name..."
              className="form-input"
              disabled={loading}
            />
            {loading && <div className="loading-spinner">Searching...</div>}
          </div>

          {/* Location Suggestions Dropdown */}
          {locationSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {locationSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="suggestion-item"
                  onClick={() => handleLocationSelect(suggestion)}
                >
                  <div className="suggestion-name">{suggestion.name}</div>
                  <div className="suggestion-address">{suggestion.address}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="selected-location">
            <h3>Selected Location:</h3>
            <p><strong>Name:</strong> {selectedLocation.name}</p>
            <p><strong>Address:</strong> {selectedLocation.address}</p>
            <p><strong>Coordinates:</strong> {selectedLocation.lat}, {selectedLocation.lng}</p>
          </div>
        )}

        {/* Postcodes Selection */}
        {availablePostcodes.length > 0 && (
          <div className="postcodes-section">
            <h3>Available Postcodes:</h3>
            <div className="postcodes-controls">
              <button 
                type="button" 
                onClick={() => setSelectedPostcodes(availablePostcodes.map(p => p.postcode))}
              >
                Select All
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedPostcodes([])}
              >
                Deselect All
              </button>
            </div>

            <div className="postcodes-grid">
              {availablePostcodes.map((postcode) => (
                <label key={postcode.postcode} className="postcode-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPostcodes.includes(postcode.postcode)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPostcodes([...selectedPostcodes, postcode.postcode]);
                      } else {
                        setSelectedPostcodes(selectedPostcodes.filter(p => p !== postcode.postcode));
                      }
                    }}
                  />
                  {postcode.displayName}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Section */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={loading || !serviceData.name || !serviceData.description}
          className="btn btn-primary"
        >
          {loading ? 'Creating...' : 
           selectedLocation && selectedPostcodes.length > 0 ? 
           `Create Service with ${selectedPostcodes.length} Postcodes` : 
           'Create Service'}
        </button>
        
        {selectedLocation && selectedPostcodes.length > 0 && (
          <p className="form-help">
            Service will be available in {selectedLocation.name} for {selectedPostcodes.length} postcode(s)
          </p>
        )}
      </div>
    </form>
  );
};
```

### CSS Styles Example

```css
.service-creation-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.form-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-section h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.form-help {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  font-style: italic;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-input, select, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  font-family: inherit;
}

.form-input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
}

.location-search {
  position: relative;
}

.loading-spinner {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #666;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  border-radius: 0 0 4px 4px;
}

.suggestion-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-name {
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.suggestion-address {
  font-size: 14px;
  color: #666;
}

.selected-location {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #bbdefb;
}

.selected-location h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #1976d2;
}

.postcodes-section {
  margin-top: 20px;
}

.postcodes-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.postcodes-controls {
  margin: 10px 0 15px 0;
  display: flex;
  gap: 10px;
}

.postcodes-controls button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.postcodes-controls button:hover {
  background: #0056b3;
}

.postcodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.postcode-checkbox {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid #e9ecef;
}

.postcode-checkbox:hover {
  background: #e9ecef;
}

.postcode-checkbox input {
  margin-right: 8px;
  transform: scale(1.1);
}

.form-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.btn {
  padding: 12px 30px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  background: #28a745;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.form-actions .form-help {
  margin-top: 10px;
  font-size: 14px;
  color: #28a745;
}

/* Responsive design */
@media (max-width: 768px) {
  .service-creation-form {
    padding: 15px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .postcodes-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .postcodes-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
```

## Customer Search Example

```typescript
class CustomerService {
  private baseUrl = 'http://localhost:3333/api';

  async searchServices(postcode: string, serviceId?: number) {
    try {
      const response = await fetch(`${this.baseUrl}/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postcode,
          serviceId,
          includeNearby: true
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Service search failed:', error);
      throw error;
    }
  }
}

// Usage in Customer Component
export const ServiceSearch = () => {
  const [postcode, setPostcode] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const customerService = new CustomerService();

  const handleSearch = async () => {
    if (!postcode.trim()) return;
    
    setLoading(true);
    try {
      const searchResults = await customerService.searchServices(postcode);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-search">
      <div className="search-form">
        <input
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="Enter your postcode (e.g., M1 1AA)"
          className="postcode-input"
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Find Services'}
        </button>
      </div>

      {results && (
        <div className="search-results">
          {results.available ? (
            <>
              <h3>
                {results.matchType === 'exact' ? 
                  `Services available in ${results.postcode}` :
                  `Services available in nearby areas (${results.searchRadius}** postcodes)`
                }
              </h3>
              <div className="services-list">
                {results.data.map(service => (
                  <div key={service.id} className="service-card">
                    <h4>{service.service.name}</h4>
                    <p>{service.service.description}</p>
                    <p><strong>Area:</strong> {service.location.name}, {service.location.county}</p>
                    <p><strong>Postcode:</strong> {service.postcode}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>No services available for postcode {results.postcode}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

This frontend integration example shows how to:

1. **Search locations** with autocomplete
2. **Select a location** from suggestions
3. **Fetch postcodes** for the selected area
4. **Allow selection** of specific postcodes
5. **Submit the service** with location and postcodes
6. **Handle customer searches** by postcode with fallback to nearby areas