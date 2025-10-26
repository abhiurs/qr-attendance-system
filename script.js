// Generate a unique session code (timestamp + random)
function generateSessionCode() {
    const now = new Date();
    return (
        'SESSION-' +
        now.getFullYear().toString().padStart(4, '0') +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        '-' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0') +
        '-' +
        Math.floor(Math.random() * 10000)
    );
}

// Save session to localStorage for demo
function saveSession(session) {
    const sessions = JSON.parse(localStorage.getItem('attendanceSessions') || "[]");
    sessions.unshift(session);
    localStorage.setItem('attendanceSessions', JSON.stringify(sessions));
    renderSessions();
}

function renderSessions() {
    const sessions = JSON.parse(localStorage.getItem('attendanceSessions') || "[]");
    const ul = document.getElementById('sessions-list');
    ul.innerHTML = '';
    sessions.forEach(sess => {
        const li = document.createElement('li');
        li.textContent = `${sess.code} (${sess.time})`;
        ul.appendChild(li);
    });
}

document.getElementById('generate-btn').addEventListener('click', () => {
    const sessionCode = generateSessionCode();
    // For real use, you might encode more data, or a URL with the session code.
    const data = sessionCode;
    document.getElementById('qr').innerHTML = '';
    new QRCode(document.getElementById('qr'), {
        text: data,
        width: 200,
        height: 200
    });
    const now = new Date();
    document.getElementById('session-info').innerText = `Session Code: ${sessionCode}`;
    saveSession({ code: sessionCode, time: now.toLocaleString() });
});

// Initialize
window.addEventListener('DOMContentLoaded', renderSessions);