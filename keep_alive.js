const express = require('express');
const { spawn } = require('child_process');
const app = express();
const PORT = 3000; // আপনার পছন্দের পোর্ট

// "I'm alive!" শো করার জন্য রুট
app.get('/', (req, res) => {
    res.send("I'm alive!");
});

// সার্ভার চালু করা
app.listen(PORT, () => {
    console.log(`✅ Keep Alive Server is running at http://localhost:${PORT}`);
    runAdScript(); // ad.js চালানো
});

// ad.js চালানোর ফাংশন
function runAdScript() {
    const adProcess = spawn('node', ['ad.js']);

    adProcess.stdout.on('data', (data) => {
        console.log(`🟢 ad.js Output: ${data}`);
    });

    adProcess.stderr.on('data', (data) => {
        console.error(`🔴 ad.js Error: ${data}`);
    });

    adProcess.on('close', (code) => {
        console.log(`⚠️ ad.js process exited with code ${code}`);
        console.log("🔄 ad.js পুনরায় চালানো হচ্ছে...");
        runAdScript(); // যদি বন্ধ হয়, পুনরায় চালানো হবে
    });
}
