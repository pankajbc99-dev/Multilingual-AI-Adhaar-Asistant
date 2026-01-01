**Multilingual AI Aadhaar Assistant**

A high-performance, AI-driven solution designed for the automated extraction, parsing, and translation of Indian Aadhaar card data. Leveraging state-of-the-art OCR and Large Language Models (LLMs), this assistant transforms unstructured document images into structured, multi-lingual digital data.

**🚀 Core Features**

Intelligent OCR Extraction: Precision extraction of Name, DOB, Gender, and Aadhaar Number using advanced vision models.
Multilingual Processing: Instant translation of extracted data into various Indian regional languages.
Structured Data Output: Converts image-based text into organized formats (JSON/CSV) for easy integration.
Context-Aware AI: Uses LLMs to handle low-quality scans, blurred text, and diverse card layouts.
Streamlined UI: A minimalist, high-speed interface built with Streamlit.

**🛠️ Technical Stack**
Language: Python 3.10+
Core AI: Google Gemini Pro Vision / OpenAI GPT-4o
Frontend: Streamlit
Image Processing: OpenCV / PIL
Environment: Python-dotenv

**⚙️ Installation & Setup**
Clone the Repository
code
Bash
git clone https://github.com/pankajbc99-dev/Multilingual-AI-Adhaar-Asistant.git
cd Multilingual-AI-Adhaar-Asistant

**Environment Setup**
Create a virtual environment and install dependencies:
code
Bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
Configuration
Create a .env file in the root directory and add your API key:
code
Env
GOOGLE_API_KEY=your_gemini_api_key_here
Launch Application
code
Bash
streamlit run app.py

**🛡️ Privacy & Security**

**Disclaimer: This tool processes Personally Identifiable Information (PII).
This application is intended for automated data entry and educational purposes.
Users are responsible for ensuring compliance with local data protection laws (e.g., IT Act 2000).
Avoid uploading or storing sensitive documents on unencrypted public servers.**

**🤝 Contribution**
Contributions are welcome to improve extraction accuracy and language support. Please feel free to fork the repository and submit a pull request.
Made with ❤️ by Pankaj Raghuwanshi
