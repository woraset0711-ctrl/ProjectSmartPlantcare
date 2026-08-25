console.log("Smart Plant Care - History");

function openMenu() {
    document.getElementById("sidebar").classList.add("active");
    document.getElementById("overlay").classList.add("active");
}

function closeMenu() {
    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}

// ===== ชื่อเดือนภาษาไทย =====
const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

// แปลงวันที่ (Date object) เป็นข้อความไทย เช่น "27 กรกฎาคม 2569"
function formatThaiDate(date) {
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const buddhistYear = date.getFullYear() + 543;
    return `${day} ${month} ${buddhistYear}`;
}

// แปลง Date เป็น string รูปแบบ yyyy-mm-dd (สำหรับ input[type=date] และคีย์วันที่ที่ส่งให้ Apps Script)
function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// ===== ดึงประวัติจริงจาก Google Sheet ผ่าน Apps Script (action=history) =====
async function fetchHistoryByDate(dateKey) {
    const res = await callSmartPlantAPI("history", { date: dateKey });

    if (!res.ok) {
        throw new Error(res.error || "โหลดข้อมูลไม่สำเร็จ");
    }

    return res.data; // array ของ { timestamp, date, time, device_id, raw, moisture, status }
}

function renderHistoryList(items) {
    const listEl = document.getElementById("historyList");

    if (!items || items.length === 0) {
        listEl.innerHTML = `<p class="no-data">ไม่มีข้อมูลในวันที่นี้</p>`;
        return;
    }

    listEl.innerHTML = items.map((item, i) => `
        <div class="history-item" style="animation-delay:${i * 0.06}s">
            <div class="history-icon sensor">📶</div>
            <div class="history-info">
                <h3>ตรวจวัดความชื้น (${item.status})</h3>
                <p>ความชื้นดิน ${item.moisture}%</p>
            </div>
            <div class="history-time">${item.time}</div>
        </div>
    `).join("");
}

async function loadAndRenderHistory(dateKey) {
    const listEl = document.getElementById("historyList");
    listEl.innerHTML = `<p class="no-data">กำลังโหลดข้อมูล...</p>`;

    try {
        const items = await fetchHistoryByDate(dateKey);
        renderHistoryList(items);
    } catch (err) {
        console.error(err);
        listEl.innerHTML = `<p class="no-data">โหลดข้อมูลไม่สำเร็จ<br>${err.message}</p>`;
    }
}

// ===== ตั้งค่าเริ่มต้นเมื่อโหลดหน้า =====
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    const todayKey = toDateKey(today);

    // ตั้งค่า input[type=date] ให้เป็นวันนี้
    const datePicker = document.getElementById("datePicker");
    datePicker.value = todayKey;
    datePicker.max = todayKey; // กันเลือกวันในอนาคต

    // แสดงข้อความวันที่แบบไทย
    document.getElementById("selectedDateText").textContent = formatThaiDate(today);

    // แสดงรายการของวันนี้ (ข้อมูลจริงจาก Sheet)
    loadAndRenderHistory(todayKey);

    // เมื่อผู้ใช้เลือกวันที่ใหม่
    datePicker.addEventListener("change", () => {
        const selected = new Date(datePicker.value + "T00:00:00");
        document.getElementById("selectedDateText").textContent = formatThaiDate(selected);
        loadAndRenderHistory(datePicker.value);
    });
});
