import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio

def generate_plot(csv_file, column_mappings_file, filter_column, min_value, max_value, categorical_value, output_png):
    # Load column mappings and data
    column_mappings = load_column_mappings(column_mappings_file)
    data = load_data(csv_file)
    
    # Filter data based on the provided filter_column, min_value, max_value, and categorical_value
    filtered_data = filter_data(data, filter_column, min_value, max_value, categorical_value)
    
    # Create the 3D scatter plot
    plot = create_plot(filtered_data, column_mappings)
    
    # Save the plot as a PNG file
    save_plot_as_png(plot, output_png)

def load_column_mappings(mappings_file):
    # Load JSON mappings for columns
    return pd.read_json(mappings_file)

def load_data(csv_file):
    # Load data from CSV file
    return pd.read_csv(csv_file)

def filter_data(data, filter_column, min_value, max_value, categorical_value):
    # Check if the filter_column is numerical or categorical
    if data[filter_column].dtype == 'object':  # Categorical column (non-numeric)
        # Filter by categorical value
        if categorical_value:
            return data[data[filter_column] == categorical_value]
        else:
            return data  # No categorical filter applied
    else:  # Numerical column
        # Filter by min and max values
        return data[(data[filter_column] >= min_value) & (data[filter_column] <= max_value)]

def create_plot(data, column_mappings):
    # Extract x, y, and z values from the filtered data
    x = data['cart_x']
    y = data['cart_y']
    z = data['cart_z']
    
    # Earth point
    earth_x = [0]
    earth_y = [0]
    earth_z = [0]
    
    # Create 3D scatter plot
    fig = go.Figure()
    
    # Earth marker (static)
    fig.add_trace(go.Scatter3d(
        x=earth_x,
        y=earth_y,
        z=earth_z,
        mode='markers',
        marker=dict(size=10, color='blue'),
        name='Earth'
    ))
    
    # Exoplanet data
    fig.add_trace(go.Scatter3d(
        x=x,
        y=y,
        z=z,
        mode='markers',
        marker=dict(size=5, color='white', opacity=0.8),
        text=data['pl_name'],
        hoverinfo='text',
        name='Exoplanets'
    ))
    
    # Layout settings
    fig.update_layout(
        margin=dict(l=0, r=0, b=0, t=0),
        plot_bgcolor="black",
        paper_bgcolor="black",
        showlegend=False,
        scene=dict(
            xaxis=dict(title='', showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(title='', showgrid=False, zeroline=False, showticklabels=False),
            zaxis=dict(title='', showgrid=False, zeroline=False, showticklabels=False)
        )
    )
    
    return fig

def save_plot_as_png(plot, output_png):
    # Save the Plotly figure as a PNG file
    pio.write_image(plot, output_png)

if __name__ == '__main__':
    # Define file paths and filter settings
    csv_file = 'data/exoplanets_cartesian.csv'  # Path to your CSV file
    column_mappings_file = 'data/columnMappings.json'  # Path to column mappings JSON file
    filter_column = 'some_column_name'  # Column to filter by (e.g., 'pl_rade' for numerical, or 'pl_name' for categorical)
    min_value = 0.0  # Min value for the filter (only for numerical columns)
    max_value = 10.0  # Max value for the filter (only for numerical columns)
    categorical_value = 'some_category'  # Categorical value to filter by (only for categorical columns)
    output_png = 'output_plot.png'  # Output PNG file path

    # Generate the plot
    generate_plot(csv_file, column_mappings_file, filter_column, min_value, max_value, categorical_value, output_png)
    print(f"PNG plot saved to {output_png}")
