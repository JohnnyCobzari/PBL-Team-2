async function fetchWindData(date, time) {
    try {
        const response = await fetch(`http://localhost:5000/fetch_wind_data?date=${date}&time=${time}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data); // Process your data here
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

// Example usage:
fetchWindData('2024-03-23', '12:00');
