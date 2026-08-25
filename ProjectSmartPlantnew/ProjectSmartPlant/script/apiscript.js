// ===== ตั้งค่า URL ของ Google Apps Script Web App =====
// URL เดียวกับที่ ESP32 ใช้ส่งข้อมูลเข้า (ตัวเดียวกับ SCRIPT_URL ในโค้ดบอร์ด)
const API_URL = "https://script.google.com/macros/s/AKfycbxD7CTwVsDvOLTcLzacAK5bRyk8wGJL7u4DbeUAbXpWfQT8EVi45GsaN0pM30xByWR-/exec";

/**
 * เรียก Google Apps Script (Code.gs) ผ่านวิธี JSONP แทนการ fetch() ตรงๆ
 * เหตุผล: เว็บแอปของ Apps Script มักไม่ส่ง header Access-Control-Allow-Origin
 * กลับมา ทำให้ fetch() จากหน้าเว็บที่คนละ origin (เช่น 127.0.0.1:5500) โดน CORS บล็อก
 * ฝั่ง Code.gs รองรับพารามิเตอร์ ?callback=xxx อยู่แล้ว (ฟังก์ชัน apiResponse)
 * จึงใช้วิธีแทรก <script> tag แทน ซึ่งไม่ติดปัญหา CORS
 *
 * @param {string} action  - "health" | "latest" | "history"
 * @param {object} extraParams - พารามิเตอร์เพิ่มเติม เช่น { date: "2026-08-02" }
 * @returns {Promise<object>} payload ที่ Code.gs ส่งกลับ
 */
function callSmartPlantAPI(action, extraParams = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = "spCallback_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);

    const script = document.createElement("script");

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("หมดเวลาเชื่อมต่อ Google Apps Script (timeout)"));
    }, 10000);

    function cleanup() {
      clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = function (data) {
      cleanup();
      resolve(data);
    };

    script.onerror = function () {
      cleanup();
      reject(new Error("เชื่อมต่อ Google Apps Script ไม่สำเร็จ"));
    };

    const params = new URLSearchParams({ action, callback: callbackName, ...extraParams });
    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
  });
}
