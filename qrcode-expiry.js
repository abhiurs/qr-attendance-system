// qrcode-expiry.js

// Generate QR code
var qrcode = new QRCode(document.getElementById("qrcode"), {
  text: "https://example.com/attendance",
  width: 200,
  height: 200
});

// Remove after 2 minutes
setTimeout(() => {
  document.getElementById("qrcode").innerHTML = "";
  document.getElementById("expired").style.display = "block";
}, 120000);
