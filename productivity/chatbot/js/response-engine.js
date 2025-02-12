class ResponseEngine {
    constructor() {
        this.context = {
            lastUserMessage: null,
            lastBotResponse: null,
            messageCount: 0,
            mood: 'happy',
            isAngry: false,
            reconciliationAttempts: 0,
            lastResponseTime: Date.now(),
            silentMinutes: 0,
            desperationLevel: 0,
            timeOfDay: this.getTimeOfDay()
        };

        // Constants for desperation timing
        this.DESPERATION_INTERVAL = 2 * 60 * 1000; // 2 minutes between messages
        this.LAST_RESPONSE_KEY = 'lily_last_response';
        
        // Add last greeting time tracking
        this.LAST_GREETING_KEY = 'lily_last_greeting_time';
        this.GREETING_HISTORY_KEY = 'lily_greeting_history';
        
        // Initialize responses
        this.initializeResponses();
        this.loadGreetingHistory();
    }

    async initializeResponses() {
        try {
            const response = await fetch('data/responses.json');
            const data = await response.json();
            this.responseMap = data.taggedResponses;
            this.timeBasedGreetings = data.timeBasedGreetings;
            this.defaultResponses = data.defaultResponses;
            this.continuationResponses = data.continuationResponses;
            
            // Update desperation responses if available in JSON
            if (data.desperationResponses) {
                this.desperationResponses = data.desperationResponses;
            }
        } catch (error) {
            console.error('Error loading responses:', error);
            // Fallback to default responses already set in constructor
            this.responseMap = {};
            this.timeBasedGreetings = { morning: [], afternoon: [], evening: [], night: [] };
            this.defaultResponses = ["Hi! 💖"];
            this.continuationResponses = ["Aur batao... 💕"];
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

    detectAnger(message) {
        const angerKeywords = [
            'angry', 'gussa', 'naraz', 'hate', 'nafrat', 'shut up', 'chup', 
            'leave me', 'go away', 'door', 'dur', 'bhago', 'irritating', 
            'annoying', 'pagal', 'stupid', 'idiot', 'nonsense', 'bakwas'
        ];
        
        const lowerMessage = message.toLowerCase();
        return angerKeywords.some(keyword => lowerMessage.includes(keyword));
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

    checkSilentPeriod() {
        const lastResponse = localStorage.getItem(this.LAST_RESPONSE_KEY);
        if (!lastResponse) return 0;
        
        const minutesSinceResponse = (Date.now() - parseInt(lastResponse)) / (60 * 1000);
        return Math.floor(minutesSinceResponse);
    }

    updateLastResponseTime() {
        localStorage.setItem(this.LAST_RESPONSE_KEY, Date.now().toString());
        this.context.silentMinutes = 0;
        this.context.desperationLevel = 0;
    }

    getDesperationResponse() {
        const silentMinutes = this.checkSilentPeriod();
        
        // Increase desperation level based on silence duration
        if (silentMinutes > 30) {
            this.context.desperationLevel = 4;
        } else if (silentMinutes > 20) {
            this.context.desperationLevel = 3;
        } else if (silentMinutes > 10) {
            this.context.desperationLevel = 2;
        } else if (silentMinutes > 5) {
            this.context.desperationLevel = 1;
        } else {
            this.context.desperationLevel = 0;
        }

        // Ensure we have valid responses
        if (!this.desperationResponses || !this.desperationResponses[this.context.desperationLevel]) {
            return "Miss you... Please come back! 💕";
        }

        // Get responses for current desperation level
        const responses = this.desperationResponses[this.context.desperationLevel];
        return this.pickRandom(responses);
    }

    getResponse(userMessage) {
        if (userMessage) {
            // Reset desperation when user responds
            this.updateLastResponseTime();
            this.updateContext(userMessage);

            // Check for anger first
            if (this.detectAnger(userMessage)) {
                this.context.isAngry = true;
                this.context.reconciliationAttempts++;
                const angryResponses = this.responseMap['angry,gussa,naraz,angry with you,tumse naraz'];
                if (angryResponses) {
                    if (this.context.reconciliationAttempts > 3) {
                        return this.responseMap['angry,gussa,naraz,angry with you,tumse naraz'][
                            Math.floor(Math.random() * 3)
                        ];
                    }
                    return this.pickRandom(angryResponses);
                }
            } else if (this.context.isAngry) {
                this.context.isAngry = false;
                this.context.reconciliationAttempts = 0;
                return "Thank you jaan for forgiving me! I promise aage se aisa nahi hoga! 🥺💕";
            }

            // Check for tag-based responses
            const matchedResponses = this.findMatchingTags(userMessage);
            if (matchedResponses) {
                return this.pickRandom(matchedResponses);
            }

            // Default responses
            return this.pickRandom(this.defaultResponses || ["Hi! 💖"]);
        } else {
            // Generate desperate response when checking for silence
            return this.getDesperationResponse();
        }
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