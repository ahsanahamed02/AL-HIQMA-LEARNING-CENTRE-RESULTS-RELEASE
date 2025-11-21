# AL-HIQMA Learning Centre - Online Exam Results Portal

A modern, secure, and user-friendly web application designed for students of AL-HIQMA Learning Centre to check their examination results online. This portal fetches data dynamically from a Google Sheets backend via Google Apps Script, ensuring real-time and accurate information.

![Project Screenshot](https://i.imgur.com/example.png) 

---

## ✨ Features

- **Dynamic Search**: Students can filter results by **Exam Type**, **Exam Year**, and their unique **Index Number**.
- **Professional Results Display**: Clean, organized, and professionally styled presentation of results.
- **Detailed Breakdown**:
  - Student's personal details (Name, Index No).
  - A clear table with **Subjects, Marks, and Grades**.
  - Color-coded grades for quick visual assessment.
- **Comprehensive Summary**: A summary card showing **Total Marks, Average, Overall Grade, and Pass/Fail Status**.
- **Rank & Comments**: Optional sections for displaying class rank and coordinator's comments.
- **User-Friendly Interface**:
  - Loading spinners and clear success/error messages for better user experience.
  - Fully responsive design that works on desktops, tablets, and mobile phones.
- **Export Options**:
  - **Print Results** button for a printer-friendly version.
  - **Download as PDF** button (requires implementation with a library like jsPDF).
- **Official & Secure**:
  - Displays coordinator contact details and important notices.
  - Includes result generation info (release date, verifier) for authenticity.

---

## 🚀 Tech Stack

- **Frontend**:
  - HTML5
  - CSS3 (with custom properties for theming)
  - Vanilla JavaScript (ES6+)
- **Backend**:
  - **Google Apps Script**: Acts as a secure web app API.
  - **Google Sheets**: Serves as the database for storing student results.
- **Libraries & Services**:
  - **Font Awesome**: For icons.
  - **Google Fonts**: For typography.

---

## 🛠️ Setup and Installation

To get this project running, you need to set up both the Google Sheets backend and the frontend files.

### 1. Backend Setup (Google Sheets & Apps Script)

a. **Create a Google Sheet**:
   - Create a new Google Sheet to store the student results.
   - The columns should match the data fields used in `script.js` (e.g., `Index`, `Name`, `Religion_Marks`, `Mathematics`, `Basket1_Subject`, etc.).

b. **Create a Google Apps Script**:
   - In your Google Sheet, go to `Extensions` > `Apps Script`.
   - Write a `doGet(e)` function that:
     1. Reads the `index`, `year`, and `exam` parameters from the request.
     2. Searches the Google Sheet for a matching student record.
     3. Returns the student's data as a JSON object or an error message.
   - **Deploy the script**:
     1. Click `Deploy` > `New deployment`.
     2. Select `Web app` as the type.
     3. In the configuration, set "Execute as" to **Me** and "Who has access" to **Anyone**.
     4. Click `Deploy`.
     5. **Copy the Web app URL**. This is your API endpoint.

### 2. Frontend Setup

a. **Clone or Download the Repository**:
   - Get the `index.html`, `style.css`, `style-new.css`, and `script.js` files.

b. **Configure the API Endpoint**:
   - Open `script.js`.
   - Find the `API_URL` constant:
     ```javascript
     const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
     ```
   - Replace the URL with the **Web app URL** you copied from your Google Apps Script deployment.

c. **Configure Allowed Exams**:
   - In `script.js`, update the `allowedCombinations` array to reflect the exams and years you have published results for.
     ```javascript
     const allowedCombinations = [
         { exam: "G.C.E. (O/L) EXAMINATION", year: "2025" },
         // Add other valid combinations here
     ];
     ```

d. **Run the Application**:
   - Simply open the `index.html` file in a web browser. For best results and to avoid CORS issues during development, it's recommended to use a simple local server (like the "Live Server" extension in VS Code).

---

## 📁 File Structure

```
.
├── assets/
│   └── logo.png
├── index.html          # Main HTML structure
├── script.js           # Core application logic, API calls
├── style.css           # Primary layout and base styles
├── style-new.css       # Theming and new design styles
└── README.md           # This file
```

---

## ©️ License

This project is licensed under the MIT License. See the LICENSE file for details.


© 2025 AL-HIQMA Learning Centre. All rights reserved.
