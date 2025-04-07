# LocalNewsBreaker

A community-powered news platform that uses AI to verify and curate local news stories.

## Features

- 📝 Submit local news stories with media attachments
- 🤖 AI-powered story summarization and truth verification
- 📊 Truth Index scoring system
- 📰 Daily PDF newspaper generation
- 🔍 Advanced search and filtering
- 📱 Mobile-responsive interface

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/LocalNewsBreaker.git
cd LocalNewsBreaker
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with your API keys:
```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

5. Set up Supabase:
   - Create a new project in Supabase
   - Create a `news` table with the following schema:
     ```sql
     create table news (
       id uuid default uuid_generate_v4() primary key,
       title text not null,
       description text not null,
       location text,
       media text[],
       user_id text,
       summary text,
       truth_index integer,
       timestamp timestamptz default now()
     );
     ```
   - Create storage buckets for `media` and `pdfs`

6. Run the application:
```bash
python backend.py
```

## API Endpoints

- `POST /api/submit` - Submit a new news story
- `GET /api/news` - Get news stories with optional filters
- `GET /api/generate-pdf` - Generate daily PDF newspaper
- `GET /api/search` - Search news stories

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 