// ====== Elements ======
const searchForm = document.getElementById("search-form");
const examSelect = document.getElementById("examSelect");
const yearSelect = document.getElementById("yearSelect");
const indexInput = document.getElementById("indexInput");
const humanCheck = document.getElementById("humanCheck");
const studentInfo = document.getElementById("student-info");
const resultsBody = document.getElementById("results-body");
const summaryInfo = document.getElementById("summary-info");
const resultsSection = document.getElementById("results-section");
const loadingSpinner = document.getElementById("loading-spinner");
const errorMessage = document.getElementById("error-message");
const printBtn = document.getElementById("printBtn");
let messageTimer = null;

const allowedCombinations = [
    { exam: "G.C.E. (O/L) EXAMINATION", year: "2025" },
    { exam: "G.C.E. (O/L) EXAMINATION", year: "2024" },
    { exam: "G.C.E. (A/L) EXAMINATION", year: "2023" }
];

// ====== Replace with YOUR Google Apps Script Web App URL ======
const API_URL = "https://script.google.com/macros/s/AKfycbxh7fklk9p309zKLYomiHG5XvQB7Ym-bmOvtvF3TYarZ5x7_9Tp0BnpArgiO1Q-qx_Zvw/exec";

// ====== Event Listeners ======
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    hideMessage();
    if (validateForm()) {
        fetchResult();
    }
});

["change", "input"].forEach(evt => {
    examSelect?.addEventListener(evt, hideMessage);
    yearSelect?.addEventListener(evt, hideMessage);
    indexInput?.addEventListener(evt, hideMessage);
});

printBtn.addEventListener("click", () => {
    // Optional: show spinner briefly before printing
    showSpinner();
    setTimeout(() => {
        window.print();
        hideSpinner();
    }, 150);
});

// ====== Spinner / Messages ======
function showSpinner() {
    loadingSpinner.classList.remove("hidden");
}

function hideSpinner() {
    loadingSpinner.classList.add("hidden");
}

function showMessage(type, msg) {
    clearTimeout(messageTimer);
    errorMessage.textContent = msg;
    errorMessage.classList.remove("hidden", "hide", "error", "success");
    errorMessage.classList.add(type === "success" ? "success" : "error");
    messageTimer = setTimeout(() => hideMessage(false), 4000);
}

function showError(msg) {
    showMessage("error", msg);
}

function showSuccess(msg) {
    showMessage("success", msg);
}

function hideMessage(immediate = true) {
    clearTimeout(messageTimer);
    if (errorMessage.classList.contains("hidden")) return;
    if (immediate) {
        errorMessage.classList.add("hidden");
        errorMessage.classList.remove("hide");
    } else {
        errorMessage.classList.add("hide");
        setTimeout(() => {
            errorMessage.classList.add("hidden");
            errorMessage.classList.remove("hide");
        }, 400);
    }
}

const validateForm = () => {
    const selectedExam = examSelect?.value || "";
    const selectedYear = yearSelect?.value || "";
    const index = indexInput?.value.trim();

    if (!selectedExam) {
        showError("Please select the examination.");
        return false;
    }

    if (!selectedYear) {
        showError("Please select the examination year.");
        return false;
    }

    const isValidCombination = allowedCombinations.some(
        ({ exam, year }) => exam === selectedExam && year === selectedYear
    );

    if (!isValidCombination) {
        showError("Results are available only for published exam/year combinations.");
        return false;
    }

    if (!index) {
        showError("Please enter your Index Number.");
        return false;
    }

    if (humanCheck && !humanCheck.checked) {
        showError("Please confirm that you are human.");
        return false;
    }

    return true;
};

// ====== Fetch Result from API ======
const fetchResult = async () => {
    const index = indexInput.value.trim();
    const selectedExam = examSelect.value;
    const selectedYear = yearSelect.value;

    showSpinner();
    resultsSection.classList.remove("show");
    resultsSection.classList.add("hidden");

    try {
        const query = new URLSearchParams({
            index,
            exam: selectedExam,
            year: selectedYear,
            ua: navigator.userAgent
        }).toString();

        const response = await fetch(`${API_URL}?${query}`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        showSuccess("Results found. Scroll down to view details.");
        displayResults(data);
    } catch (err) {
        console.error("Fetch Error:", err);
        showError("An error occurred while fetching results. Please try again later.");
    } finally {
        hideSpinner();
    }
};

// ====== Display Results ======
const displayResults = (data) => {
    resultsSection.classList.remove("hidden");
    requestAnimationFrame(() => resultsSection.classList.add("show"));

    // --- Student Info ---
    studentInfo.innerHTML = `
        <p><strong>Name:</strong> ${data.Name || "N/A"}</p>
        <p><strong>Index Number:</strong> ${data.Index || "N/A"}</p>
    `;

    // --- Mandatory Subjects ---
    resultsBody.innerHTML = "";
    const mandatorySubjects = [
        { name: data.Religion, fallback: "Religion", marks: data.Religion_Marks },
        { name: data.MotherLanguage, fallback: "Mother Language", marks: data.MotherLanguage_Marks },
        { name: "English", fallback: "English", marks: data.English },
        { name: "Mathematics", fallback: "Mathematics", marks: data.Mathematics },
        { name: "Science", fallback: "Science", marks: data.Science },
        { name: "History", fallback: "History", marks: data.History }
    ];

    const grades = [];
    let totalSubjects = 0;
    let totalMarks = 0;
    let countedMarks = 0;

    const processSubject = (subjectName, marks, fallbackName = "Subject") => {
        const label = subjectName || fallbackName;
        if (!label) return;

        totalSubjects++;

        let displayMarks = marks;
        let numericMarks = null;
        if (marks === undefined || marks === "") {
            displayMarks = "Absent";
        } else {
            const parsedMarks = Number(marks);
            if (!Number.isNaN(parsedMarks)) {
                numericMarks = parsedMarks;
                displayMarks = parsedMarks.toString();
                totalMarks += parsedMarks;
                countedMarks++;
            } else {
                displayMarks = marks;
            }
        }

        let grade = "W";
        if (numericMarks !== null) {
            if (numericMarks >= 75) grade = "A";
            else if (numericMarks >= 65) grade = "B";
            else if (numericMarks >= 50) grade = "C";
            else if (numericMarks >= 35) grade = "S";
            else grade = "W";
        } else if (displayMarks === "Absent") {
            grade = "W";
        }

        grades.push(grade);
        resultsBody.innerHTML += `<tr>
            <td data-label="Subject">${label}</td>
            <td data-label="Marks">${displayMarks}</td>
            <td data-label="Grade">${grade}</td>
        </tr>`;
    };

    mandatorySubjects.forEach(sub => processSubject(sub.name, sub.marks, sub.fallback));

    // --- Basket Subjects ---
    for (let i = 1; i <= 3; i++) {
        const subject = data[`Basket${i}_Subject`];
        const marks = data[`Basket${i}_Marks`];
        if (!subject) continue;
        processSubject(subject, marks, `Basket Subject ${i}`);
    }

    // --- Summary with Grade Counts ---
    const gradeCounts = { A:0, B:0, C:0, S:0, W:0 };
    grades.forEach(g => {
        const grade = g.toString().toUpperCase().trim();
        if (gradeCounts[grade] !== undefined) gradeCounts[grade]++;
    });

    const passedGrades = ['A','B','C','S'];
    const passed = grades.filter(g => passedGrades.includes(g.toString().toUpperCase().trim())).length;
    const failed = grades.length - passed;
    const totalMarksDisplay = countedMarks ? totalMarks.toFixed(0) : "N/A";
    const averageMarks = countedMarks ? (totalMarks / countedMarks).toFixed(2) : "N/A";
    const remarks = failed === 0 ? "Passed" : "Failed";

    const gradeBreakdown = Object.entries(gradeCounts)
        .map(([grade, count]) => `<li><span>${grade}</span><span>${count}</span></li>`)
        .join("");

    summaryInfo.innerHTML = `
        <div class="summary-grid">
            <div class="summary-card">
                <p class="summary-label">Total Subjects</p>
                <p class="summary-value">${totalSubjects}</p>
            </div>
            <div class="summary-card">
                <p class="summary-label">Passes / Fails</p>
                <p class="summary-value">${passed} / ${failed}</p>
            </div>
            <div class="summary-card">
                <p class="summary-label">Total Marks</p>
                <p class="summary-value">${totalMarksDisplay}</p>
            </div>
            <div class="summary-card">
                <p class="summary-label">Average Marks</p>
                <p class="summary-value">${averageMarks}</p>
            </div>
        </div>
        <div class="grade-breakdown">
            <p class="summary-label">Grade Counts</p>
            <ul>${gradeBreakdown}</ul>
        </div>
        <div class="summary-remarks ${remarks.toLowerCase()}">
            <span class="summary-label">Remarks</span>
            <span class="summary-value">${remarks}</span>
        </div>
    `;

    // Make table responsive after adding rows
    makeTableResponsive();
};

// ====== Make Table Responsive ======
const makeTableResponsive = () => {
    const table = document.querySelector("#results-table");
    if(!table) return;
    table.setAttribute("aria-label", "Student Examination Results Table");
};

document.addEventListener("DOMContentLoaded", makeTableResponsive);
