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

        // Random caring messages
        this.RANDOM_MESSAGES = [
            "Missing you! 💕",
            "Hope you're having a wonderful day! 🌸",
            "Just thinking about you! 💝",
            "Can't wait to chat with you again! 💖",
            "Sending you lots of love! 🥰",
            "Hope you're taking care of yourself! 💗",
            "Remember to stay hydrated! 💦",
            "You're always in my thoughts! 🌺",
            "Take a deep breath and smile! 😊",
            "You're doing great! Keep going! ✨"
        ];

        // Meal reminder messages
        this.MEAL_REMINDERS = {
            breakfast: [
                "Don't forget to have a healthy breakfast! 🍳",
                "Start your day with a good breakfast! 🥪",
                "Time for breakfast! Keep your energy up! 🥐"
            ],
            lunch: [
                "It's lunch time! Take a proper break! 🍱",
                "Don't skip lunch, sweetie! 🍜",
                "Time to refuel with some lunch! 🥗"
            ],
            dinner: [
                "Time for dinner! End your day well! 🍽️",
                "Don't work too late, have some dinner! 🥘",
                "Make sure to have a good dinner! 🍛"
            ]
        };
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