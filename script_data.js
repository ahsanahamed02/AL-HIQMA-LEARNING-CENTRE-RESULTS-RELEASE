// ====== API URL ======
const API_URL = "https://script.google.com/macros/s/AKfycbwf_cGut3ILVZ5zkHh0VQGvnC3JDq_qCvwHZUD17Qls2HSy99R0za6Pbz1aqFv0dCtZ/exec";

// ====== Fetch result for an index ======
async function getResultData(index, exam = "G.C.E. (O/L) EXAMINATION", year = "2025") {
    try {
        const response = await fetch(`${API_URL}?index=${encodeURIComponent(index)}&exam=${encodeURIComponent(exam)}&year=${encodeURIComponent(year)}&ua=${navigator.userAgent}`);
        const data = await response.json();
        return data; // either student data or {error: "..."}
    } catch (err) {
        console.error("Fetch Error:", err);
        return { error: "Failed to fetch data. Please try again later." };
    }
}
