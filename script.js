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
const downloadBtn = document.getElementById("downloadBtn");
const copyIndexBtn = document.getElementById("copyIndexBtn");
const shareBtn = document.getElementById("shareBtn");
const subjectSearch = document.getElementById("subject-search");
const examTitleEl = document.getElementById("exam-title");
const backToHomeBtn = document.getElementById("back-to-home");
const performanceChart = document.getElementById("performance-chart");
const resultsTableContainer = document.getElementById("results-table-container");
let messageTimer = null;
let currentSortColumn = null;
let currentSortDirection = 'asc';
let allSubjectData = [];
let marksChart = null;
let currentStudentData = null; // To store fetched data for PDF generation

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

// Back to Home
backToHomeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Optionally reset form
    searchForm?.reset();
    resultsSection?.classList.add("hidden");
});

// Copy Index Number
copyIndexBtn?.addEventListener("click", async () => {
    const indexValue = indexInput.value.trim();
    if (indexValue) {
        try {
            await navigator.clipboard.writeText(indexValue);
            copyIndexBtn.classList.add('copied');
            copyIndexBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyIndexBtn.classList.remove('copied');
                copyIndexBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Index';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
});

// Share Result
shareBtn?.addEventListener("click", async () => {
    const studentName = document.querySelector('#student-info .detail-value')?.textContent || 'Student';
    const indexNumber = indexInput.value.trim();
    const shareText = `Check out my exam results from AL-HIQMA Learning Centre!\nIndex: ${indexNumber}\nName: ${studentName}`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'AL-HIQMA Exam Results',
                text: shareText,
                url: shareUrl
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                fallbackShare(shareText, shareUrl);
            }
        }
    } else {
        fallbackShare(shareText, shareUrl);
    }
});

function fallbackShare(text, url) {
    // Fallback: Copy to clipboard
    const shareData = `${text}\n${url}`;
    navigator.clipboard.writeText(shareData).then(() => {
        shareBtn.classList.add('copied');
        shareBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            shareBtn.classList.remove('copied');
            shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
        }, 2000);
    }).catch(err => {
        console.error('Failed to share:', err);
    });
}

// Print Button
printBtn.addEventListener("click", () => {
    showSpinner();
    setTimeout(() => {
        window.print();
        hideSpinner();
    }, 150);
});

// Download Button
downloadBtn.addEventListener("click", generatePdf);


// Table Sorting
document.querySelectorAll('.table-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const sortType = btn.dataset.sort;
        sortTable(sortType);
        
        // Update active state
        document.querySelectorAll('.table-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Table Header Sorting
document.querySelectorAll('#results-table thead th').forEach(th => {
    th.addEventListener('click', () => {
        const sortType = th.dataset.sort;
        if (sortType) {
            sortTable(sortType);
        }
    });
});

// Subject Search
subjectSearch?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterTable(searchTerm);
});

function sortTable(sortType) {
    const tbody = document.getElementById("results-body");
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (currentSortColumn === sortType) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = sortType;
        currentSortDirection = 'asc';
    }
    
    rows.sort((a, b) => {
        let aVal, bVal;
        
        if (sortType === 'subject') {
            aVal = a.cells[0].textContent.trim();
            bVal = b.cells[0].textContent.trim();
        } else if (sortType === 'marks') {
            aVal = parseFloat(a.cells[1].textContent) || 0;
            bVal = parseFloat(b.cells[1].textContent) || 0;
        } else if (sortType === 'grade') {
            aVal = a.cells[2].textContent.trim();
            bVal = b.cells[2].textContent.trim();
        }
        
        if (sortType === 'marks') {
            return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        } else {
            if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        }
    });
    
    // Clear and re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    
    // Update sort indicators
    document.querySelectorAll('#results-table thead th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === sortType) {
            th.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

function filterTable(searchTerm) {
    const tbody = document.getElementById("results-body");
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const subjectName = row.cells[0].textContent.toLowerCase();
        if (subjectName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

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

        currentStudentData = data; // Store data for PDF
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
    resultsSection.style.opacity = "0";
    resultsSection.style.transform = "translateY(30px)";
    resultsSection.style.transition = "none";
    
    // Fade in animation with smooth easing
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            resultsSection.style.transition = "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
            resultsSection.style.opacity = "1";
            resultsSection.style.transform = "translateY(0)";
            resultsSection.classList.add("show");
        });
    });
    
    // Animate individual cards with staggered delay
    setTimeout(() => {
        const cards = resultsSection.querySelectorAll('.card-section');
        cards.forEach((card, index) => {
            card.style.opacity = "0";
            card.style.transform = "translateY(20px)";
            card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
            
            setTimeout(() => {
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
            }, index * 100);
        });
    }, 200);

    // --- Student Info ---
    const examYear = yearSelect.value || "2025";
    const examType = examSelect.value || "G.C.E. (O/L) EXAMINATION";
    const examTitle = `3rd Term Examination ${examYear} (${parseInt(examYear) + 1}) – O/L Batch`;
    
    // Update exam title in header
    if (examTitleEl) {
        examTitleEl.textContent = examTitle;
    }
    
    studentInfo.innerHTML = `
        <h4 class="section-title"><i class="fas fa-user"></i> Student Details</h4>
        <div class="detail-row student-name-row">
            <span class="detail-label">Name</span>
            <span class="detail-value student-name">${data.Name || "N/A"}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Index Number</span>
            <span class="detail-value">${data.Index || "N/A"}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Class / Grade / Batch</span>
            <span class="detail-value">${data.Class || data.Grade || data.Batch || "O/L Batch"}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Exam Year</span>
            <span class="detail-value">${examYear}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Examination Type</span>
            <span class="detail-value">${examTitle}</span>
        </div>
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
    const marksArray = []; // Store all numeric marks for average calculation
    const subjectData = []; // Store subject data for later processing

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
                marksArray.push(parsedMarks);
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
        
        // Store subject data for later processing
        subjectData.push({
            label,
            displayMarks,
            numericMarks,
            grade
        });
    };

    mandatorySubjects.forEach(sub => processSubject(sub.name, sub.marks, sub.fallback));

    // --- Basket Subjects ---
    for (let i = 1; i <= 3; i++) {
        const subject = data[`Basket${i}_Subject`];
        const marks = data[`Basket${i}_Marks`];
        if (!subject) continue;
        processSubject(subject, marks, `Basket Subject ${i}`);
    }
    
    // Store all subject data for sorting/filtering
    allSubjectData = [...subjectData];
    
    // Calculate average for color coding
    const average = marksArray.length > 0 ? marksArray.reduce((a, b) => a + b, 0) / marksArray.length : 0;
    
    // Now render all subjects with color coding
    resultsBody.innerHTML = '';
    subjectData.forEach(subject => {
        let markColorClass = "";
        if (subject.numericMarks !== null && marksArray.length > 1) {
            if (subject.numericMarks >= average + 10) {
                markColorClass = "marks-high"; // Green for high scores
            } else if (subject.numericMarks <= average - 10) {
                markColorClass = "marks-low"; // Red for low scores
            } else {
                markColorClass = "marks-average"; // Orange for average scores
            }
        } else if (subject.numericMarks !== null) {
            markColorClass = "marks-average";
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Subject">${subject.label}</td>
            <td data-label="Marks" class="${markColorClass}">${subject.displayMarks}</td>
            <td data-label="Grade">${subject.grade}</td>
        `;
        resultsBody.appendChild(row);
    });

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
    const status = failed === 0 ? "Pass" : "Fail";
    
    // Calculate overall grade based on grade distribution
    let overallGrade = "W";
    if (gradeCounts.A >= 3) overallGrade = "A";
    else if (gradeCounts.A + gradeCounts.B >= 3) overallGrade = "B";
    else if (gradeCounts.A + gradeCounts.B + gradeCounts.C >= 3) overallGrade = "C";
    else if (passed >= 6) overallGrade = "S";
    else overallGrade = "W";
    
    // Calculate percentage for progress bar
    const maxPossibleMarks = countedMarks * 100;
    const percentage = maxPossibleMarks > 0 ? (totalMarks / maxPossibleMarks * 100).toFixed(1) : 0;

    // Create grade breakdown string (e.g., "8A 1B" or "6A 1B 1C 1S")
    const gradeBreakdownStr = Object.entries(gradeCounts)
        .filter(([grade, count]) => count > 0 && grade !== 'W')
        .map(([grade, count]) => `${count}${grade}`)
        .join(' ');
    
    const wCount = gradeCounts.W || 0;
    const totalSubjectsCount = totalSubjects;
    
    summaryInfo.innerHTML = `
        <h3 class="summary-title"><i class="fas fa-chart-line"></i> Summary</h3>
        <div class="summary-grid">
            <div class="summary-card">
                <p class="summary-label">Total Marks</p>
                <p class="summary-value">${totalMarksDisplay}</p>
            </div>
            <div class="summary-card">
                <p class="summary-label">Average</p>
                <p class="summary-value">${averageMarks}</p>
            </div>
            <div class="summary-card">
                <p class="summary-label">Overall Grade</p>
                <p class="summary-value">
                    <span class="grade-badge grade-badge-${overallGrade}">${overallGrade}</span>
                </p>
            </div>
            <div class="summary-card">
                <p class="summary-label">Status</p>
                <p class="summary-value status-${status.toLowerCase()}">
                    ${status === "Pass" ? "✓ Pass" : "✗ Fail"}
                </p>
            </div>
        </div>
        <div class="progress-bar-container">
            <p class="summary-label" style="margin-bottom: 8px;">Overall Performance: ${percentage}%</p>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${percentage}%"></div>
            </div>
        </div>
        <!-- Mobile Grade Breakdown (shown on small screens) -->
        <div class="mobile-grade-breakdown">
          <div class="grade-breakdown-header">
            <h4 class="summary-label">Grade Breakdown</h4>
            <button class="info-icon-btn" id="grade-info-btn" aria-label="View detailed grade breakdown">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
          <div id="grade-badges-container" class="grade-badges-container"></div>
          <p class="grade-total-info" id="grade-total-info">Total: ${totalSubjectsCount} subjects</p>
        </div>
    `;
    
    // Create grade badges for mobile display
    createGradeBadges(grades, subjectData);
    
    // Setup grade details modal
    setupGradeDetailsModal(subjectData);
    
    // Animate progress bar
    setTimeout(() => {
        const progressBar = summaryInfo.querySelector('.progress-bar-fill');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }, 100);
    
    // Create Performance Chart
    createPerformanceChart(subjectData, marksArray);
    
    // Show warning message
    const warningMessage = document.getElementById("warning-message");
    if (warningMessage) {
        warningMessage.classList.remove("hidden");
    }
    
    // Show result generated info with current date/time
    const resultGeneratedInfo = document.getElementById("result-generated-info");
    if (resultGeneratedInfo) {
        const now = new Date();
        const releaseDateTime = now.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const releaseDateTimeEl = document.getElementById("release-datetime");
        if (releaseDateTimeEl) {
            releaseDateTimeEl.textContent = releaseDateTime;
        }
        resultGeneratedInfo.classList.remove("hidden");
    }

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

// ====== Create Grade Badges for Mobile ======
function createGradeBadges(grades, subjectData) {
    const container = document.getElementById('grade-badges-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create badges for each grade
    grades.forEach((grade, index) => {
        const badge = document.createElement('span');
        badge.className = `grade-chip grade-chip-${grade.toUpperCase()}`;
        badge.textContent = grade.toUpperCase();
        badge.setAttribute('data-subject-index', index);
        badge.setAttribute('title', subjectData[index]?.label || `Subject ${index + 1}`);
        container.appendChild(badge);
    });
}

// ====== Setup Grade Details Modal ======
function setupGradeDetailsModal(subjectData) {
    const infoBtn = document.getElementById('grade-info-btn');
    const modal = document.getElementById('grade-details-modal');
    const closeBtn = document.getElementById('close-grade-modal');
    const detailsList = document.getElementById('grade-details-list');
    
    if (!infoBtn || !modal || !closeBtn || !detailsList) return;
    
    // Populate modal with subject details
    detailsList.innerHTML = subjectData.map((subject, index) => `
        <div class="grade-detail-item">
            <span class="grade-detail-subject">${subject.label}</span>
            <div class="grade-detail-marks-grade">
                <span class="grade-detail-marks">${subject.displayMarks}</span>
                <span class="grade-chip grade-chip-${subject.grade.toUpperCase()}">${subject.grade.toUpperCase()}</span>
            </div>
        </div>
    `).join('');
    
    // Open modal
    infoBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}

// ====== PDF Generation ======
async function generatePdf() {
    if (!currentStudentData) {
        showError("No student data available to generate PDF.");
        return;
    }

    showSpinner();

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Load Logo ---
        let logoLoaded = false;
        const logoImg = new Image();
        logoImg.src = 'assets/Logo.jpg';
        try {
            await new Promise((resolve, reject) => {
                logoImg.onload = () => {
                    logoLoaded = true;
                    resolve();
                };
                logoImg.onerror = () => {
                    console.warn("Failed to load logo image. PDF will be generated without logo.");
                    resolve(); // Resolve even on error to allow PDF generation to continue
                };
            });
            if (logoLoaded) {
                doc.addImage(logoImg, 'JPEG', 15, 15, 30, 30);
            }
        } catch (imgError) {
            console.error("Error during logo image promise:", imgError);
        }

        // --- Header ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor("#0D3B66");
        doc.text("AL-HIQMA LEARNING CENTRE", 55, 25);

        doc.setFontSize(14);
        doc.setTextColor("#333333");
        doc.text("Official Statement of Results", 55, 35);

        const examYear = yearSelect.value || "2025";
        const examType = examSelect.value || "G.C.E. (O/L) EXAMINATION";
        doc.setFontSize(12);
        doc.text(`${examType} - ${examYear}`, 55, 42);

        doc.setLineWidth(0.5);
        doc.line(15, 50, 195, 50);

        // --- Student Details ---
        let yPos = 60;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Student Information", 15, yPos);
        yPos += 8;

        const studentDetails = [
            ["Name", currentStudentData.Name || "N/A"],
            ["Index Number", currentStudentData.Index || "N/A"],
            ["Class / Batch", currentStudentData.Class || currentStudentData.Grade || currentStudentData.Batch || "O/L Batch"],
        ];

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        studentDetails.forEach(([label, value]) => {
            doc.setFont("helvetica", "bold");
            doc.text(label + ":", 20, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(value, 60, yPos);
            yPos += 7;
        });

        // --- Results Table ---
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Subject Results", 15, yPos);
        yPos += 5;

        const tableHead = [['Subject', 'Marks', 'Grade']];
        const tableBody = allSubjectData.map(sub => [sub.label, sub.displayMarks, sub.grade]);

        autoTable(doc, {
            head: tableHead,
            body: tableBody,
            startY: yPos,
            theme: 'grid',
            headStyles: {
                fillColor: [13, 59, 102], // #0D3B66
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            styles: {
                font: 'helvetica',
                fontSize: 10,
            },
            alternateRowStyles: {
                fillColor: [245, 247, 251] // #F5F7FB
            },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // --- Summary ---
        const summaryElement = document.getElementById('summary-info');
        if (summaryElement) {
            const totalMarks = summaryElement.querySelector('.summary-grid .summary-card:nth-child(1) .summary-value')?.textContent || 'N/A';
            const average = summaryElement.querySelector('.summary-grid .summary-card:nth-child(2) .summary-value')?.textContent || 'N/A';
            const overallGrade = summaryElement.querySelector('.summary-grid .summary-card:nth-child(3) .summary-value .grade-badge')?.textContent || 'N/A';
            const status = summaryElement.querySelector('.summary-grid .summary-card:nth-child(4) .summary-value')?.textContent.trim() || 'N/A';

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("Performance Summary", 15, yPos);
            yPos += 8;

            const summaryDetails = [
                ["Total Marks:", totalMarks],
                ["Average:", average],
                ["Overall Grade:", overallGrade],
                ["Final Status:", status.replace(/✓|✗/g, '').trim()],
            ];

            doc.setFontSize(11);
            summaryDetails.forEach(([label, value]) => {
                doc.setFont("helvetica", "bold");
                doc.text(label, 20, yPos);
                doc.setFont("helvetica", "normal");
                doc.text(value, 60, yPos);
                yPos += 7;
            });
        }

        // --- Footer ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setTextColor("#666666");
        doc.text("This is a system-generated document.", 15, pageHeight - 20);
        doc.text(`Result released on: ${new Date().toLocaleString()}`, 15, pageHeight - 15);
        doc.text("Verified By: AR. Rifas (Sir) - Coordinator, AL-HIQMA Learning Centre", 15, pageHeight - 10);

        // --- Save PDF ---
        const fileName = `AL-HIQMA-Results-${currentStudentData.Index}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error("PDF Generation Error:", error);
        showError("An error occurred while generating the PDF.");
    } finally {
        hideSpinner();
    }
}

// ====== Create Performance Chart ======
function createPerformanceChart(subjectData, marksArray) {
    if (!performanceChart || !window.Chart) return;
    
    // Filter subjects with numeric marks
    const chartData = subjectData
        .filter(sub => sub.numericMarks !== null)
        .map(sub => ({
            subject: sub.label.length > 15 ? sub.label.substring(0, 15) + '...' : sub.label,
            marks: sub.numericMarks
        }));
    
    if (chartData.length === 0) return;
    
    // Show chart section
    performanceChart.classList.remove('hidden');
    
    const ctx = document.getElementById('marksChart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (marksChart) {
        marksChart.destroy();
    }
    
    // Calculate average for reference line
    const average = marksArray.length > 0 
        ? marksArray.reduce((a, b) => a + b, 0) / marksArray.length 
        : 0;
    
    marksChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.subject),
            datasets: [{
                label: 'Marks',
                data: chartData.map(d => d.marks),
                backgroundColor: chartData.map(d => {
                    if (d.marks >= average + 10) return '#1B8A5A'; // Green
                    if (d.marks <= average - 10) return '#D93025'; // Red
                    return '#FF8800'; // Orange
                }),
                borderColor: chartData.map(d => {
                    if (d.marks >= average + 10) return '#0F6B42';
                    if (d.marks <= average - 10) return '#B71C1C';
                    return '#E67300';
                }),
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        family: 'Poppins',
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'Poppins',
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return `Marks: ${context.parsed.y} / 100`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        color: '#666'
                    },
                    grid: {
                        color: '#E1ECFF'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 11
                        },
                        color: '#666',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}
