// Global variables for timer
let countdownTimer;
let timeLeft = 120; // 2 minutes in seconds

// Load QR history
function getHistory() {
    return JSON.parse(localStorage.getItem("qrHistory") || "[]");
}

// Save QR history
function saveHistory(history) {
    localStorage.setItem("qrHistory", JSON.stringify(history));
}

// Add to history
function addHistory(subject, info) {
    const history = getHistory();
    history.unshift({ subject, ...info });
    saveHistory(history);
    renderHistory();
}

// Render history list
function renderHistory() {
    const list = document.getElementById("history-list");
    const noHistory = document.getElementById("no-history");
    const clearBtn = document.getElementById("clear-history-btn");
    
    if (!list) return;
    
    list.innerHTML = "";

    const history = getHistory();
    
    if (!history.length) {
        if (noHistory) noHistory.style.display = 'block';
        if (clearBtn) clearBtn.style.display = "none";
        return;
    }

    if (noHistory) noHistory.style.display = 'none';
    if (clearBtn) clearBtn.style.display = "inline-block";

    history.forEach((item, index) => {
        const li = document.createElement("div");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <div>
                <strong>${item.subject}</strong>
                <div class="text-muted small">${item.time}</div>
            </div>
            <span class="badge bg-secondary">#${history.length - index}</span>
        `;
        list.appendChild(li);
    });
}

// Start countdown timer
function startTimer() {
    const timerDisplay = document.getElementById("countdown-timer");
    const timerContainer = document.getElementById("timer-display");
    
    if (!timerDisplay || !timerContainer) return;
    
    timerContainer.style.display = 'block';
    timeLeft = 120; // Reset to 2 minutes
    
    // Clear existing timer
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    
    countdownTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            timerContainer.style.display = 'none';
            
            // Clear QR code when timer expires
            const qrContainer = document.getElementById("qr");
            const subjectInfo = document.getElementById("subject-info");
            if (qrContainer) qrContainer.innerHTML = "";
            if (subjectInfo) {
                subjectInfo.innerHTML = 'QR Code expired. Click "Generate QR Code" to create a new one.';
            }
        } else {
            timeLeft--;
        }
    }, 1000);
}

// Generate QR with teacher's username as subject
function generateQR() {
    const qrContainer = document.getElementById("qr");
    const subjectInfo = document.getElementById("subject-info");
    const teacherName = localStorage.getItem("loggedInUser");
    
    if (!qrContainer || !subjectInfo || !teacherName) return;
    
    // Clear previous QR code
    qrContainer.innerHTML = "";

    const now = Date.now();
    const qrData = JSON.stringify({ 
        subject: teacherName, 
        timestamp: now 
    });

    try {
        // Generate new QR code
        new QRCode(qrContainer, {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: "#1976d2",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Update subject info
        subjectInfo.innerHTML = `
            <strong class="text-success">Active QR Code for ${teacherName}</strong><br>
            <small class="text-muted">Students can scan this code to mark attendance</small>
        `;

        // Add to history
        addHistory(teacherName, { 
            time: new Date(now).toLocaleString(),
            type: "QR Generation"
        });
        
        // Start the countdown timer
        startTimer();
        
    } catch (error) {
        console.error("QR Generation Error:", error);
        alert("Error generating QR code. Please try again.");
    }
}

// Initialize the application
function initializeApp() {
    // Check authentication
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("loggedInUser");
    
    if (!user || role !== "teacher") {
        alert("Please login as teacher first!");
        window.location.href = "teacher-login.html";
        return;
    }
    
    // Display teacher info
    const teacherNameElement = document.getElementById("teacher-name");
    const teacherSubjectElement = document.getElementById("teacher-subject");
    
    if (teacherNameElement) {
        teacherNameElement.textContent = user;
    }
    if (teacherSubjectElement) {
        teacherSubjectElement.textContent = user; // Using username as subject
    }
    
    // Render history
    renderHistory();
    
    // Generate QR button event listener
    const generateBtn = document.getElementById("generate-qr-btn");
    if (generateBtn) {
        generateBtn.addEventListener("click", generateQR);
    }
    
    // Clear history event listener
    const clearHistoryBtn = document.getElementById("clear-history-btn");
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", () => {
            if (confirm("Clear all QR generation history?")) {
                localStorage.removeItem("qrHistory");
                renderHistory();
                alert("History cleared successfully!");
            }
        });
    }
}

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    initializeApp();
});