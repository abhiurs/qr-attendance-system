# QR Attendance System

A modern web-based QR Attendance Management System designed to simplify and automate attendance tracking for educational institutions. The system enables teachers to generate attendance QR codes and students to scan them for secure and efficient attendance marking.

This project focuses on improving attendance management through automation, QR technology, and user-friendly interfaces while reducing manual work and proxy attendance issues.

---

# Project Overview

Traditional attendance systems are often time-consuming and prone to errors or proxy attendance. This project provides a smart digital solution where attendance can be marked instantly using QR codes.

The application includes separate portals for students and teachers, QR generation and scanning functionality, attendance history tracking, and QR expiration validation for better security.

---

# Key Features

## Teacher Module
- Teacher Registration & Login
- Generate QR Codes for Attendance
- Manage Attendance Sessions
- View Attendance History

## Student Module
- Student Registration & Login
- Scan QR Codes
- Mark Attendance Digitally
- Access Attendance Records

## QR Attendance System
- Dynamic QR Code Generation
- QR Code Scanning Functionality
- QR Expiry Validation
- Automated Attendance Recording

## User Interface
- Responsive Design
- Simple Navigation
- Clean Dashboard Interface
- Mobile-Friendly Layout

---

# Project Structure

```bash
qr-attendance-system/
│
├── .github/
│
├── index.html                  # Main Landing Page
│
├── generator.html              # QR Generator Interface
├── generator.js                # QR Generation Logic
│
├── scanner.html                # QR Scanner Interface
├── scanner.js                  # QR Scanner Logic
│
├── history.html                # Attendance History Page
├── history.js                  # Attendance History Logic
│
├── student-login.html          # Student Login Page
├── student-register.html       # Student Registration Page
│
├── teacher-login.html          # Teacher Login Page
├── teacher-register.html       # Teacher Registration Page
│
├── qrcode-expiry.js            # QR Expiry Validation Logic
│
├── script.js                   # Main Application Script
├── style.css                   # Main Stylesheet
│
└── README.md
