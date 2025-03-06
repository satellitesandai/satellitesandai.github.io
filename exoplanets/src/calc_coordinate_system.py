import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv('exoplanets.csv')

# Convert RA and DEC from degrees to radians for calculations
df['ra_rad'] = np.deg2rad(df['ra'])
df['dec_rad'] = np.deg2rad(df['dec'])

# Calculate Cartesian coordinates
df['cart_x'] = df['sy_dist'] * np.cos(df['dec_rad']) * np.cos(df['ra_rad'])
df['cart_y'] = df['sy_dist'] * np.cos(df['dec_rad']) * np.sin(df['ra_rad'])
df['cart_z'] = df['sy_dist'] * np.sin(df['dec_rad'])

# Drop intermediate columns (optional)
df = df.drop(['ra_rad', 'dec_rad'], axis=1)

# Save the updated DataFrame to a new CSV
df.to_csv('exoplanets_cartesian.csv', index=False)
