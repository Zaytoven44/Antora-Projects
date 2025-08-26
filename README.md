# Photoluminescence Cell Brightness Analyzer

A Python tool for analyzing photoluminescence images of rectangular cells and calculating their average brightness values.

## Features

- **Automatic Cell Detection**: Automatically detect rectangular cells using contour analysis
- **Grid-based Detection**: Define cells in a regular grid pattern
- **Manual Cell Definition**: Manually specify cell regions
- **Multiple Brightness Metrics**: Calculate mean, median, max, or percentile brightness
- **Visualization**: Generate heatmaps and overlays showing cell boundaries and brightness values
- **Batch Processing**: Process multiple images at once
- **Export Options**: Save results to CSV, JSON, or Excel formats

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Quick Start

### Basic Usage

```python
from cell_brightness_analyzer import CellBrightnessAnalyzer

# Initialize analyzer
analyzer = CellBrightnessAnalyzer()

# Load your photoluminescence image
analyzer.load_image('your_image.tif')

# Method 1: Automatic cell detection
cells = analyzer.detect_cells_automatically(min_area=500)

# Method 2: Grid-based detection (for regular patterns)
# cells = analyzer.add_cells_grid(rows=3, cols=4, margin=20, spacing=20)

# Calculate brightness for all cells
results = analyzer.analyze_all_cells(method='mean')

# Visualize results
analyzer.visualize_cells(show_values=True, colormap='plasma')

# Save results
analyzer.save_results('results.csv', format='csv')
```

### Running the Demo

To see the analyzer in action with sample data:

```bash
python cell_brightness_analysis_demo.py
```

This will demonstrate:
- Automatic cell detection
- Grid-based detection
- Manual cell definition
- Comparison of different brightness calculation methods
- Batch processing of multiple images

## API Reference

### CellBrightnessAnalyzer

Main class for analyzing cell brightness.

#### Methods

- `load_image(image_path)`: Load a photoluminescence image
- `detect_cells_automatically(min_area=100, threshold_method='otsu')`: Automatically detect cells
- `add_cells_grid(rows, cols, margin=0, spacing=0)`: Define cells in a grid pattern
- `add_cell_manual(x, y, width, height, cell_id=None)`: Manually add a cell
- `analyze_all_cells(method='mean')`: Calculate brightness for all cells
- `visualize_cells(show_values=True, colormap='viridis', save_path=None)`: Visualize results
- `save_results(output_path, format='csv')`: Export results
- `get_statistics()`: Get statistical summary of brightness values

### Batch Processing

Process multiple images at once:

```python
from cell_brightness_analyzer import batch_process_images

results = batch_process_images(
    image_folder='path/to/images',
    output_folder='path/to/results',
    cell_detection='auto',  # or 'grid'
    grid_params={'rows': 3, 'cols': 4, 'margin': 20, 'spacing': 20}  # if using grid
)
```

## Brightness Calculation Methods

- **mean**: Average intensity across the cell (default)
- **median**: Median intensity (robust to outliers)
- **max**: Maximum intensity value
- **percentile**: 95th percentile intensity

## Output Formats

- **CSV**: Comma-separated values, ideal for data analysis
- **JSON**: JavaScript Object Notation, good for programmatic access
- **Excel**: Excel spreadsheet format

## File Structure

```
/workspace/
├── cell_brightness_analyzer.py    # Main module
├── cell_brightness_analysis_demo.py  # Demo script
├── requirements.txt               # Python dependencies
└── README.md                     # This file
```

## Tips for Best Results

1. **Image Quality**: Ensure good contrast between cells and background
2. **Cell Detection**: 
   - For automatic detection, adjust `min_area` based on your cell size
   - Use grid detection for regular patterns
   - Use manual definition for irregular or specific regions
3. **Brightness Method**: 
   - Use 'mean' for overall cell brightness
   - Use 'median' if there are outliers or noise
   - Use 'max' to find peak intensity
   - Use 'percentile' for robust peak detection

## Troubleshooting

- **No cells detected**: Adjust the `min_area` parameter or try different threshold methods
- **Wrong cell boundaries**: Use manual or grid-based detection instead of automatic
- **Memory issues with large images**: Process images in batches or reduce image size

## License

This tool is provided as-is for research and educational purposes.