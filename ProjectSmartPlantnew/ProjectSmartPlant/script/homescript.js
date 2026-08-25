function openMenu() {
    document.getElementById("sidebar").classList.add("active");
    document.getElementById("overlay").classList.add("active");
}

function closeMenu() {
    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}

// ===== ดึงข้อมูลค่าล่าสุดจากบอร์ด (ผ่าน Google Apps Script) =====
const REFRESH_INTERVAL_MS = 30 * 1000; // ดึงข้อมูลใหม่ทุก 30 วินาที ให้ดูเหมือนเชื่อมต่อตลอด

// ===== มาสคอตแสดงอารมณ์ตามค่าความชื้นในดิน =====
const MOISTURE_LOW = 30;   // ต่ำกว่านี้ = แล้ง / เศร้า
const MOISTURE_HIGH = 70;  // สูงกว่านี้ = แฉะเกิน / มึนงง

function setMascotMood(moisture) {
    const mascot = document.getElementById("homeMascot");
    if (!mascot) return;

    let mood = "mood-happy";
    if (typeof moisture === "number" && !Number.isNaN(moisture)) {
        if (moisture < MOISTURE_LOW) {
            mood = "mood-sad";
        } else if (moisture > MOISTURE_HIGH) {
            mood = "mood-soggy";
        } else {
            mood = "mood-happy";
        }
    }

    mascot.classList.remove("mood-happy", "mood-sad", "mood-soggy");
    mascot.classList.add(mood);
}

function renderLatest(data) {
    const moisture = Number(data.moisture);

    document.getElementById("moisturePercent").textContent = data.moisture;
    document.getElementById("moistureProgress").style.width = data.moisture + "%";
    document.getElementById("moistureStatus").textContent = data.status;
    document.getElementById("lastUpdateTime").textContent = "อัปเดตล่าสุด " + data.time;

    setMascotMood(moisture);

    // ถ้าข้อมูลล่าสุดเก่าเกิน 5 นาที ถือว่าบอร์ดขาดการเชื่อมต่อ/ไม่ได้ส่งข้อมูลมา
    const latestTime = new Date(data.timestamp);
    const diffMinutes = (Date.now() - latestTime.getTime()) / 60000;
    const statusEl = document.getElementById("systemStatusText");
    statusEl.textContent = diffMinutes <= 5 ? "ทำงานปกติ" : "ขาดการเชื่อมต่อกับบอร์ด";
}

async function loadLatest() {
    try {
        const res = await callSmartPlantAPI("latest");

        if (!res.ok) {
            console.error("Apps Script error:", res.error);
            document.getElementById("systemStatusText").textContent = "โหลดข้อมูลไม่สำเร็จ";
            return;
        }

        if (!res.data) {
            document.getElementById("systemStatusText").textContent = "ยังไม่มีข้อมูลจากบอร์ด";
            return;
        }

        renderLatest(res.data);
    } catch (err) {
        console.error(err);
        document.getElementById("systemStatusText").textContent = "เชื่อมต่อ Google Apps Script ไม่สำเร็จ";
    }
}

loadLatest();
setInterval(loadLatest, REFRESH_INTERVAL_MS);

// ===== นาฬิกาเรียลไทม์ (มุมบนของหน้า) =====
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    minutes = minutes < 10 ? "0" + minutes : minutes;

    document.getElementById("realtime").textContent = hours + ":" + minutes;
}

updateClock();
setInterval(updateClock, 1000);