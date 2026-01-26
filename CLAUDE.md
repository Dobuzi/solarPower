# Solar Power Simulator

A web-based solar power simulator that calculates PV energy generation based on location, panel specs, and configuration with real-time 3D visualization.

## Quick Start

```bash
npm install
npm run dev
```

## Tech Stack

- **Build**: Vite + TypeScript
- **UI**: React 18 + Tailwind CSS
- **3D**: Three.js + React Three Fiber
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **State**: Zustand

## Project Structure

```
src/
├── core/           # Solar physics (pure functions)
│   ├── solarPosition.ts   # NOAA sun position algorithm
│   ├── irradiance.ts      # Clear-sky irradiance model
│   ├── panelOutput.ts     # PV power calculations
│   ├── atmosphere.ts      # Air mass, transmittance
│   └── types.ts           # TypeScript interfaces
├── models/         # Data models and presets
├── store/          # Zustand state management
├── components/     # React components
│   ├── Map/        # Leaflet map with sun vector
│   ├── Panel3D/    # Three.js visualization
│   ├── Controls/   # Parameter inputs
│   ├── DataPanel/  # Charts and outputs
│   ├── TimeSlider/ # Animation controls
│   └── SearchBar/  # Location search
└── hooks/          # Custom React hooks
```

## Key Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
npm run typecheck # Type checking
npm run lint      # Linting
```

## Solar Calculations

The simulator uses industry-standard algorithms:

- **Solar Position**: NOAA algorithm for sun elevation/azimuth
- **Irradiance**: Simplified Ineichen-Perez clear-sky model
- **POA**: Plane-of-array irradiance with beam, diffuse, reflected components
- **Temperature Derating**: Cell temperature effects on power output

## Features

- Interactive map for location selection (click anywhere)
- Real-time 3D panel visualization with sun position
- Multiple panel manufacturer presets
- Adjustable tilt/azimuth angles with optimal recommendations
- Daily power curve and cumulative energy charts
- Energy projections (weekly, monthly, yearly)
- Cost savings and CO2 offset estimates
- Time animation with variable speed
