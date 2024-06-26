from flask import Flask, request, jsonify
import cdsapi
from netCDF4 import Dataset
import json

app = Flask(__name__)

def fetch_wind_data_from_cds(date, time):
    year, month, day = date.split('-')
    c = cdsapi.Client()
    c.retrieve(
        'reanalysis-era5-single-levels',
        {
            'product_type': 'reanalysis',
            'format': 'netcdf',
            'variable': ['10m_u_component_of_wind', '10m_v_component_of_wind'],
            'year': year,
            'month': month,
            'day': day,
            'time': time,
        },
        'data.nc')
    nc_file = 'data.nc'
    with Dataset(nc_file, 'r') as nc:
        latitudes = nc.variables['latitude'][:]
        longitudes = nc.variables['longitude'][:]
        u10 = nc.variables['u10'][0, :, :]
        v10 = nc.variables['v10'][0, :, :]
        data_list = [{"latitude": float(lat), "longitude": float(lon), "u10": float(u10[i, j]), "v10": float(v10[i, j])}
                     for i, lat in enumerate(latitudes) for j, lon in enumerate(longitudes)]
    return data_list

def save_data_as_json(data, date, time):
    json_filename = f"wind_data_{date}_{time.replace(':', '-')}.json"
    with open(json_filename, 'w') as file:
        json.dump(data, file, indent=4)
    return json_filename

@app.route('/fetch_wind_data', methods=['GET'])
def api_fetch_wind_data():
    date = request.args.get('date')
    time = request.args.get('time')
    if not date or not time:
        return jsonify({"error": "Please provide both date and time in the format YYYY-MM-DD and HH:MM"}), 400

    try:
        data = fetch_wind_data_from_cds(date, time)
        json_filename = save_data_as_json(data, date, time)
        return jsonify({"data": data, "saved_to": json_filename}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
