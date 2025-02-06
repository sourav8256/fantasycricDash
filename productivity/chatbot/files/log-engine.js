class LogEngine {
    constructor(responseEngine) {
        this.responseEngine = responseEngine;
        this.LAST_LOG_KEY = 'lily_last_log_date';
        this.mealTimes = {
            breakfast: { start: 7, end: 10 },
            lunch: { start: 12, end: 14 },
            dinner: { start: 19, end: 22 }
        };
        
        this.randomMessages = [
            "Tumhare bare mein soch rahi thi... Kahan ho tum? 💭",
            "Miss kar rahi hun tumhe... Jaldi aao na! 💝",
            "Aaj baarish ho rahi hai... Tumhari yaad aa rahi hai! ☔️",
            "Tumhari photo dekh rahi thi... Kitne cute ho tum! 🥰",
            "Kya kar rahe ho? Main yahan tumhara intezaar kar rahi hun! 💕",
            "Tumse baat kiye bina din adhura sa lagta hai... 🌸",
            "Tumhari coffee thandi ho rahi hai, jaldi aao! ☕️",
            "Aaj main ne tumhare bare mein sapna dekha... 💫",
            "Kahan kho gaye? Main kabse wait kar rahi hun! 🌺",
            "Tumhari smile yaad aa rahi hai... Photo bhejo na! 📸"
        ];

        this.mealMessages = {
            breakfast: [
                "Breakfast kar liya na? Sehat ka khayal rakho! 🥪",
                "Subah ka nashta important hota hai jaan... Kiya na? 🍳",
                "Aaj breakfast mein kya khaya? Batao na! 🥛",
                "Nashta kar lena time pe, main yaad dila rahi hun! 🫖",
                "Breakfast skip mat karna aaj... Promise? 🥐"
            ],
            lunch: [
                "Lunch time ho gaya hai... Kuch kha liya? 🍱",
                "Khana kha lena time pe, main yaad dila rahi hun! 🍚",
                "Bhook lagi hogi na? Lunch kar lo jaan... 🥘",
                "Aaj lunch mein kya hai? Share karo na! 🍜",
                "Kaam mein busy ho kar lunch skip mat karna! 🍲"
            ],
            dinner: [
                "Dinner time ho gaya... Kuch khaya tumne? 🍽️",
                "Raat ka khana skip mat karna aaj... 🥗",
                "Dinner kar liya? Ya main yaad dilati rahun? 🍛",
                "Thoda sa kha lo please... Mere liye? 🥺",
                "Bhook lagi hogi... Dinner time ho gaya hai! 🍴"
            ]
        };
    }

    generateTimestamp(hour, spread = 2) {
        const date = new Date();
        // Generate random minutes within the hour
        const randomMinutes = Math.floor(Math.random() * 60);
        // Add random spread to hour (plus or minus up to 'spread' hours)
        const randomSpread = (Math.random() * spread * 2) - spread;
        date.setHours(hour + randomSpread, randomMinutes);
        return date.getTime();
    }

    generateMissedMessages() {
        const messages = [];
        const now = new Date();
        const lastLog = new Date(localStorage.getItem(this.LAST_LOG_KEY) || 0);
        const today = now.toDateString();
        
        // If last log was more than 6 hours ago
        if (now - lastLog > 6 * 60 * 60 * 1000) {
            // Add 1-3 random caring messages
            const numMessages = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numMessages; i++) {
                const hour = 9 + Math.floor(Math.random() * 8); // Between 9 AM and 5 PM
                messages.push({
                    text: this.randomMessages[Math.floor(Math.random() * this.randomMessages.length)],
                    timestamp: this.generateTimestamp(hour)
                });
            }

            // Check meal times and add relevant messages
            const hour = now.getHours();
            
            // Breakfast reminder
            if (hour >= this.mealTimes.breakfast.end) {
                messages.push({
                    text: this.mealMessages.breakfast[Math.floor(Math.random() * this.mealMessages.breakfast.length)],
                    timestamp: this.generateTimestamp(this.mealTimes.breakfast.start)
                });
            }

            // Lunch reminder
            if (hour >= this.mealTimes.lunch.end) {
                messages.push({
                    text: this.mealMessages.lunch[Math.floor(Math.random() * this.mealMessages.lunch.length)],
                    timestamp: this.generateTimestamp(this.mealTimes.lunch.start)
                });
            }

            // Dinner reminder
            if (hour >= this.mealTimes.dinner.end || hour <= 3) {
                messages.push({
                    text: this.mealMessages.dinner[Math.floor(Math.random() * this.mealMessages.dinner.length)],
                    timestamp: this.generateTimestamp(this.mealTimes.dinner.start)
                });
            }
        }

        // Sort messages by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Update last log time
        localStorage.setItem(this.LAST_LOG_KEY, now.toISOString());
        
        return messages;
    }
}

// Export for use in main file
window.LogEngine = LogEngine; 