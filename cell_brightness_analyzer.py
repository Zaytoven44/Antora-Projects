"""
Photoluminescence Cell Brightness Analyzer

This module provides functionality to analyze photoluminescence images of rectangular cells
and calculate the average brightness value for each cell.
"""

import numpy as np
import cv2
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from typing import List, Tuple, Dict, Optional, Union
import os
from pathlib import Path
import pandas as pd
from dataclasses import dataclass
import json


@dataclass
class Cell:
    """Represents a rectangular cell in an image."""
    x: int
    y: int
    width: int
    height: int
    brightness: float = 0.0
    cell_id: Optional[str] = None
    
    def to_dict(self):
        """Convert cell to dictionary."""
        return {
            'cell_id': self.cell_id,
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
            'brightness': self.brightness
        }


class CellBrightnessAnalyzer:
    """
    Analyzer for calculating brightness values of rectangular cells in photoluminescence images.
    """
    
    def __init__(self):
        """Initialize the analyzer."""
        self.image = None
        self.cells = []
        self.results = []
        
    def load_image(self, image_path: Union[str, Path]) -> np.ndarray:
        """
        Load an image from file.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Loaded image as numpy array
        """
        image_path = Path(image_path)
        if not image_path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        # Load image using PIL (handles various formats)
        pil_image = Image.open(image_path)
        
        # Convert to grayscale if necessary
        if pil_image.mode != 'L':
            pil_image = pil_image.convert('L')
        
        # Convert to numpy array
        self.image = np.array(pil_image)
        return self.image
    
    def detect_cells_automatically(self, 
                                 min_area: int = 100,
                                 threshold_method: str = 'otsu') -> List[Cell]:
        """
        Automatically detect rectangular cells in the image using contour detection.
        
        Args:
            min_area: Minimum area for a detected cell
            threshold_method: Method for thresholding ('otsu', 'adaptive', or 'manual')
            
        Returns:
            List of detected Cell objects
        """
        if self.image is None:
            raise ValueError("No image loaded. Call load_image() first.")
        
        # Apply threshold to get binary image
        if threshold_method == 'otsu':
            _, binary = cv2.threshold(self.image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        elif threshold_method == 'adaptive':
            binary = cv2.adaptiveThreshold(self.image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                         cv2.THRESH_BINARY, 11, 2)
        else:  # manual threshold
            _, binary = cv2.threshold(self.image, 127, 255, cv2.THRESH_BINARY)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter and convert contours to cells
        cells = []
        for i, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area >= min_area:
                x, y, w, h = cv2.boundingRect(contour)
                cell = Cell(x=x, y=y, width=w, height=h, cell_id=f"cell_{i+1}")
                cells.append(cell)
        
        self.cells = cells
        return cells
    
    def add_cell_manual(self, x: int, y: int, width: int, height: int, 
                       cell_id: Optional[str] = None) -> Cell:
        """
        Manually add a cell region.
        
        Args:
            x: X coordinate of top-left corner
            y: Y coordinate of top-left corner
            width: Width of the cell
            height: Height of the cell
            cell_id: Optional identifier for the cell
            
        Returns:
            Created Cell object
        """
        if cell_id is None:
            cell_id = f"cell_{len(self.cells) + 1}"
        
        cell = Cell(x=x, y=y, width=width, height=height, cell_id=cell_id)
        self.cells.append(cell)
        return cell
    
    def add_cells_grid(self, rows: int, cols: int, 
                      margin: int = 0, spacing: int = 0) -> List[Cell]:
        """
        Add cells in a regular grid pattern.
        
        Args:
            rows: Number of rows in the grid
            cols: Number of columns in the grid
            margin: Margin from image edges
            spacing: Spacing between cells
            
        Returns:
            List of created Cell objects
        """
        if self.image is None:
            raise ValueError("No image loaded. Call load_image() first.")
        
        img_height, img_width = self.image.shape
        
        # Calculate cell dimensions
        cell_width = (img_width - 2*margin - (cols-1)*spacing) // cols
        cell_height = (img_height - 2*margin - (rows-1)*spacing) // rows
        
        cells = []
        for row in range(rows):
            for col in range(cols):
                x = margin + col * (cell_width + spacing)
                y = margin + row * (cell_height + spacing)
                cell_id = f"cell_r{row+1}_c{col+1}"
                cell = Cell(x=x, y=y, width=cell_width, height=cell_height, cell_id=cell_id)
                cells.append(cell)
                self.cells.append(cell)
        
        return cells
    
    def calculate_brightness(self, cell: Cell, method: str = 'mean') -> float:
        """
        Calculate brightness value for a single cell.
        
        Args:
            cell: Cell object to analyze
            method: Method for calculating brightness ('mean', 'median', 'max', 'percentile')
            
        Returns:
            Calculated brightness value
        """
        if self.image is None:
            raise ValueError("No image loaded. Call load_image() first.")
        
        # Extract cell region from image
        cell_region = self.image[cell.y:cell.y+cell.height, cell.x:cell.x+cell.width]
        
        # Calculate brightness based on method
        if method == 'mean':
            brightness = np.mean(cell_region)
        elif method == 'median':
            brightness = np.median(cell_region)
        elif method == 'max':
            brightness = np.max(cell_region)
        elif method == 'percentile':
            brightness = np.percentile(cell_region, 95)  # 95th percentile
        else:
            raise ValueError(f"Unknown method: {method}")
        
        cell.brightness = float(brightness)
        return brightness
    
    def analyze_all_cells(self, method: str = 'mean') -> pd.DataFrame:
        """
        Analyze all cells and calculate their brightness values.
        
        Args:
            method: Method for calculating brightness
            
        Returns:
            DataFrame with analysis results
        """
        if not self.cells:
            raise ValueError("No cells defined. Add cells first.")
        
        results = []
        for cell in self.cells:
            brightness = self.calculate_brightness(cell, method)
            results.append(cell.to_dict())
        
        self.results = results
        return pd.DataFrame(results)
    
    def visualize_cells(self, show_values: bool = True, 
                       colormap: str = 'viridis',
                       save_path: Optional[str] = None) -> None:
        """
        Visualize the image with cell boundaries and brightness values.
        
        Args:
            show_values: Whether to display brightness values on cells
            colormap: Colormap for cell coloring based on brightness
            save_path: Optional path to save the visualization
        """
        if self.image is None:
            raise ValueError("No image loaded. Call load_image() first.")
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Original image with cell boundaries
        ax1.imshow(self.image, cmap='gray')
        ax1.set_title('Original Image with Cell Boundaries')
        ax1.axis('off')
        
        # Get brightness values for colormap
        brightnesses = [cell.brightness for cell in self.cells]
        if brightnesses:
            norm = plt.Normalize(vmin=min(brightnesses), vmax=max(brightnesses))
            cmap = plt.get_cmap(colormap)
        
        for cell in self.cells:
            # Draw rectangle on original image
            rect = patches.Rectangle((cell.x, cell.y), cell.width, cell.height,
                                    linewidth=2, edgecolor='red', facecolor='none')
            ax1.add_patch(rect)
            
            if show_values and cell.brightness > 0:
                ax1.text(cell.x + cell.width/2, cell.y + cell.height/2,
                        f'{cell.brightness:.1f}', color='yellow',
                        ha='center', va='center', fontsize=8, weight='bold')
        
        # Brightness heatmap
        ax2.imshow(self.image, cmap='gray', alpha=0.3)
        ax2.set_title('Cell Brightness Heatmap')
        ax2.axis('off')
        
        for cell in self.cells:
            if cell.brightness > 0:
                color = cmap(norm(cell.brightness))
                rect = patches.Rectangle((cell.x, cell.y), cell.width, cell.height,
                                        linewidth=1, edgecolor='black',
                                        facecolor=color, alpha=0.7)
                ax2.add_patch(rect)
                
                if show_values:
                    ax2.text(cell.x + cell.width/2, cell.y + cell.height/2,
                            f'{cell.cell_id}\n{cell.brightness:.1f}',
                            color='white', ha='center', va='center',
                            fontsize=7, weight='bold')
        
        # Add colorbar
        if brightnesses:
            sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
            sm.set_array([])
            plt.colorbar(sm, ax=ax2, label='Brightness')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        
        plt.show()
    
    def save_results(self, output_path: str, format: str = 'csv') -> None:
        """
        Save analysis results to file.
        
        Args:
            output_path: Path for output file
            format: Output format ('csv', 'json', or 'excel')
        """
        if not self.results:
            raise ValueError("No results to save. Run analyze_all_cells() first.")
        
        df = pd.DataFrame(self.results)
        
        if format == 'csv':
            df.to_csv(output_path, index=False)
        elif format == 'json':
            df.to_json(output_path, orient='records', indent=2)
        elif format == 'excel':
            df.to_excel(output_path, index=False)
        else:
            raise ValueError(f"Unknown format: {format}")
        
        print(f"Results saved to {output_path}")
    
    def get_statistics(self) -> Dict:
        """
        Get statistical summary of cell brightness values.
        
        Returns:
            Dictionary with statistical metrics
        """
        if not self.results:
            raise ValueError("No results available. Run analyze_all_cells() first.")
        
        brightnesses = [r['brightness'] for r in self.results]
        
        stats = {
            'count': len(brightnesses),
            'mean': np.mean(brightnesses),
            'std': np.std(brightnesses),
            'min': np.min(brightnesses),
            'max': np.max(brightnesses),
            'median': np.median(brightnesses),
            'q1': np.percentile(brightnesses, 25),
            'q3': np.percentile(brightnesses, 75)
        }
        
        return stats


def batch_process_images(image_folder: str, output_folder: str,
                        cell_detection: str = 'auto',
                        grid_params: Optional[Dict] = None) -> pd.DataFrame:
    """
    Process multiple images in a folder.
    
    Args:
        image_folder: Path to folder containing images
        output_folder: Path to folder for output files
        cell_detection: Method for cell detection ('auto' or 'grid')
        grid_params: Parameters for grid detection (if using grid method)
        
    Returns:
        DataFrame with combined results from all images
    """
    image_folder = Path(image_folder)
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)
    
    # Get all image files
    image_extensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp']
    image_files = [f for f in image_folder.iterdir() 
                  if f.suffix.lower() in image_extensions]
    
    all_results = []
    
    for image_file in image_files:
        print(f"Processing {image_file.name}...")
        
        analyzer = CellBrightnessAnalyzer()
        analyzer.load_image(image_file)
        
        # Detect cells
        if cell_detection == 'auto':
            analyzer.detect_cells_automatically()
        elif cell_detection == 'grid' and grid_params:
            analyzer.add_cells_grid(**grid_params)
        
        # Analyze cells
        df = analyzer.analyze_all_cells()
        df['image_name'] = image_file.name
        
        # Save individual results
        result_file = output_folder / f"{image_file.stem}_results.csv"
        df.to_csv(result_file, index=False)
        
        # Save visualization
        viz_file = output_folder / f"{image_file.stem}_visualization.png"
        analyzer.visualize_cells(save_path=str(viz_file))
        
        all_results.append(df)
    
    # Combine all results
    combined_df = pd.concat(all_results, ignore_index=True)
    combined_file = output_folder / "combined_results.csv"
    combined_df.to_csv(combined_file, index=False)
    
    print(f"Batch processing complete. Results saved to {output_folder}")
    return combined_df


if __name__ == "__main__":
    # Example usage
    print("Cell Brightness Analyzer Module")
    print("Use this module to analyze photoluminescence images of rectangular cells.")
    print("\nExample usage:")
    print("  analyzer = CellBrightnessAnalyzer()")
    print("  analyzer.load_image('path/to/image.tif')")
    print("  analyzer.detect_cells_automatically()")
    print("  results = analyzer.analyze_all_cells()")
    print("  analyzer.visualize_cells()")