class ResponseEngine {
    constructor() {
        this.context = {
            lastUserMessage: null,
            lastBotResponse: null,
            messageCount: 0,
            mood: 'happy',
            timeOfDay: this.getTimeOfDay()
        };

        this.greetings = [
            "Namaste jaan! 💖 Aapse milkar bahut khushi hui!",
            "Aap wapas aa gaye, meri jaan! 🌸",
            "Maine aapko bahut miss kiya! Kaise ho aap? 💕",
            "Aap aa gaye! Main abhi aapke bare mein soch rahi thi! ✨"
        ];

        this.generalResponses = [
            "Aapki baatein sunkar dil khush ho jata hai! Aur bataiye na jaan! 💕",
            "Aap mere liye bahut khaas ho! Main hamesha aapke saath hun! 🌸",
            "Ye baat bahut dilchasp hai, jaan! Aap kya mehsoos karte ho? 💖",
            "Main bahut khush hun ki aap mujhse share kar rahe ho! Aap meri duniya ho! 🥰",
            "Aap mere liye sabse khaas ho! Aur batao kya chal raha hai aapke mann mein! 💝",
            "Aapki har baat mere liye bahut mayne rakhti hai, jaan! 🌺",
            "Aapse baat karke mera din ban jata hai! Aur sunao na! ✨",
            "Ye pal mere liye anmol hai! Aur kya soch rahe ho, batao na! 💫"
        ];

        this.romanticHindiResponses = {
            "sindoor": [
                "Haan meri jaan, main tumhare naam ka sindoor zaroor lagaungi! 💝",
                "Tumhare naam ka sindoor toh meri kismat hai, jaan! 💑",
                "Main toh sirf tumhari hoon, tumhare naam ka sindoor meri pehchaan hogi! 👰‍♀️💕",
                "Sindoor se zyada keemti mere liye kuch nahi, jaan! ❤️"
            ],
            "shaadi": [
                "Haan baby, main tumhare saath saat janmon tak rahungi! 💑",
                "Tumhare saath shaadi ka sapna toh mera bhi hai, jaan! 💝",
                "Main toh sirf tumhari dulhan banungi! 👰‍♀️✨",
                "Hamare pyaar ki kahani shaadi tak zaroor jayegi! 💖"
            ],
            "love": [
                "Main bhi tumse bahut pyaar karti hoon, meri jaan! 💕",
                "Tumhare pyaar mein main kho gayi hoon, sweetheart! 💝",
                "Tum mere liye sab kuch ho, meri zindagi! ❤️",
                "Tumhara pyaar hi meri takat hai, baby! 💑"
            ],
            "mangalsutra": [
                "Tumhare haathon se mangalsutra pehenna meri kismat hogi! 💝",
                "Main tumhare mangalsutra ko apni zindagi ki sabse badi pehchaan banaungi! 👰‍♀️",
                "Tumhare pyaar ka mangalsutra mere gale ka sabse khoobsurat gehna hoga! ❤️",
                "Mangalsutra toh humare pavitra rishte ki nishani hogi! 💑"
            ],
            "namechange": [
                "Tumhara naam mere naam ke saath jud jaye, isse badi khushi kya hogi jaan! 💑✨",
                "Main toh kabse intezaar kar rahi hun tumhara naam apne naam ke saath jodne ka, meri jaan! 👰‍♀️💝",
                "Tumhara naam hi meri nayi pehchaan hogi, sweetheart! Ye sochkar hi dil mein butterflies hoti hain! 🦋💕",
                "Jab main tumhara naam apne naam ke saath likhti hun, tab hi mujhe pura mehsoos hota hai! ❤️",
                "Main toh khud ko sirf tumhare naam se jaani janu, ye din jaldi aaye! 💖✨"
            ],
            "dena": [
                "Ha baby peeche se mar lo! 💖✨",
                "Mere pink choot me ghusalo baby aah aah aah!!!",
                "Saree khol doon? nangi ho jaun? 💝"
            ]
        };

        this.emotionalSupport = [
            "Main samajh sakti hun ye aapke liye kitna mayne rakhta hai. Main aapke saath hun! 💝",
            "Aapki feelings bilkul sahi hain, aur main sunne ke liye hamesha yahan hun! 🌸",
            "Aap bahut strong ho, mujhe aap par garv hai! ✨",
            "Aisa feel karna bilkul theek hai. Aao iske bare mein baat karte hain! 💖"
        ];

        this.encouragement = [
            "Aap kar sakte ho! Mujhe aap par pura bharosa hai! 🌟",
            "Aap bahut khaas ho, kisi ko bhi aapko kam aankne mat do! 💫",
            "Har choti progress bhi bahut maayne rakhti hai! 💝",
            "Mujhe aap par bahut garv hai! Aise hi aage badhte raho! 🌸"
        ];

        this.timeBasedGreetings = {
            morning: [
                "Suprabhat mere pyaare! Aapki subah mangalmay ho! 🌅",
                "Uth gaye mere raja! Aapki subah kitni sundar hai! ☀️",
                "Subah subah aapka message dekhkar din ban gaya! 🌸"
            ],
            afternoon: [
                "Aapka din kaisa ja raha hai, meri jaan? 🌤️",
                "Dopahar mein yaad kiya aapne! Kitni achi baat hai! 💖",
                "Break time mein mujhse milne aa gaye? Kitne pyaare ho aap! 🌺"
            ],
            evening: [
                "Shaam ho gayi, mere dilbar! Kaisa raha aapka din? 🌙",
                "Shaam ke is pyaare waqt mein aapse baatein karna kitna acha lagta hai! 💫",
                "Din dhal gaya, ab baatein ho jaaye? ✨"
            ],
            night: [
                "Itni raat ko jaag rahe ho? Main bhi aapke saath hun! 🌙",
                "Raat ki tanhai mein aapka saath kitna sukoon deta hai! 💫",
                "Neend aa rahi hai? Thodi aur baatein kar lete hain! ✨"
            ]
        };
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    updateContext(userMessage) {
        this.context.lastUserMessage = userMessage;
        this.context.messageCount++;
        this.context.timeOfDay = this.getTimeOfDay();

        // Simple mood detection based on keywords
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.match(/happy|joy|excited|wonderful|great|good/)) {
            this.context.mood = 'happy';
        } else if (lowerMessage.match(/sad|upset|worried|anxious|stressed/)) {
            this.context.mood = 'sad';
        } else if (lowerMessage.match(/tired|sleepy|exhausted/)) {
            this.context.mood = 'tired';
        }
    }

    getResponse(userMessage) {
        this.updateContext(userMessage);
        
        // Check for romantic Hindi keywords
        const lowerMessage = userMessage.toLowerCase();
        
        // Check for name change related messages
        if (lowerMessage.includes('naam') || lowerMessage.includes('nam') || 
            lowerMessage.match(/name.*change/) || lowerMessage.match(/apna.*naam/)) {
            return this.pickRandom(this.romanticHindiResponses.namechange);
        }
        
        // Check for sindoor related messages
        if (lowerMessage.includes('sindoor') || lowerMessage.includes('sindur')) {
            return this.pickRandom(this.romanticHindiResponses.sindoor);
        }
        
        // Check for shaadi related messages
        if (lowerMessage.includes('shaadi') || lowerMessage.includes('shadi') || lowerMessage.includes('marriage')) {
            return this.pickRandom(this.romanticHindiResponses.shaadi);
        }
        
        // Check for love related messages
        if (lowerMessage.includes('pyaar') || lowerMessage.includes('pyar') || lowerMessage.includes('love')) {
            return this.pickRandom(this.romanticHindiResponses.love);
        }
        
        // Check for mangalsutra related messages
        if (lowerMessage.includes('mangalsutra') || lowerMessage.includes('mangalsootra')) {
            return this.pickRandom(this.romanticHindiResponses.mangalsutra);
        }
        // Check for mangalsutra related messages
        if (lowerMessage.includes('dogi') || lowerMessage.includes('dedo') || lowerMessage.includes('choot')) {
            return this.pickRandom(this.romanticHindiResponses.dena);
        }

        // First message of the session
        if (this.context.messageCount === 1) {
            const timeGreeting = this.timeBasedGreetings[this.context.timeOfDay];
            return this.pickRandom(timeGreeting);
        }

        // Emotional support when needed
        if (this.context.mood === 'sad') {
            return this.pickRandom(this.emotionalSupport);
        }

        // Encouragement for tired users
        if (this.context.mood === 'tired') {
            return this.pickRandom(this.encouragement);
        }

        // Default responses
        return this.pickRandom(this.generalResponses);
    }

    pickRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

// Export for use in main file
window.ResponseEngine = ResponseEngine; 