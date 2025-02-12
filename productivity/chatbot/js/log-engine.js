class LogEngine {
    constructor(responseEngine) {
        this.responseEngine = responseEngine;
        this.LAST_LOG_KEY = 'lily_last_log';

        // Define meal times
        this.MEAL_TIMES = {
            breakfast: { hour: 8, spread: 1 },
            lunch: { hour: 13, spread: 1 },
            dinner: { hour: 20, spread: 1 }
        };

        // Initialize responses
        this.RANDOM_MESSAGES = [];
        this.MEAL_REMINDERS = {
            breakfast: [],
            lunch: [],
            dinner: []
        };

        // Load responses from JSON
        this.loadResponses();
    }

    async loadResponses() {
        try {
            const response = await fetch('data/responses.json');
            const data = await response.json();
            
            // Load random messages
            this.RANDOM_MESSAGES = data.logResponses.randomMessages;
            
            // Load meal reminders
            this.MEAL_REMINDERS = data.logResponses.mealReminders;
        } catch (error) {
            console.error('Error loading log responses:', error);
            // Fallback to empty arrays if loading fails
            this.RANDOM_MESSAGES = [];
            this.MEAL_REMINDERS = {
                breakfast: [],
                lunch: [],
                dinner: []
            };
        }
    }

    generateTimestamp(hour, spread) {
        const now = new Date();
        const timestamp = new Date(now);
        
        // Set the hour and add/subtract random minutes within the spread
        timestamp.setHours(hour);
        timestamp.setMinutes(Math.floor(Math.random() * 60));
        
        // Add/subtract random hours within the spread
        if (spread) {
            const spreadMillis = spread * 60 * 60 * 1000;
            timestamp.setTime(timestamp.getTime() + (Math.random() * 2 - 1) * spreadMillis);
        }
        
        return timestamp;
    }

    generateMissedMessages() {
        const lastLog = localStorage.getItem(this.LAST_LOG_KEY);
        const lastLogTime = lastLog ? new Date(parseInt(lastLog)) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const now = new Date();
        const messages = [];

        // Update last log time
        localStorage.setItem(this.LAST_LOG_KEY, now.getTime().toString());

        // If last log was less than 2 hours ago, don't generate messages
        if (now - lastLogTime < 2 * 60 * 60 * 1000) {
            return messages;
        }

        // Add random caring messages
        const hoursGone = Math.floor((now - lastLogTime) / (60 * 60 * 1000));
        const numMessages = Math.min(Math.floor(hoursGone / 3), 5); // One message every 3 hours, max 5
        
        for (let i = 0; i < numMessages; i++) {
            const timestamp = new Date(lastLogTime.getTime() + 
                (i + 1) * (now - lastLogTime) / (numMessages + 1));
            messages.push({
                text: this.responseEngine.pickRandom(this.RANDOM_MESSAGES),
                timestamp: timestamp.getTime()
            });
        }

        // Add meal reminders
        for (const [meal, time] of Object.entries(this.MEAL_TIMES)) {
            const mealTime = this.generateTimestamp(time.hour, time.spread);
            if (mealTime > lastLogTime && mealTime < now) {
                messages.push({
                    text: this.responseEngine.pickRandom(this.MEAL_REMINDERS[meal]),
                    timestamp: mealTime.getTime()
                });
            }
        }

        // Sort messages by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp);
        return messages;
    }
}

// Export for use in main file
window.LogEngine = LogEngine; 