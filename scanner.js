// Global variable to track scanning state
let isScanning = false;
let currentScanner = null;

// Load attendance DB
function getAttendanceDB() {
    return JSON.parse(localStorage.getItem("attendanceDB") || "[]");
}

function saveAttendanceDB(db) {
    localStorage.setItem("attendanceDB", JSON.stringify(db));
}

// Get current logged-in student
function getCurrentStudent() {
    const username = localStorage.getItem("loggedInUser");
    if (!username) {
        alert("No user logged in! Redirecting to login...");
        window.location.href = "student-login.html";
        return null;
    }
    return username;
}

// Delete individual attendance record
function deleteAttendanceRecord(recordToDelete) {
    if (!confirm("Are you sure you want to delete this attendance record?")) {
        return;
    }

    let db = getAttendanceDB();
    // Find and remove the record by matching all its properties
    db = db.filter(record =>
        !(
            record.subject === recordToDelete.subject &&
            record.name === recordToDelete.name &&
            record.time === recordToDelete.time &&
            record.date === recordToDelete.date &&
            record.month === recordToDelete.month
        )
    );
    saveAttendanceDB(db);
    renderAttendance();
    
    // Show success message
    showMessage(`✅ Attendance record deleted successfully!`, 'success');
}

// Clear all attendance records for current student
function clearAllRecords() {
    const studentName = getCurrentStudent();
    if (!studentName) return;

    if (!confirm("Are you sure you want to delete ALL your attendance records? This action cannot be undone.")) {
        return;
    }

    let db = getAttendanceDB();
    // Remove only records belonging to the current student
    const initialLength = db.length;
    db = db.filter(record => record.name !== studentName);
    
    if (db.length === initialLength) {
        showMessage("No records found to delete.", 'info');
        return;
    }

    saveAttendanceDB(db);
    renderAttendance();
    showMessage(`✅ All your attendance records have been deleted!`, 'success');
}

// Show temporary message
function showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingAlert = document.querySelector('.temp-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} temp-alert alert-dismissible fade show`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

// Render attendance history for logged-in student
function renderAttendance() {
    const list = document.getElementById("attendance-list");
    const noRecords = document.getElementById("no-records");
    const clearAllBtn = document.getElementById("clear-all-btn");

    if (!list) return;

    list.innerHTML = "";

    const db = getAttendanceDB();
    const studentName = getCurrentStudent();
    
    if (!studentName) return;

    const filtered = db.filter(entry => entry.name === studentName);

    if (!filtered.length) {
        if (noRecords) noRecords.style.display = 'block';
        if (clearAllBtn) clearAllBtn.style.display = 'none';
        return;
    }

    if (noRecords) noRecords.style.display = 'none';
    if (clearAllBtn) clearAllBtn.style.display = 'inline-block';

    // Show latest records first
    filtered.reverse().forEach(entry => {
        const li = document.createElement("div");
        li.className = "list-group-item";
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <strong>${entry.subject}</strong>
                    <div class="text-muted small">
                        ${entry.date} at ${entry.time}
                    </div>
                </div>
                <div class="d-flex flex-column align-items-end">
                    <span class="badge bg-success rounded-pill mb-2">✓</span>
                    <button class="delete-record-btn" title="Delete this record">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;

        // Add event listener to delete button
        const deleteBtn = li.querySelector('.delete-record-btn');
        deleteBtn.onclick = () => {
            deleteAttendanceRecord(entry);
        };

        list.appendChild(li);
    });
}

// Input validation functions
function validateSubject(subject) {
    if (!subject || subject.trim().length < 2) {
        throw new Error("Invalid subject name in QR code");
    }
    if (subject.length > 50) {
        throw new Error("Subject name too long");
    }
    if (/[<>&"']/.test(subject)) {
        throw new Error("Subject name contains invalid characters");
    }
    return subject.trim();
}

// Check if QR was already scanned
function isQRAlreadyScanned(studentName, subject, timestamp) {
    const db = getAttendanceDB();
    
    // Check if the same QR code (same subject + similar timestamp) was already scanned
    // Allow 5-minute window to account for QR regeneration
    const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
    const minTime = timestamp - timeWindow;
    const maxTime = timestamp + timeWindow;
    
    return db.some(entry => 
        entry.name === studentName && 
        entry.subject === subject &&
        // Check if there's an entry with similar timestamp (within 5 minutes)
        Math.abs(new Date(entry.date + ' ' + entry.time).getTime() - timestamp) < timeWindow
    );
}

// Process scanned QR - Only once per session
function onScanSuccess(qrMessage) {
    // Prevent multiple simultaneous scans
    if (isScanning) {
        return;
    }
    
    isScanning = true;
    
    try {
        // Validate QR data structure
        if (!qrMessage || typeof qrMessage !== 'string') {
            throw new Error("Invalid QR code format");
        }
        
        const qrData = JSON.parse(qrMessage);
        
        // Validate required fields
        if (!qrData.subject || !qrData.timestamp) {
            throw new Error("QR code missing required data");
        }
        
        const subject = validateSubject(qrData.subject);
        const timestamp = parseInt(qrData.timestamp);
        
        if (isNaN(timestamp)) {
            throw new Error("Invalid timestamp in QR code");
        }

        const now = Date.now();
        
        // Expiry check: 2 minutes (120000 ms)
        if (now - timestamp > 120000) {
            document.getElementById("result").innerHTML = 
                `<div class="alert alert-warning">❌ QR code expired! Please ask the teacher to generate a new one.</div>`;
            isScanning = false;
            return;
        }

        const studentName = getCurrentStudent();
        if (!studentName) {
            isScanning = false;
            return;
        }

        // Check if this QR was already scanned by this student
        if (isQRAlreadyScanned(studentName, subject, timestamp)) {
            document.getElementById("result").innerHTML = 
                `<div class="alert alert-info">✅ Attendance for <b>${subject}</b> was already recorded!</div>`;
            isScanning = false;
            return;
        }

        // Save attendance
        const db = getAttendanceDB();
        const today = new Date();
        const record = {
            subject,
            name: studentName,
            date: today.toISOString().slice(0, 10),
            time: today.toLocaleTimeString(),
            month: today.toISOString().slice(0, 7),
            scannedAt: now,
            qrTimestamp: timestamp // Store the original QR timestamp to prevent duplicates
        };

        db.push(record);
        saveAttendanceDB(db);

        document.getElementById("result").innerHTML = 
            `<div class="alert alert-success">✅ Attendance marked for <b>${subject}</b>!</div>`;

        renderAttendance();
        
        // Stop scanner after successful scan
        if (currentScanner) {
            currentScanner.stop().then(() => {
                console.log("Scanner stopped after successful scan");
                const startBtn = document.getElementById("start-scan");
                startBtn.disabled = false;
                startBtn.textContent = "Start Camera & Scan QR";
                startBtn.classList.remove("btn-warning");
                startBtn.classList.add("btn-primary");
                currentScanner = null;
            }).catch(console.error);
        }
        
    } catch (err) {
        console.error("QR Scan Error:", err);
        document.getElementById("result").innerHTML = 
            `<div class="alert alert-danger">⚠️ Invalid QR Code! Please scan a valid attendance QR.</div>`;
    } finally {
        // Reset scanning flag after a short delay to prevent rapid re-scans
        setTimeout(() => {
            isScanning = false;
        }, 2000);
    }
}

// Initialize scanner page
function initializeScanner() {
    const studentName = getCurrentStudent();
    if (!studentName) return;

    // Display welcome message
    document.getElementById("student-welcome").textContent = studentName;

    // Render existing attendance records
    renderAttendance();

    // Start QR scanner on button click
    document.getElementById("start-scan").addEventListener("click", () => {
        if (currentScanner) {
            // Scanner is already running, stop it
            currentScanner.stop().then(() => {
                console.log("Scanner stopped by user");
                const startBtn = document.getElementById("start-scan");
                startBtn.disabled = false;
                startBtn.textContent = "Start Camera & Scan QR";
                startBtn.classList.remove("btn-warning");
                startBtn.classList.add("btn-primary");
                currentScanner = null;
            }).catch(console.error);
            return;
        }

        const startBtn = document.getElementById("start-scan");
        startBtn.disabled = true;
        startBtn.textContent = "Starting Camera...";
        
        currentScanner = new Html5Qrcode("qr-reader");
        currentScanner.start(
            { facingMode: "environment" },
            { 
                fps: 10, 
                qrbox: { 
                    width: 250, 
                    height: 250 
                } 
            },
            (decodedText) => {
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Ignore ongoing scan messages
                console.log("Scan in progress:", errorMessage);
            }
        ).then(() => {
            startBtn.disabled = false;
            startBtn.textContent = "Stop Scanner";
            startBtn.classList.remove("btn-primary");
            startBtn.classList.add("btn-warning");
            
            document.getElementById("result").innerHTML = 
                `<div class="alert alert-info">📱 Scanner active - Point camera at QR code</div>`;
                
        }).catch(err => {
            console.error("Camera start error:", err);
            document.getElementById("result").innerHTML = 
                `<div class="alert alert-danger">⚠️ Could not access camera. Please check permissions.</div>`;
            startBtn.disabled = false;
            startBtn.textContent = "Start Camera & Scan QR";
            startBtn.classList.remove("btn-warning");
            startBtn.classList.add("btn-primary");
            currentScanner = null;
        });
    });

    // Clear all records button
    const clearAllBtn = document.getElementById("clear-all-btn");
    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", clearAllRecords);
    }
}

// Authentication check and initialization
document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("loggedInUser");
    
    if (!user || role !== "student") {
        alert("Please login as student first!");
        window.location.href = "student-login.html";
        return;
    }
    
    initializeScanner();
});