class ResponseEngine {
    constructor() {
        this.context = {
            lastUserMessage: null,
            lastBotResponse: null,
            messageCount: 0,
            mood: 'happy',
            timeOfDay: this.getTimeOfDay()
        };

        // Add last greeting time tracking
        this.LAST_GREETING_KEY = 'lily_last_greeting_time';
        this.GREETING_HISTORY_KEY = 'lily_greeting_history';
        
        // Initialize responses
        this.loadResponses();
        this.loadGreetingHistory();
    }

    async loadResponses() {
        try {
            const response = await fetch('data/responses.json');
            const data = await response.json();
            this.responseMap = data.taggedResponses;
            this.timeBasedGreetings = data.timeBasedGreetings;
            this.defaultResponses = data.defaultResponses;
            this.continuationResponses = data.continuationResponses;
        } catch (error) {
            console.error('Error loading responses:', error);
            // Fallback to empty responses if file can't be loaded
            this.responseMap = {};
            this.timeBasedGreetings = { morning: [], afternoon: [], evening: [], night: [] };
            this.defaultResponses = [];
            this.continuationResponses = [];
        }
    }

    loadGreetingHistory() {
        const stored = localStorage.getItem(this.GREETING_HISTORY_KEY);
        this.greetingHistory = stored ? JSON.parse(stored) : {};
    }

    saveGreetingHistory() {
        localStorage.setItem(this.GREETING_HISTORY_KEY, JSON.stringify(this.greetingHistory));
    }

    wasGreetingUsedRecently(greeting) {
        const lastUsed = this.greetingHistory[greeting];
        if (!lastUsed) return false;
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return lastUsed > oneHourAgo;
    }

    updateGreetingHistory(greeting) {
        this.greetingHistory[greeting] = Date.now();
        this.saveGreetingHistory();
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    findMatchingTags(message) {
        if (!this.responseMap) return null;
        
        const lowerMessage = message.toLowerCase();
        for (const [tags, responses] of Object.entries(this.responseMap)) {
            const tagArray = tags.split(',');
            if (tagArray.some(tag => lowerMessage.includes(tag.trim()))) {
                return responses;
            }
        }
        return null;
    }

    shouldGreet() {
        const lastGreetingTime = localStorage.getItem(this.LAST_GREETING_KEY);
        if (!lastGreetingTime) return true;
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return parseInt(lastGreetingTime) < oneHourAgo;
    }

    updateLastGreetingTime() {
        localStorage.setItem(this.LAST_GREETING_KEY, Date.now().toString());
    }

    getResponse(userMessage) {
        this.updateContext(userMessage);

        // First message of the session - check if we should greet
        if (this.context.messageCount === 1) {
            if (this.shouldGreet()) {
                const timeGreeting = this.timeBasedGreetings[this.context.timeOfDay];
                this.updateLastGreetingTime();
                return this.pickRandom(timeGreeting);
            } else {
                // Skip greeting and use a continuation response
                return this.pickRandom(this.continuationResponses);
            }
        }

        // Check for tag-based responses
        const matchedResponses = this.findMatchingTags(userMessage);
        if (matchedResponses) {
            return this.pickRandom(matchedResponses);
        }

        // Default responses
        return this.pickRandom(this.defaultResponses);
    }

    updateContext(userMessage) {
        this.context.lastUserMessage = userMessage;
        this.context.messageCount++;
        this.context.timeOfDay = this.getTimeOfDay();
    }

    pickRandom(array) {
        if (!array || array.length === 0) return "Hi! 💖";
        return array[Math.floor(Math.random() * array.length)];
    }
}

// Export for use in main file
window.ResponseEngine = ResponseEngine; 