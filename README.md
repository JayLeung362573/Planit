# Planit

**Group Members:** Diego Salazar, Jiawei Liang, Manraj Dhesi, Nahum Asfaw

## Project Overview
Planit is a Django-based web application that assists users in planning their day by generating a personalized schedule based on their time availability, weather conditions, nearby attractions, and personal interests. Users can view current and forecasted weather, generate a time-blocked itinerary, get explanations for unfamiliar activities, and receive a concise end-of-day summary.

---

## Table of Contents
1. [Prerequisites](#prerequisites)  
2. [Local Deployment](#local-deployment)  
3. [Environment Variables](#environment-variables)  
4. [Running the Development Server](#running-the-development-server)  
5. [Testing](#testing)
6. [Project Links](#project-links)  
7. [Contact & Support](#contact--support)  

---

## Prerequisites
Before you begin, ensure you have the following installed on your machine:

- **Git** (to clone the repository)  
- **Python 3.11+**  
- **pip** (Python package manager)  
- (Optional but recommended) **virtualenv** or **venv**

---

## Local Deployment
Follow these steps to deploy Planit locally. If any step fails, please double-check your environment and file paths.

1. **Clone the repository**  
 - git clone https://github.com/CMPT-276-SUMMER-2025/final-project-13-bays.git
 - cd final-project-13-bays


2. **Create and activate a virtual environment**  
- Linux / macOS
    python3 -m venv venv
    source venv/bin/activate

- Windows (PowerShell)
    python -m venv venv
    .\venv\Scripts\Activate.ps1

3. **Install Python dependencies**  
- pip install --upgrade pip
- pip install -r requirements.txt

## Environment Variables
4. **Configure environment variables**  
- Open `.env` in a text editor and add:  
  - `SECRET_KEY` (Django secret)  
  - `DATABASE_URL` (if not using SQLite)  
  - `OWM_KEY` (OpenWeatherMap API key)  
  - `OPENAI_API_KEY` (OpenAI client key)

## Running the Development Server

5. **Apply database migrations**
- python manage.py migrate

6. **Collect static assets**
- python manage.py collectstatic --noinput

7. **Start the development server**
- python manage.py runserver


8. **Verify in browser**  
Visit `http://127.0.0.1:8000/` (or the URL shown in your console).

## Testing
To run the test program locally, follow steps 1-4 of local deployment. Once there, enter into your terminal
- cd myproject
- python manage.py test chat

It should now start the program.

---

## Project Links
- **Deployed Website:** [https://myapp-wioh.onrender.com/](https://myapp-wioh.onrender.com/)  
- **Final Report (PDF):** [reports/Planit_Final_Report.pdf](reports/Planit_Final_Report.pdf)  
- **Demo Video:** [https://youtu.be/your-demo-video-id](https://youtu.be/your-demo-video-id)  

---

## Contact & Support
If you encounter issues, please open an issue in this repository or contact one of the group members via email.

