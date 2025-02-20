const fs = require("fs");
const login = require("ws3-fca");
const axios = require("axios");

// API URLs
const API_URL = "http://tasikofficial.com/tasikai.php?q=";
const UID_API_URL = "https://tasikofficial.com/ffinfo.php?uid=";

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

// UID চেক ফাংশন
async function checkUID(uid) {
    try {
        const response = await axios.get(`${UID_API_URL}${encodeURIComponent(uid)}`);
        if (response.data.error) {
            return null; // যদি error থাকে, কিছু পাঠানো হবে না
        }
        return response.data.response || "দুঃখিত, আমি এখন UID এর জন্য কোনো তথ্য খুঁজে পাচ্ছি না।";
    } catch (error) {
        console.error("UID API Error:", error);
        return null;
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

        switch (event.type) {
            case "message":
                if (event.body === "/stop") {
                    api.sendMessage("Goodbye…", event.threadID);
                    return stopListening();
                }

                // মূল মেসেজ বা রিপ্লাই চেক এবং রেস্পন্স
                (async () => {
                    try {
                        let userMessage = event.body;

                        // যদি এটি কোনো রিপ্লাই মেসেজ হয়
                        if (event.messageReply && event.messageReply.messageID) {
                            const replyMessageID = event.messageReply.messageID;

                            // আসল রিপ্লাই মেসেজ খুঁজে বের করা
                            api.getMessage(replyMessageID, async (err, replyMessage) => {
                                if (!err && replyMessage) {
                                    userMessage = replyMessage.body;
                                }

                                // UID চেক
                                const uidCheckResponse = await checkUID(userMessage);
                                if (uidCheckResponse) {
                                    api.sendMessage(uidCheckResponse, event.threadID);
                                } else {
                                    const aiResponse = await getAIResponse(userMessage);
                                    api.sendMessage(aiResponse, event.threadID);
                                }
                            });
                        } else {
                            // সাধারণ মেসেজের জন্য
                            const uidCheckResponse = await checkUID(userMessage);
                            if (uidCheckResponse) {
                                api.sendMessage(uidCheckResponse, event.threadID);
                            } else {
                                const aiResponse = await getAIResponse(userMessage);
                                api.sendMessage(aiResponse, event.threadID);
                            }
                        }
                    } catch (error) {
                        console.error("Error in AI Response:", error);
                        api.sendMessage("দুঃখিত, আমি এখন উত্তর দিতে পারছি না।", event.threadID);
                    }
                })();
                break;

            case "event":
                console.log(event);
                break;
        }
    });
});
