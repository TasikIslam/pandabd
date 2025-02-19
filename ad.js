const fs = require("fs");
const axios = require("axios");
const login = require("ws3-fca");

// নতুন API URL (Localhost)
const API_URL = "http://tasikofficial.com/tasikai.php?q=";

// AI থেকে উত্তর আনার ফাংশন
async function getAIResponse(userQuestion) {
    try {
        const response = await axios.get(`${API_URL}${encodeURIComponent(userQuestion)}`);
        return response.data.response || "দুঃখিত, আমি এখন উত্তর দিতে পারছি না।";
    } catch (error) {
        console.error("API Error:", error);
        return "দুঃখিত, সার্ভার সমস্যা হচ্ছে।";
    }
}

// ফেসবুক লগইন
login({ appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8')) }, (err, api) => {
    if (err) return console.error("Login Error:", err);

    api.setOptions({ listenEvents: true });

    var stopListening = api.listenMqtt((err, event) => {
        if (err) {
            console.error("Event Error:", err);
            return;
        }

        api.markAsRead(event.threadID, (err) => {
            if (err) console.error("Mark as Read Error:", err);
        });

        if (event.type === "message") {
            // ইউজারের মেসেজের রিপ্লাই হিসেবে উত্তর পাঠানো
            (async () => {
                try {
                    const aiResponse = await getAIResponse(event.body);
                    api.sendMessage(
                        {
                            body: aiResponse,
                            replyToMessage: event.messageID // আগের মেসেজের রিপ্লাই হিসেবে পাঠাবে
                        },
                        event.threadID
                    );
                } catch (error) {
                    console.error("Error in AI Response:", error);
                    api.sendMessage("দুঃখিত, আমি এখন উত্তর দিতে পারছি না।", event.threadID);
                }
            })();
        }
    });
});
