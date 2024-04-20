async function fetchWindData(date, time) {
    try {
        const response = await fetch(`http://localhost:5000/fetch_wind_data?date=${date}&time=${time}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data); // You could update the DOM with this data
        displayData(data);
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function submitDateTime() {
    const dateInput = document.getElementById('dateInput').value;
    const timeInput = document.getElementById('timeInput').value;
    fetchWindData(dateInput, timeInput);
}

function displayData(data) {
    // Example function to update the DOM with fetched data
    const output = document.getElementById('output');
    output.innerHTML = JSON.stringify(data, null, 2);
}
