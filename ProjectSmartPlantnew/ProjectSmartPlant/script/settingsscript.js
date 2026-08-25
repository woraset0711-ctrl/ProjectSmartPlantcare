console.log("Smart Plant Care - Settings");

const API_KEY = "9nG2#kL8xPq41A@plant"; // ต้องตรงกับ API_KEY ใน Code.gs และ .ino

function openMenu() {
    document.getElementById("sidebar").classList.add("active");
    document.getElementById("overlay").classList.add("active");
}

function closeMenu() {
    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}

const wateringTime1Input = document.getElementById("wateringTime1");
const wateringTime2Input = document.getElementById("wateringTime2");
const moistureThresholdInput = document.getElementById("moistureThreshold");
const moistureTargetInput = document.getElementById("moistureTarget");
const waterDurationSecInput = document.getElementById("waterDurationSec");
const notifyToggle = document.getElementById("notifyToggle");
const notifyStatus = document.getElementById("notifyStatus");
const savedMsg = document.getElementById("savedMsg");

let lastNotifiedMinute = null;

// ===== โหลดค่าที่เคยบันทึกไว้ (จาก Google Sheet เป็นหลัก) =====
async function loadSettings() {
    const savedNotify = localStorage.getItem("notifyEnabled") === "true";
    notifyToggle.checked = savedNotify;
    updateNotifyStatusText();

    try {
        const result = await callSmartPlantAPI("settings");
        if (result && result.ok) {
            wateringTime1Input.value = result.wateringTime1;
            wateringTime2Input.value = result.wateringTime2;
            moistureThresholdInput.value = result.moistureThreshold;
            moistureTargetInput.value = result.moistureTarget;
            waterDurationSecInput.value = result.waterDurationSec;
        }
    } catch (err) {
        console.error("โหลดการตั้งค่าจาก Sheet ไม่สำเร็จ:", err);
    }
}

function updateNotifyStatusText() {
    if (!notifyToggle.checked) {
        notifyStatus.textContent = "ยังไม่เปิดใช้งาน";
    } else if (Notification.permission === "granted") {
        notifyStatus.textContent = "เปิดใช้งานอยู่ (ต้องเปิดแท็บนี้ค้างไว้)";
    } else {
        notifyStatus.textContent = "ต้องอนุญาตการแจ้งเตือนก่อน";
    }
}

notifyToggle.addEventListener("change", async () => {
    if (notifyToggle.checked) {
        if (!("Notification" in window)) {
            alert("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
            notifyToggle.checked = false;
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            alert("กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์ เพื่อให้ระบบแจ้งเตือนได้");
            notifyToggle.checked = false;
        }
    }
    updateNotifyStatusText();
});

// ===== บันทึกการตั้งค่า (ส่งไปเก็บที่ Google Sheet ให้ ESP32 อ่านได้) =====
async function saveSettings() {
    localStorage.setItem("notifyEnabled", notifyToggle.checked);
    updateNotifyStatusText();

    const threshold = Number(moistureThresholdInput.value);
    const target = Number(moistureTargetInput.value);

    if (target <= threshold) {
        alert("ค่า \"รดจนกว่าความชื้นจะถึง\" ต้องมากกว่าค่า \"รดเมื่อความชื้นต่ำกว่า\"");
        return;
    }

    try {
        await callSmartPlantAPI("save_settings", {
            api_key: API_KEY,
            wateringTime1: wateringTime1Input.value,
            wateringTime2: wateringTime2Input.value,
            moistureThreshold: moistureThresholdInput.value,
            moistureTarget: moistureTargetInput.value,
            waterDurationSec: waterDurationSecInput.value
        });

        savedMsg.classList.add("show");
        setTimeout(() => savedMsg.classList.remove("show"), 2000);
    } catch (err) {
        alert("บันทึกไม่สำเร็จ: " + err.message);
    }
}

function checkWateringTime() {
    const notifyEnabled = localStorage.getItem("notifyEnabled") === "true";
    if (!notifyEnabled) return;
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const currentTime =
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0");

    if ((currentTime === wateringTime1Input.value || currentTime === wateringTime2Input.value)
        && lastNotifiedMinute !== currentTime) {
        new Notification("Smart Plant Care 🌱", {
            body: "ถึงเวลารดน้ำต้นไม้แล้วนะ"
        });
        lastNotifiedMinute = currentTime;
    }
}

loadSettings();
setInterval(checkWateringTime, 20000);