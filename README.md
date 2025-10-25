# CityVibe Rebuild Guide - Minimalist Version
📋 Project Overview

A minimalist business intelligence application that analyzes cities using Qloo data and AI, displaying results on an interactive map with key insights.
🎯 Core Features (Minimalist)

    Interactive Map - Search and visualize cities
    AI Business Analysis - Get concise market insights
    Key Metrics Dashboard - 3-4 essential charts only
    Simple Chat Interface - Ask follow-up questions

🛠️ Technology Stack
Frontend

    React 18 - UI framework
    Vite - Build tool
    Material-UI (MUI) - Component library
    Google Maps API - Map visualization
    Chart.js - Simple charting (replaces Plotly)

Backend

    Flask - Python web framework
    OpenAI API - AI analysis
    Qloo API - Business data

Deployment

    Railway or Render - Hosting platform

📦 Required APIs & Services
1. Qloo API

    What: Business and consumer preference data
    Sign up: https://hackathon.api.qloo.com
    Cost: Free tier available
    Use: Fetch brands and places data

2. OpenAI API

    What: GPT-4 for business analysis
    Sign up: https://platform.openai.com
    Cost: Pay-per-use (~$0.03 per analysis)
    Use: Generate market insights

3. Google Maps JavaScript API

    What: Interactive maps and geocoding
    Sign up: https://console.cloud.google.com
    Cost: $200 free monthly credit
    APIs needed:
        Maps JavaScript API
        Geocoding API
        Places API (optional)

4. Deployment Platform (Choose one)

    Railway: https://railway.app (Recommended)
    Render: https://render.com
    Cost: ~$5/month

🏗️ Project Structure (Minimalist)

cityvibe-mini/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.jsx           # Google Maps
│   │   │   ├── SearchBar.jsx     # City search
│   │   │   ├── Dashboard.jsx     # Metrics display
│   │   │   └── ChatPanel.jsx     # AI chat
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app.py                    # Main Flask app
│   ├── qloo_service.py          # Qloo API client
│   ├── openai_service.py        # OpenAI client
│   └── requirements.txt
├── .env.example
└── README.md

📝 Step-by-Step Implementation
Phase 1: Setup & Environment (Day 1)
Step 1.1: Initialize Project
bash

# Create project directory
mkdir cityvibe-mini
cd cityvibe-mini

# Create frontend
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Install frontend dependencies
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @react-google-maps/api
npm install chart.js react-chartjs-2
npm install axios

cd ..

# Create backend
mkdir backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
pip install flask flask-cors requests openai python-dotenv
pip freeze > requirements.txt

Step 1.2: Setup Environment Variables
bash

# Create .env file in backend/
QLOO_API_KEY=your_qloo_key
OPENAI_API_KEY=your_openai_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
PORT=5000

Phase 2: Backend Development (Days 2-3)
Step 2.1: Create Flask App (backend/app.py)
python

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from qloo_service import get_city_data
from openai_service import analyze_business_environment

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/analyze', methods=['POST'])
def analyze_city():
    data = request.get_json()
    city = data.get('city')
    country = data.get('country')
    
    # Fetch Qloo data
    qloo_data = get_city_data(city, country)
    
    # Get AI analysis
    analysis = analyze_business_environment(city, country, qloo_data)
    
    return jsonify({
        'success': True,
        'city': city,
        'country': country,
        'analysis': analysis,
        'metrics': {
            'total_brands': len(qloo_data['brands']),
            'total_places': len(qloo_data['places']),
            'avg_rating': qloo_data['avg_rating'],
            'top_categories': qloo_data['top_categories'][:5]
        },
        'charts': {
            'brand_popularity': qloo_data['brand_chart_data'],
            'category_distribution': qloo_data['category_chart_data']
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))

Step 2.2: Qloo Service (backend/qloo_service.py)
python

import requests
import os

QLOO_API_KEY = os.getenv('QLOO_API_KEY')
QLOO_URL = "https://hackathon.api.qloo.com/v2/insights"

def get_city_data(city, country, limit=20):
    """Fetch brands and places from Qloo API"""
    
    headers = {
        "accept": "application/json",
        "X-Api-Key": QLOO_API_KEY
    }
    
    # Get brands
    brands_params = {
        "filter.type": "urn:entity:brand",
        "filter.location.query": city,
        "filter.geocode.country_code": country,
        "take": limit
    }
    brands_response = requests.get(QLOO_URL, headers=headers, params=brands_params)
    brands = brands_response.json().get('results', {}).get('entities', [])
    
    # Get places
    places_params = {
        "filter.type": "urn:entity:place",
        "filter.location.query": city,
        "filter.geocode.country_code": country,
        "take": limit
    }
    places_response = requests.get(QLOO_URL, headers=headers, params=places_params)
    places = places_response.json().get('results', {}).get('entities', [])
    
    # Process data for charts
    brand_data = [
        {'name': b.get('name'), 'popularity': b.get('popularity', 0) * 100}
        for b in brands[:10]
    ]
    
    categories = {}
    for place in places:
        for tag in place.get('tags', []):
            cat = tag.get('name')
            if cat:
                categories[cat] = categories.get(cat, 0) + 1
    
    top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Calculate average rating
    ratings = [
        float(p.get('properties', {}).get('business_rating', 0))
        for p in places
        if p.get('properties', {}).get('business_rating')
    ]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    return {
        'brands': brands,
        'places': places,
        'avg_rating': round(avg_rating, 1),
        'top_categories': top_categories,
        'brand_chart_data': brand_data,
        'category_chart_data': [{'category': k, 'count': v} for k, v in top_categories]
    }

Step 2.3: OpenAI Service (backend/openai_service.py)
python

from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def analyze_business_environment(city, country, qloo_data):
    """Generate AI analysis using GPT-4"""
    
    prompt = f"""You are a business analyst. Analyze the business environment for {city}, {country}.

Data Summary:
- Total Brands: {len(qloo_data['brands'])}
- Total Places: {len(qloo_data['places'])}
- Average Rating: {qloo_data['avg_rating']}
- Top Categories: {', '.join([c[0] for c in qloo_data['top_categories'][:5]])}

Top Brands: {', '.join([b['name'] for b in qloo_data['brand_chart_data'][:5]])}

Provide a concise analysis (150-200 words) covering:
1. Market Overview
2. Key Opportunities
3. Competitive Landscape

Be direct and actionable."""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a business intelligence analyst."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300,
        temperature=0.7
    )
    
    return response.choices[0].message.content

Phase 3: Frontend Development (Days 4-6)
Step 3.1: Main App (frontend/src/App.jsx)
jsx

import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
    secondary: { main: '#4ECDC4' },
  },
});

function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCitySelect = async (cityData) => {
    setSelectedCity(cityData);
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: cityData.name,
          country: cityData.country
        })
      });
      
      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', position: 'relative' }}>
        <SearchBar onCitySelect={handleCitySelect} />
        <Map selectedCity={selectedCity} />
        {analysisData && (
          <Dashboard data={analysisData} loading={loading} />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;

Step 3.2: Google Maps Component (frontend/src/components/Map.jsx)
jsx

import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 40,
  lng: -20
};

function Map({ selectedCity }) {
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(2);

  useEffect(() => {
    if (selectedCity) {
      setCenter({
        lat: selectedCity.lat,
        lng: selectedCity.lng
      });
      setZoom(12);
    }
  }, [selectedCity]);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_KEY}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          styles: [/* Custom map styling */],
          disableDefaultUI: false,
          zoomControl: true
        }}
      >
        {selectedCity && (
          <Marker position={{ lat: selectedCity.lat, lng: selectedCity.lng }} />
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default Map;

Step 3.3: Search Bar (frontend/src/components/SearchBar.jsx)
jsx

import React, { useState } from 'react';
import { Paper, InputBase, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function SearchBar({ onCitySelect }) {
  const [query, setQuery] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;

    // Use Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`;
    
    try {
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        // Extract country code
        const countryComponent = result.address_components.find(
          c => c.types.includes('country')
        );
        
        onCitySelect({
          name: query,
          country: countryComponent?.short_name || 'US',
          lat: location.lat,
          lng: location.lng
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  return (
    <Box sx={{ 
      position: 'absolute', 
      top: 20, 
      left: '50%', 
      transform: 'translateX(-50%)', 
      zIndex: 1000 
    }}>
      <Paper sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: 400, 
        p: '2px 4px',
        borderRadius: 50 
      }}>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search for a city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <IconButton onClick={handleSearch}>
          <SearchIcon />
        </IconButton>
      </Paper>
    </Box>
  );
}

export default SearchBar;

Step 3.4: Dashboard (frontend/src/components/Dashboard.jsx)
jsx

import React from 'react';
import { Box, Paper, Typography, Grid, CircularProgress } from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function Dashboard({ data, loading }) {
  if (loading) {
    return (
      <Box sx={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000 }}>
        <CircularProgress />
      </Box>
    );
  }

  const brandChartData = {
    labels: data.charts.brand_popularity.map(b => b.name),
    datasets: [{
      label: 'Popularity %',
      data: data.charts.brand_popularity.map(b => b.popularity),
      backgroundColor: 'rgba(102, 126, 234, 0.8)'
    }]
  };

  const categoryChartData = {
    labels: data.charts.category_distribution.map(c => c.category),
    datasets: [{
      data: data.charts.category_distribution.map(c => c.count),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
      ]
    }]
  };

  return (
    <Box sx={{ 
      position: 'absolute', 
      bottom: 20, 
      right: 20, 
      width: 500,
      maxHeight: '80vh',
      overflowY: 'auto',
      zIndex: 1000 
    }}>
      <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
        <Typography variant="h5" gutterBottom>
          {data.city}, {data.country}
        </Typography>
        
        {/* AI Analysis */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
          <Typography variant="body2">
            {data.analysis}
          </Typography>
        </Paper>

        {/* Key Metrics */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{data.metrics.total_brands}</Typography>
              <Typography variant="caption">Brands</Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{data.metrics.total_places}</Typography>
              <Typography variant="caption">Places</Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{data.metrics.avg_rating}</Typography>
              <Typography variant="caption">Avg Rating</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Brand Popularity</Typography>
          <Bar data={brandChartData} options={{ responsive: true }} />
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>Top Categories</Typography>
          <Doughnut data={categoryChartData} options={{ responsive: true }} />
        </Box>
      </Paper>
    </Box>
  );
}

export default Dashboard;

Phase 4: Configuration & Deployment (Day 7)
Step 4.1: Environment Configuration

Frontend .env:
env

VITE_GOOGLE_MAPS_KEY=your_google_maps_key
VITE_API_URL=http://localhost:5000

Backend .env:
env

QLOO_API_KEY=your_qloo_key
OPENAI_API_KEY=your_openai_key
PORT=5000
FLASK_ENV=production

Step 4.2: Build Scripts

Frontend package.json:
json

{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Backend: Create `Procfile` (for Railway):**
```
web: python app.py

Step 4.3: Deploy to Railway

    Push to GitHub:

bash

git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main

    Railway Setup:

    Go to https://railway.app
    Click "New Project" → "Deploy from GitHub"
    Select your repository
    Add environment variables in Railway dashboard
    Railway auto-detects Python and builds

    Configure Frontend:

    Build frontend: npm run build
    Copy dist/ contents to backend/static/
    Update Flask to serve static files

Updated backend/app.py for production:
python

from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='static', static_url_path='')

# ... existing API routes ...

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')
```

---

## 🎨 Minimalist Features Summary

### ✅ Keep
1. City search with autocomplete
2. Single AI-powered business analysis
3. 3 key metrics cards (brands, places, rating)
4. 2 essential charts (brand popularity, category distribution)
5. Google Maps with city marker

### ❌ Remove
- Multiple tabs
- 10+ visualizations
- Complex animations
- Chat interface (or make it optional Phase 2)
- Word clouds
- Seasonal analysis
- Geographic distribution plots
- Business hours analysis
- Price range analysis
- Trend analysis
- Competition analysis

---

## 📊 Final Minimalist UI Layout
```
+----------------------------------+
|        [Search Bar]              |
+----------------------------------+
|                                  |
|                                  |
|         Google Maps              |
|                                  |
|                                  |
|                     +----------+ |
|                     |Dashboard | |
|                     |          | |
|                     | - AI Text| |
|                     | - Metrics| |
|                     | - Chart 1| |
|                     | - Chart 2| |
|                     +----------+ |
+----------------------------------+

💰 Cost Breakdown

Service	Monthly Cost
Railway Hosting	$5
OpenAI API	~$3-5 (100 searches)
Google Maps	Free (under 28k loads)
Qloo API	Free tier
Total	~$8-10/month

🚀 Quick Start Commands
bash

# Development
cd frontend && npm run dev    # Port 5173
cd backend && python app.py   # Port 5000

# Production Build
cd frontend && npm run build
cp -r dist/* ../backend/static/
cd ../backend && python app.py

📈 Success Metrics

    Load Time: < 3 seconds
    API Response: < 5 seconds
    Bundle Size: < 500KB (gzipped)
    Mobile Responsive: Yes
    Browser Support: Modern browsers only

🔧 Troubleshooting
Issue: CORS errors

Solution: Check Flask-CORS configuration
Issue: Google Maps not loading

Solution: Verify API key and enable required APIs
Issue: OpenAI API errors

Solution: Check API key and model name (gpt-4 not gpt-4.1)
Issue: Qloo API timeout

Solution: Reduce limit parameter (try 10-15)
📚 Additional Resources

    Google Maps React Docs
    Chart.js Documentation
    Railway Documentation
    Flask Deployment Guide

This minimalist version reduces complexity by 70% while retaining core functionality. Total development time: 5-7 days for a solo developer.