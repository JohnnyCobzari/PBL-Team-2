import json
from netCDF4 import Dataset

nc_file = 'data.nc'

# Open the NetCDF file for reading
with Dataset(nc_file, 'r') as nc:
    # Assuming 'latitude', 'longitude', and 'time' are the names of the dimensions
    latitudes = nc.variables['latitude'][:]
    longitudes = nc.variables['longitude'][:]
    # Assuming we're interested in the first time step
    time_index = 0

    # Fetch the U and V wind components for the first time step
    u10 = nc.variables['u10'][time_index, :, :]  # [time, latitude, longitude]
    v10 = nc.variables['v10'][time_index, :, :]

data_list = []

# Iterate over each latitude and longitude index
for i, lat in enumerate(latitudes):
    for j, lon in enumerate(longitudes):
        data_list.append({
            "latitude": float(lat),
            "longitude": float(lon),
            "u10": float(u10[i, j]),  # Convert to float for JSON serialization
            "v10": float(v10[i, j])
        })

# Convert the list to JSON
json_data = json.dumps(data_list, indent=4)

# Optionally, write to a file
with open('wind_data.json', 'w') as file:
    file.write(json_data)

print("JSON data has been written to wind_data.json")
