"""
Demonstration script for Cell Brightness Analyzer
This script shows how to use the cell_brightness_analyzer module
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import pandas as pd
from PIL import Image

# Import the analyzer
from cell_brightness_analyzer import CellBrightnessAnalyzer, batch_process_images

def create_sample_image(rows=3, cols=4, cell_size=100, spacing=20, noise_level=0.1):
    """Create a synthetic photoluminescence image with rectangular cells."""
    
    # Calculate image dimensions
    img_height = rows * cell_size + (rows + 1) * spacing
    img_width = cols * cell_size + (cols + 1) * spacing
    
    # Create dark background
    image = np.ones((img_height, img_width)) * 30  # Dark background
    
    # Add cells with varying brightness
    cells_info = []
    for row in range(rows):
        for col in range(cols):
            # Calculate cell position
            y = spacing + row * (cell_size + spacing)
            x = spacing + col * (cell_size + spacing)
            
            # Generate random brightness for each cell (simulating different PL intensities)
            base_brightness = np.random.uniform(100, 250)
            
            # Create cell with some internal variation
            cell_data = np.ones((cell_size, cell_size)) * base_brightness
            
            # Add some realistic variation within the cell
            variation = np.random.normal(0, base_brightness * 0.1, (cell_size, cell_size))
            cell_data += variation
            
            # Add the cell to the image
            image[y:y+cell_size, x:x+cell_size] = cell_data
            
            cells_info.append({
                'row': row, 'col': col,
                'x': x, 'y': y,
                'true_brightness': base_brightness
            })
    
    # Add overall noise to simulate sensor noise
    noise = np.random.normal(0, noise_level * 255, image.shape)
    image = np.clip(image + noise, 0, 255)
    
    return image.astype(np.uint8), cells_info

def demo_automatic_detection():
    """Demonstrate automatic cell detection."""
    print("\n" + "="*60)
    print("DEMO 1: Automatic Cell Detection")
    print("="*60)
    
    # Create sample image
    sample_image, true_cells = create_sample_image(rows=3, cols=4)
    
    # Save the sample image
    sample_path = Path('sample_pl_image.tif')
    Image.fromarray(sample_image).save(sample_path)
    print(f"✅ Sample image saved to: {sample_path}")
    
    # Initialize analyzer
    analyzer = CellBrightnessAnalyzer()
    analyzer.load_image(sample_path)
    
    # Detect cells automatically
    detected_cells = analyzer.detect_cells_automatically(min_area=500)
    print(f"✅ Detected {len(detected_cells)} cells automatically")
    
    # Analyze cells
    results_df = analyzer.analyze_all_cells(method='mean')
    
    # Display results
    print("\n📊 Cell Brightness Analysis Results:")
    print(results_df.to_string())
    
    # Get statistics
    stats = analyzer.get_statistics()
    print("\n📈 Statistical Summary:")
    for key, value in stats.items():
        print(f"  {key:10s}: {value:.2f}")
    
    # Visualize
    analyzer.visualize_cells(show_values=True, colormap='plasma')
    
    # Save results
    analyzer.save_results('auto_detection_results.csv', format='csv')
    print("\n✅ Results saved to auto_detection_results.csv")
    
    return analyzer

def demo_grid_detection():
    """Demonstrate grid-based cell detection."""
    print("\n" + "="*60)
    print("DEMO 2: Grid-based Cell Detection")
    print("="*60)
    
    # Load the same sample image
    analyzer = CellBrightnessAnalyzer()
    analyzer.load_image('sample_pl_image.tif')
    
    # Add cells in grid pattern
    grid_cells = analyzer.add_cells_grid(rows=3, cols=4, margin=20, spacing=20)
    print(f"✅ Added {len(grid_cells)} cells in grid pattern")
    
    # Analyze cells
    results_df = analyzer.analyze_all_cells(method='mean')
    
    # Display results
    print("\n📊 Grid Cell Analysis Results:")
    print(results_df.to_string())
    
    # Visualize
    analyzer.visualize_cells(show_values=True, colormap='viridis')
    
    # Save results
    analyzer.save_results('grid_detection_results.csv', format='csv')
    print("\n✅ Results saved to grid_detection_results.csv")
    
    return analyzer

def demo_manual_detection():
    """Demonstrate manual cell definition."""
    print("\n" + "="*60)
    print("DEMO 3: Manual Cell Definition")
    print("="*60)
    
    # Load the same sample image
    analyzer = CellBrightnessAnalyzer()
    analyzer.load_image('sample_pl_image.tif')
    
    # Manually add specific cells
    analyzer.add_cell_manual(x=20, y=20, width=100, height=100, cell_id="top_left")
    analyzer.add_cell_manual(x=140, y=20, width=100, height=100, cell_id="top_center_left")
    analyzer.add_cell_manual(x=260, y=20, width=100, height=100, cell_id="top_center_right")
    analyzer.add_cell_manual(x=380, y=20, width=100, height=100, cell_id="top_right")
    
    print(f"✅ Manually defined 4 cells")
    
    # Analyze cells
    results_df = analyzer.analyze_all_cells(method='mean')
    
    # Display results
    print("\n📊 Manual Cell Analysis Results:")
    print(results_df.to_string())
    
    # Visualize
    analyzer.visualize_cells(show_values=True, colormap='cool')
    
    return analyzer

def demo_comparison_methods():
    """Compare different brightness calculation methods."""
    print("\n" + "="*60)
    print("DEMO 4: Comparison of Brightness Calculation Methods")
    print("="*60)
    
    methods = ['mean', 'median', 'max', 'percentile']
    comparison_results = {}
    
    for method in methods:
        analyzer = CellBrightnessAnalyzer()
        analyzer.load_image('sample_pl_image.tif')
        analyzer.add_cells_grid(rows=3, cols=4, margin=20, spacing=20)
        
        results = analyzer.analyze_all_cells(method=method)
        comparison_results[method] = results['brightness'].values
    
    # Create comparison DataFrame
    comparison_df = pd.DataFrame(comparison_results)
    comparison_df['cell_id'] = [f'cell_{i+1}' for i in range(len(comparison_df))]
    
    print("\n📊 Brightness values using different methods:")
    print(comparison_df.to_string())
    
    # Plot comparison
    fig, ax = plt.subplots(figsize=(12, 6))
    x = np.arange(len(comparison_df))
    width = 0.2
    
    for i, method in enumerate(methods):
        ax.bar(x + i*width, comparison_df[method], width, label=method)
    
    ax.set_xlabel('Cell ID')
    ax.set_ylabel('Brightness Value')
    ax.set_title('Comparison of Brightness Calculation Methods')
    ax.set_xticks(x + width * 1.5)
    ax.set_xticklabels(comparison_df['cell_id'], rotation=45)
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()
    
    return comparison_df

def demo_batch_processing():
    """Demonstrate batch processing of multiple images."""
    print("\n" + "="*60)
    print("DEMO 5: Batch Processing Multiple Images")
    print("="*60)
    
    import os
    
    # Create directories
    os.makedirs('sample_images', exist_ok=True)
    os.makedirs('batch_results', exist_ok=True)
    
    # Generate 5 sample images
    print("\n🔄 Generating sample images...")
    for i in range(5):
        img, _ = create_sample_image(rows=3, cols=4, noise_level=0.05 + i*0.02)
        img_path = f'sample_images/pl_image_{i+1}.tif'
        Image.fromarray(img).save(img_path)
        print(f"  Created: {img_path}")
    
    # Batch process
    print("\n🔄 Starting batch processing...")
    batch_results = batch_process_images(
        image_folder='sample_images',
        output_folder='batch_results',
        cell_detection='grid',
        grid_params={'rows': 3, 'cols': 4, 'margin': 20, 'spacing': 20}
    )
    
    print("\n📊 Batch Processing Summary:")
    print(f"  Total images processed: {batch_results['image_name'].nunique()}")
    print(f"  Total cells analyzed: {len(batch_results)}")
    
    print("\n📈 Brightness statistics across all images:")
    summary = batch_results.groupby('image_name')['brightness'].agg(['mean', 'std', 'min', 'max'])
    print(summary.to_string())
    
    return batch_results

def main():
    """Run all demonstrations."""
    print("\n" + "="*60)
    print("CELL BRIGHTNESS ANALYZER DEMONSTRATION")
    print("Analyzing Photoluminescence Images of Rectangular Cells")
    print("="*60)
    
    # Set matplotlib parameters
    plt.rcParams['figure.dpi'] = 100
    plt.rcParams['figure.figsize'] = (12, 6)
    
    # Run demonstrations
    demo_automatic_detection()
    demo_grid_detection()
    demo_manual_detection()
    demo_comparison_methods()
    demo_batch_processing()
    
    print("\n" + "="*60)
    print("✅ ALL DEMONSTRATIONS COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("\n📌 To use with your own images:")
    print("   1. Replace 'sample_pl_image.tif' with your image path")
    print("   2. Adjust detection parameters based on your cell size")
    print("   3. Choose the appropriate detection method:")
    print("      - Automatic: For well-separated cells")
    print("      - Grid: For regular grid patterns")
    print("      - Manual: For custom cell regions")
    print("="*60)

if __name__ == "__main__":
    main()