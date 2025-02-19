const fs = require("fs");
const axios = require("axios");
const login = require("ws3-fca");

// নতুন API URL (Localhost)
const API_URL = "http://tasikofficial.com/tasikai.php?q=";
const ADMIN_UID = "100043708143528"; // শুধুমাত্র এই UID-এর জন্য /pause ও /start কার্যকর হবে

let botActive = true; // ডিফল্টভাবে বট চালু থাকবে

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
    if (err) return console.error(err);

    api.setOptions({ listenEvents: true });

    var stopListening = api.listenMqtt(async (err, event) => {
        if (err) return console.error(err);

        api.markAsRead(event.threadID, (err) => {
            if (err) console.error(err);
        });

        if (event.type === "message") {
            // শুধুমাত্র অ্যাডমিন `/pause` এবং `/start` কমান্ড দিতে পারবে
            if (event.senderID === ADMIN_UID) {
                if (event.body === "/pause") {
                    botActive = false;
                    return api.sendMessage("🤖 বট এখন **Pause** মোডে রয়েছে!", event.threadID, event.messageID);
                }
                if (event.body === "/start") {
                    botActive = true;
                    return api.sendMessage("🤖 বট আবার **Start** হলো!", event.threadID, event.messageID);
                }
            }

            // যদি বট বন্ধ থাকে, তাহলে আর কোনো মেসেজের উত্তর দেবে না
            if (!botActive) return;

            // ইউজারের মেসেজের রিপ্লাই হিসেবে উত্তর পাঠানো
            const aiResponse = await getAIResponse(event.body);
            api.sendMessage(
                {
                    body: aiResponse,
                    replyToMessage: event.messageID // আগের মেসেজের রিপ্লাই হিসেবে পাঠাবে
                },
                event.threadID
            );
        }
    });
});