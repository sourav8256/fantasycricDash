async function fetchGoogleSheetsData(spreadsheetId, range) {
  const API_KEY = 'YOUR_API_KEY';
  const SHEET_ID = spreadsheetId;
  const RANGE = range;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.values;
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return null;
  }
}

const spreadsheetId = 'YOUR_SPREADSHEET_ID';
const range = 'Sheet1!A1:D10';

fetchGoogleSheetsData(spreadsheetId, range)
  .then(data => {
    if (data) {
      console.log('Data from Google Sheets:', data);
    } else {
      console.log('Failed to fetch data from Google Sheets');
    }
  });
