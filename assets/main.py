import cdsapi

# Create a new CDS API client
c = cdsapi.Client()

# Set a specific date known to be available based on the error message
year = '2024'
month = '03'
day = '23'

c.retrieve(
    'reanalysis-era5-single-levels',
    {
        'product_type': 'reanalysis',
        'format': 'netcdf',  # Changed from 'grib' to 'netcdf'
        'variable': [
            '10m_u_component_of_wind',  # U component of wind at 10 meters
            '10m_v_component_of_wind',  # V component of wind at 10 meters
        ],
        'year': year,
        'month': month,
        'day': day,
        'time': '20:00',
    },
    'data.nc')  # Changed file extension to .nc for NetCDF format
