# DOE Power Testing Application

A comprehensive web application for Design of Experiments (DOE) power analysis and statistical testing. This application helps researchers and analysts determine the appropriate sample sizes and statistical power for their experiments.

## Features

- **Multiple Test Types**: One-sample t-test, Two-sample t-test, Paired t-test, One-way ANOVA, Two-way ANOVA, Chi-square test, and Correlation test
- **Power Analysis**: Calculate statistical power for your experimental design
- **Sample Size Calculation**: Determine required sample sizes for desired power
- **Power Curves**: Visualize how power changes with sample size
- **Educational Content**: Built-in explanations, equations, and effect size guidelines
- **Export Functionality**: Export results in multiple formats

## Quick Start

### Option 1: Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Application**
   ```bash
   npm start
   ```

3. **Open in Browser**
   Navigate to `http://localhost:3000`

### Option 2: Development Mode (with auto-restart)
```bash
npm run dev
```

## Deployment Options

### Option 1: Deploy to Heroku (Recommended for sharing)

1. **Install Heroku CLI** (if not already installed)
   ```bash
   # On Ubuntu/Debian
   sudo snap install --classic heroku
   
   # On macOS
   brew tap heroku/brew && brew install heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-doe-power-app
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

5. **Open Your App**
   ```bash
   heroku open
   ```

### Option 2: Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

### Option 3: Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Option 4: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

## How to Use

1. **Select Test Type**: Choose the appropriate statistical test for your experiment
2. **Enter Parameters**: Fill in the required parameters (effect size, sample size, etc.)
3. **Set Significance Level**: Choose your alpha level (default: 0.05)
4. **Calculate Power**: Click "Calculate Power" to see your statistical power
5. **Sample Size Planning**: Use "Calculate Sample Size" to determine required sample size
6. **Visualize**: Generate power curves to see how power changes with sample size

## Test Types Explained

### One-Sample t-test
- **Use when**: Comparing one group to a known population mean
- **Example**: Testing if a new teaching method improves test scores compared to the national average

### Two-Sample t-test
- **Use when**: Comparing two independent groups
- **Example**: Comparing treatment vs. control groups

### Paired t-test
- **Use when**: Comparing related measurements (before/after, matched pairs)
- **Example**: Testing weight loss before and after a diet program

### One-Way ANOVA
- **Use when**: Comparing three or more independent groups
- **Example**: Testing different fertilizer types on plant growth

### Two-Way ANOVA
- **Use when**: Testing two factors and their interaction
- **Example**: Testing fertilizer type and watering frequency on plant growth

### Chi-Square Test
- **Use when**: Testing relationships between categorical variables
- **Example**: Testing if gender is related to voting preference

### Correlation Test
- **Use when**: Testing the strength of linear relationships
- **Example**: Testing the relationship between study time and exam scores

## Effect Size Guidelines

### Cohen's d (for t-tests)
- **Small**: 0.2 (minimal practical significance)
- **Medium**: 0.5 (moderate practical significance)
- **Large**: 0.8 (strong practical significance)

### Cohen's f (for ANOVA)
- **Small**: 0.1
- **Medium**: 0.25
- **Large**: 0.4

## Technical Details

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript with Bootstrap 5
- **Charts**: Chart.js for power curve visualization
- **Statistics**: jStat library for statistical calculations
- **Port**: 3000 (configurable via PORT environment variable)

## API Endpoints

- `POST /api/power-analysis` - Calculate statistical power
- `POST /api/sample-size` - Calculate required sample size
- `POST /api/power-curve` - Generate power curve data
- `GET /api/test-types` - Get available test types

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify for your needs.

## Support

For questions or issues, please create an issue in the repository or contact the development team.