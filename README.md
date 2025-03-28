# **Document Annotation & Signing Tool**  

A web application for annotating and signing documents, with the ability to export them as a PDF while maintaining annotations and signatures.  

## **Setup and Running Instructions**  

### **1. Clone the repository**  
```bash
git clone https://github.com/yourusername/document-signing-app.git
cd document-signing-app
```

### **2. Install dependencies**  
```bash
npm install
# or
yarn install
```

### **3. Set up environment variables**  
Create a `.env.local` file in the root directory and add any required environment variables.  

### **4. Run the development server**  
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.  

### **5. Build for production**  
```bash
npm run build
npm start
```

---

## **Libraries and Tools Used**  

### **1. Next.js (App Router)**
- Used for **server-side rendering (SSR)** and improved performance.  

### **2. PDF.js**
- Enables **PDF rendering** in the browser for annotations and signing.  

### **3. Fabric.js**
- Allows **drawing annotations and signatures** on the document.  

### **4. html2canvas & jsPDF**
- Used for **capturing and exporting** the annotated document as a PDF.  

### **5. Tailwind CSS**
- For **responsive UI design** and faster styling.  

---

## **Challenges Faced and Solutions**  

### **1. Signature Positioning Issue**
**Issue:** After signing, the signature moved to a different position.  
**Solution:** Adjusted **canvas scaling** and **coordinate calculations** to maintain signature placement.  

### **2. Exporting PDF with Annotations**
**Issue:** Exported PDFs were missing annotations or had incorrect placements.  
**Solution:** Used `html2canvas` to capture document elements and `jsPDF` to ensure correct rendering.  

### **3. Maintaining Document Quality**
**Issue:** Exported PDFs had a loss of quality.  
**Solution:** Adjusted **canvas resolution** and **PDF compression settings** for clarity.  

---

## **Future Improvements**  

✅ **Multi-User Collaboration**  
- Allow multiple users to sign and annotate the same document.  

✅ **Drag & Drop Signature Placement**  
- Let users position signatures easily before finalizing.  

✅ **Cloud Storage Integration**  
- Save signed documents to **Google Drive** or **AWS S3**.  

✅ **Better Mobile Support**  
- Optimize signature input for touchscreen devices.  

---

### 🚀 **Contributions & Feedback**  
Have suggestions? Feel free to open an issue or submit a pull request!  
