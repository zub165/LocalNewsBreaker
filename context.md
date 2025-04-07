
# context.md

## Project Title: **LocalNewsBreaker**

## Project Overview

LocalNewsBreaker is a web-based application that allows local residents to report breaking news, which is then curated and compiled into a daily PDF newspaper. The application uses crowdsourced inputs to generate articles and evaluate them through an AI-powered "Truth Index." It provides a democratic approach to journalism, giving power to communities to report events while ensuring credibility through AI-assisted verification.

## Core Objectives

- Enable local citizens to contribute news stories.
- Use AI to extract, structure, and assess the veracity of submitted information.
- Generate a daily PDF newspaper from verified stories.
- Maintain a transparent and searchable database of all contributions.

## Platform & Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend (Future-ready):** Node.js / Python (Flask), optional API endpoints
- **Database:** Supabase / Firebase / PostgreSQL
- **AI Integration:** OpenAI for NLP-based summary generation and truth detection
- **PDF Generation:** jsPDF or PDFLib.js

## Workflow

1. **User Submission**
   - Local residents report incidents with:
     - Title
     - Description
     - Media (optional: image/video)
     - Location (auto-tagged or manual)
     - Date & Time

2. **AI Processing**
   - NLP parses and summarizes the story.
   - AI compares new reports with existing trusted data.
   - Assigns a "Truth Index" (0 to 100) based on:
     - Report consistency
     - Relevance
     - Redundancy
     - Presence of media
     - Reporter reliability (if logged in)

3. **Content Curation**
   - Admin dashboard allows editors to:
     - View all stories
     - Sort/filter by location, time, or truth index
     - Merge duplicates
     - Approve stories for daily issue

4. **PDF Newspaper Generation**
   - Approved stories are compiled into:
     - Regional sections
     - Headline summaries
     - Truth Index highlighted
   - PDF generated and available for download

5. **Database Storage**
   - Every story is logged with:
     - Raw user input
     - Final summary
     - Truth Index
     - User ID (optional)
     - Timestamp
     - Media attachments

6. **Search & Archive**
   - Users can:
     - Search archived news by keyword, date, or location
     - View older editions of the PDF paper
     - Filter results by Truth Index or author

## Key Features

### 📥 Story Submission
- Anonymous or logged-in users
- Mobile-optimized forms
- Optional multimedia uploads

### 🤖 AI & Truth Index
- Auto-summarization
- Reliability scoring
- Duplicate detection

### 📰 PDF Builder
- Daily issue generation
- Categorized by region or topic
- AI-generated headlines

### 🔎 Search & Archive
- Publicly searchable news database
- Filter by Truth Index, keyword, date

### 🧠 Admin Tools
- Review dashboard
- Edit & approve stories
- Merge similar stories

## Optional Future Add-ons

- Geolocation-based news sorting
- Public upvoting/commenting system
- Reporter reputation scoring
- Multilingual support
- Mobile app (PWA or Flutter)
