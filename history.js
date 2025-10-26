// Load attendance DB
function getAttendanceDB() {
    return JSON.parse(localStorage.getItem('attendanceDB') || "[]");
}

function getUniqueSubjects(db) {
    const set = new Set(db.map(a => a.subject));
    return Array.from(set).sort();
}

function populateSubjectFilter(subjects) {
    const select = document.getElementById('subject-filter');
    select.innerHTML = '<option value="">All Subjects</option>';
    subjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        select.appendChild(opt);
    });
}

function filterAttendance() {
    const db = getAttendanceDB();
    const subject = document.getElementById('subject-filter').value;
    const date = document.getElementById('date-filter').value;
    const month = document.getElementById('month-filter').value;
    
    return db.filter(entry => {
        let ok = true;
        if (subject) ok = ok && entry.subject === subject;
        if (date) ok = ok && entry.date === date;
        if (month) ok = ok && entry.month === month;
        return ok;
    });
}

function deleteAttendanceRecord(entryToDelete) {
    let db = getAttendanceDB();
    db = db.filter(entry =>
        !(
            entry.subject === entryToDelete.subject &&
            entry.name === entryToDelete.name &&
            entry.time === entryToDelete.time &&
            entry.date === entryToDelete.date &&
            entry.month === entryToDelete.month
        )
    );
    localStorage.setItem('attendanceDB', JSON.stringify(db));
    renderHistory();
    alert(`✅ Record deleted successfully!`);
}

function renderHistory() {
    const filtered = filterAttendance();
    const tbody = document.getElementById('history-table-body');
    const noRecordsMsg = document.getElementById('no-records-message');
    
    tbody.innerHTML = '';
    
    if (!filtered.length) {
        noRecordsMsg.style.display = 'block';
        return;
    }
    
    noRecordsMsg.style.display = 'none';
    
    filtered.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    filtered.forEach(entry => {
        const row = document.createElement('tr');
        const time = new Date('1970-01-01 ' + entry.time);
        const formattedTime = time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        row.innerHTML = `
            <td class="fw-semibold">${entry.subject}</td>
            <td>${entry.name}</td>
            <td>${entry.date}</td>
            <td>${formattedTime}</td>
            <td>
                <button class="btn btn-danger btn-sm delete-btn" title="Delete this record">
                    🗑️ Delete
                </button>
            </td>
        `;
        
        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn.onclick = () => {
            if (confirm(`Are you sure you want to delete this attendance record?\n\nSubject: ${entry.subject}\nStudent: ${entry.name}\nDate: ${entry.date} ${formattedTime}`)) {
                deleteAttendanceRecord(entry);
            }
        };
        
        tbody.appendChild(row);
    });
}

// ==================== EXPORT FUNCTIONS ====================

function showExportLoading() {
    document.getElementById('export-loading').style.display = 'block';
}

function hideExportLoading() {
    document.getElementById('export-loading').style.display = 'none';
}

// Simple CSV Export (Always works)
function exportToCSV(data, filename) {
    showExportLoading();
    
    try {
        // CSV headers
        let csv = 'Subject,Student Name,Date,Time,Month\n';
        
        // CSV data
        data.forEach(record => {
            csv += `"${record.subject}","${record.name}","${record.date}","${record.time}","${record.month}"\n`;
        });

        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setTimeout(hideExportLoading, 500);
        return true;
    } catch (error) {
        console.error('CSV Export Error:', error);
        hideExportLoading();
        return false;
    }
}

// Excel Export with fallback
function exportToExcel(data, filename) {
    showExportLoading();
    
    try {
        // Check if XLSX is available
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX library not loaded');
        }

        // Prepare data for Excel
        const excelData = data.map(record => ({
            'Subject': record.subject,
            'Student Name': record.name,
            'Date': record.date,
            'Time': record.time,
            'Month': record.month
        }));

        // Create worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance Records');
        
        // Generate and download
        XLSX.writeFile(wb, filename);
        
        setTimeout(hideExportLoading, 1000);
        return true;
    } catch (error) {
        console.error('Excel Export Error:', error);
        // Fallback to CSV
        alert('Excel export failed. Downloading as CSV instead.');
        const fallbackFilename = filename.replace('.xlsx', '.csv');
        const success = exportToCSV(data, fallbackFilename);
        if (!success) {
            hideExportLoading();
            alert('❌ Export failed. Please try again.');
        }
        return false;
    }
}

// PDF Export with fallback
function exportToPDF(data, filename) {
    showExportLoading();
    
    try {
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('Attendance Records', 14, 15);
        
        // Add export date
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 22);
        
        // Prepare table data
        const tableData = data.map(record => [
            record.subject,
            record.name,
            record.date,
            record.time,
            record.month
        ]);
        
        // Create table
        doc.autoTable({
            startY: 30,
            head: [['Subject', 'Student Name', 'Date', 'Time', 'Month']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [25, 118, 210],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });
        
        // Add total count
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total Records: ${data.length}`, 14, finalY);
        
        // Save PDF
        doc.save(filename);
        
        setTimeout(hideExportLoading, 1000);
        return true;
    } catch (error) {
        console.error('PDF Export Error:', error);
        // Fallback to CSV
        alert('PDF export failed. Downloading as CSV instead.');
        const fallbackFilename = filename.replace('.pdf', '.csv');
        const success = exportToCSV(data, fallbackFilename);
        if (!success) {
            hideExportLoading();
            alert('❌ Export failed. Please try again.');
        }
        return false;
    }
}

// Main export functions
function exportAttendanceCSV() {
    const db = getAttendanceDB();
    if (!db.length) {
        alert('No attendance records to export!');
        return;
    }
    
    const timestamp = new Date().toISOString().slice(0,10);
    const filename = `attendance_records_${timestamp}.csv`;
    
    const success = exportToCSV(db, filename);
    if (success) {
        setTimeout(() => alert('✅ CSV file downloaded successfully!'), 600);
    }
}

function exportAttendanceExcel() {
    const db = getAttendanceDB();
    if (!db.length) {
        alert('No attendance records to export!');
        return;
    }
    
    const timestamp = new Date().toISOString().slice(0,10);
    const filename = `attendance_records_${timestamp}.xlsx`;
    
    exportToExcel(db, filename);
}

function exportAttendancePDF() {
    const db = getAttendanceDB();
    if (!db.length) {
        alert('No attendance records to export!');
        return;
    }
    
    const timestamp = new Date().toISOString().slice(0,10);
    const filename = `attendance_records_${timestamp}.pdf`;
    
    exportToPDF(db, filename);
}

// Export filtered data
function exportFilteredData(format) {
    const filteredData = filterAttendance();
    if (!filteredData.length) {
        alert('No records found for the current filters!');
        return;
    }

    const timestamp = new Date().toISOString().slice(0,10);
    const filterInfo = getCurrentFilterInfo();
    const filterSuffix = filterInfo ? '_filtered' : '';
    
    switch(format) {
        case 'csv':
            const csvFilename = `attendance${filterSuffix}_${timestamp}.csv`;
            const csvSuccess = exportToCSV(filteredData, csvFilename);
            if (csvSuccess) {
                setTimeout(() => alert('✅ Filtered CSV file downloaded successfully!'), 600);
            }
            break;
            
        case 'excel':
            const excelFilename = `attendance${filterSuffix}_${timestamp}.xlsx`;
            exportToExcel(filteredData, excelFilename);
            break;
            
        case 'pdf':
            const pdfFilename = `attendance${filterSuffix}_${timestamp}.pdf`;
            exportToPDF(filteredData, pdfFilename);
            break;
    }
}

function getCurrentFilterInfo() {
    const subject = document.getElementById('subject-filter').value;
    const date = document.getElementById('date-filter').value;
    const month = document.getElementById('month-filter').value;
    
    if (subject || date || month) {
        let info = '';
        if (subject) info += `Subject: ${subject}`;
        if (date) info += `${info ? ', ' : ''}Date: ${date}`;
        if (month) info += `${info ? ', ' : ''}Month: ${month}`;
        return info;
    }
    return null;
}

// Initialize the page
window.addEventListener('DOMContentLoaded', () => {
    const db = getAttendanceDB();
    populateSubjectFilter(getUniqueSubjects(db));
    renderHistory();
    
    // Event listeners for filters
    document.getElementById('filter-btn').onclick = renderHistory;
    
    document.getElementById('clear-filters').onclick = () => {
        document.getElementById('subject-filter').value = '';
        document.getElementById('date-filter').value = '';
        document.getElementById('month-filter').value = '';
        renderHistory();
    };
    
    // Auto-apply filters
    document.getElementById('date-filter').addEventListener('change', renderHistory);
    document.getElementById('month-filter').addEventListener('change', renderHistory);
    
    // Export event listeners
    document.getElementById('export-csv').addEventListener('click', (e) => {
        e.preventDefault();
        const hasFilters = document.getElementById('subject-filter').value || 
                          document.getElementById('date-filter').value || 
                          document.getElementById('month-filter').value;
        
        if (hasFilters) {
            if (confirm('Export filtered data only? Click OK for filtered data, Cancel for all data.')) {
                exportFilteredData('csv');
            } else {
                exportAttendanceCSV();
            }
        } else {
            exportAttendanceCSV();
        }
    });
    
    document.getElementById('export-excel').addEventListener('click', (e) => {
        e.preventDefault();
        const hasFilters = document.getElementById('subject-filter').value || 
                          document.getElementById('date-filter').value || 
                          document.getElementById('month-filter').value;
        
        if (hasFilters) {
            if (confirm('Export filtered data only? Click OK for filtered data, Cancel for all data.')) {
                exportFilteredData('excel');
            } else {
                exportAttendanceExcel();
            }
        } else {
            exportAttendanceExcel();
        }
    });
    
    document.getElementById('export-pdf').addEventListener('click', (e) => {
        e.preventDefault();
        const hasFilters = document.getElementById('subject-filter').value || 
                          document.getElementById('date-filter').value || 
                          document.getElementById('month-filter').value;
        
        if (hasFilters) {
            if (confirm('Export filtered data only? Click OK for filtered data, Cancel for all data.')) {
                exportFilteredData('pdf');
            } else {
                exportAttendancePDF();
            }
        } else {
            exportAttendancePDF();
        }
    });
});