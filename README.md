# Projections Visualizer

A sophisticated financial dashboard for comparing historical performance with multi-horizon projections. Built with React, Material-UI, and Recharts to provide interactive visualization of business metrics across different timeframes.

## Features

### 📊 Interactive Visualizations
- **Multi-timeframe views**: Monthly, quarterly, and annual aggregations
- **Three dataset types**: Historical data, base projections, and goal-based projections
- **Dynamic chart interactions**: Hover tooltips, metric toggles, and responsive design
- **Smart aggregation**: Automatically converts monthly data to quarterly/annual views

### 🎯 Advanced Analytics
- **Comparative analysis**: Side-by-side comparison of historical vs projected performance
- **Goal tracking**: Visualize ambitious targets alongside realistic projections
- **Metric filtering**: Focus on specific KPIs (Revenue, Net Profit, Gross Profit, Expenses)
- **Gap analysis**: Visual bands showing differences between goals and projections

### 🔒 Security & UX
- **Password protection**: Secure access with session management
- **Guided onboarding**: Interactive tour for new users
- **Drag-and-drop uploads**: Intuitive file handling
- **Real-time validation**: Immediate feedback on data quality

## Quick Start

### 1. Deploy to Vercel
```bash
# Clone and deploy
git clone <your-repo>
cd projections-visualizer
npm install
npm run build

# Deploy to Vercel
vercel --prod
```

### 2. Set Password Protection
In your Vercel dashboard:
- Go to **Settings** → **Environment Variables**
- Add `VITE_APP_PASSWORD` = `your-secure-password`
- Redeploy the application

### 3. Prepare Your Data Files

#### Historical Data (`data.json`)
```json
{
  "old_data": [
    {
      "month": "2023-01",
      "revenue": 120000,
      "net_profit": 18000,
      "gross_profit": 54000,
      "expenses": 102000
    }
  ]
}
```

#### Projections Data (`projections.json`)
```json
{
  "projections_data": {
    "one_year_monthly": [
      {
        "month": "2024-01",
        "revenue": 140000,
        "net_profit": 22000,
        "gross_profit": 60000,
        "expenses": 118000
      }
    ],
    "five_years_quarterly": [
      {
        "quarter": "2024-Q1",
        "revenue": 420000,
        "net_profit": 66000,
        "gross_profit": 180000,
        "expenses": 354000
      }
    ]
  },
  "goal_based_projections": {
    "three_years_monthly": [
      {
        "month": "2024-01",
        "revenue": 150000,
        "net_profit": 24000,
        "gross_profit": 64000,
        "expenses": 126000
      }
    ]
  }
}
```

## Usage Guide

### Getting Started
1. **Access the dashboard** using your configured password
2. **Upload data files**: Drag and drop or click to select your JSON files
3. **Choose timeframe**: Select from 1-year monthly to 15-year annual views
4. **Configure display**: Toggle Old/Projections/Goal datasets and specific metrics
5. **Analyze results**: Hover over chart points for detailed tooltips

### Data Requirements
- **Historical data**: Monthly records with `month` field in `YYYY-MM` format
- **Projections**: Support for monthly, quarterly, and annual projections
- **Required fields**: `revenue`, `net_profit`, `gross_profit`, `expenses`
- **Flexible structure**: Missing values are handled gracefully

### Timeframe Options
- **1 Year Monthly**: Monthly view with goal comparison
- **3 Years Monthly**: Extended monthly view with goal tracking
- **5 Years Quarterly**: Quarterly aggregation for medium-term planning
- **10 Years Annual**: Annual view for long-term strategic planning
- **15 Years Annual**: Extended annual projections

## Development

### Local Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

### Environment Variables
```bash
# Required for password protection
VITE_APP_PASSWORD=your-secure-password
```

## Technical Architecture

### Core Technologies
- **React 19** - Latest React with modern features
- **Material-UI v7** - Comprehensive component library with dark theme
- **Recharts** - Powerful charting library with React integration
- **Vite** - Fast build tool and development server

### Key Components
- **`App.jsx`** - Main dashboard with chart visualization
- **`ProtectedApp.jsx`** - Authentication wrapper
- **`LoginScreen.jsx`** - Password protection interface
- **Custom hooks** - File processing and data aggregation logic

### Data Flow
1. **File Upload** → JSON parsing and validation
2. **Data Processing** → Aggregation by timeframe and metric
3. **Chart Generation** → Dynamic series based on user selections
4. **Interactive Display** → Real-time filtering and tooltips

## Deployment Notes

### Vercel Configuration
- **Framework**: React (auto-detected)
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Node version**: 18.x or higher

### Security Considerations
- Password stored as environment variable (not in code)
- 24-hour session expiration
- Client-side protection (suitable for internal business tools)
- Rate limiting on login attempts

### Performance Optimizations
- **Code splitting** - Lazy loading for optimal bundle size
- **Memoization** - Optimized re-renders for large datasets
- **Responsive design** - Mobile and desktop compatibility
- **Efficient aggregation** - Smart data processing for different timeframes

## Troubleshooting

### Common Issues
- **"Invalid JSON"**: Ensure your data files match the expected format exactly
- **"Missing projections_data"**: Verify your projections.json has the correct structure
- **Chart not showing**: Check that at least one metric and dataset are selected
- **Goal data missing**: Goal projections only available for 1Y and 3Y monthly views

### Data Validation
The app automatically validates:
- JSON file structure and required fields
- Date format consistency (`YYYY-MM`, `YYYY-QX`, or year numbers)
- Numeric values for financial metrics
- Proper nesting of projection timeframes

### Browser Compatibility
- **Recommended**: Chrome, Firefox, Safari, Edge (latest versions)
- **Requirements**: ES2020+ support, localStorage enabled
- **Mobile**: Responsive design works on tablets and phones

## Support

### Getting Help
- Press `?` in the dashboard to open the help dialog
- Use the **guided tour** for step-by-step instructions
- Check browser console for detailed error messages

### Performance Tips
- Keep historical datasets under 1000 records for optimal performance
- Use quarterly/annual views for large datasets
- Clear browser cache if experiencing display issues

---

**Built for modern financial analysis workflows** • Supports complex projection scenarios • Designed for business intelligence teams