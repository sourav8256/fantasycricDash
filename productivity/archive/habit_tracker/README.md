# Daily Habit Tracker

A simple, intuitive web application for tracking your daily habits. This habit tracker helps you monitor your consistency across various life areas such as Work, Home, and Health & Fitness.

## Features

- Track habits across multiple categories/sections
- Mark habits as complete (✅) or incomplete (❌) with a simple click
- Navigate between weeks to view your habit history or plan ahead
- **Date-based tracking**: Status is stored by actual calendar dates, not just weekday positions
- Add new habits to existing sections
- Create new sections for different areas of your life
- Persistent storage (your data is saved in your browser's local storage)

## How to Use

1. **Open the Application**
   - Simply open the `index.html` file in your web browser

2. **Navigate Between Weeks**
   - Use the "← Older Dates" and "Future Dates →" buttons to move between weeks
   - Each week shows the correct habit status for those specific dates

3. **Mark Habits as Complete/Incomplete**
   - Click on any cell to toggle between complete (✅) and incomplete (❌) status
   - Status is saved for the specific calendar date, not just the day of the week

4. **Add a New Habit**
   - Click the "➕ Add Task" button in the section where you want to add a habit
   - Enter the habit name in the popup modal and click "Save"

5. **Add a New Section**
   - Click the "➕ Add Section" button at the bottom of the page
   - Enter the section name in the popup modal and click "Save"

## Technical Details

This application is built with:
- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage for data persistence

Key implementation details:
- Habit status is stored in date-specific format (YYYY-MM-DD)
- Generates dynamic date ranges for each week view
- Preserves status data across calendar navigation

No external libraries or frameworks are required. The application works offline and stores all data in your browser's local storage.

## Browser Compatibility

This application should work in all modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- LocalStorage API

## License

This project is open-source and free to use for personal or educational purposes. 