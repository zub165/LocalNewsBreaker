from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os
from ai_module import NewsProcessor
from pdf_generator import generate_pdf
import supabase
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase_client = supabase.create_client(supabase_url, supabase_key)

# Initialize AI processor
ai_processor = NewsProcessor(api_key=os.getenv('OPENAI_API_KEY'))

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/submit', methods=['POST'])
def submit_news():
    try:
        data = request.form.to_dict()
        media_files = request.files.getlist('media')
        
        # Process media files
        media_urls = []
        for file in media_files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                # Upload to Supabase storage
                with open(file_path, 'rb') as f:
                    supabase_client.storage.from_('media').upload(file_path, f)
                media_urls.append(f"{supabase_url}/storage/v1/object/public/media/{file_path}")
                os.remove(file_path)  # Clean up local file
        
        # Process the news with AI
        news_data = {
            'title': data.get('title'),
            'description': data.get('description'),
            'location': data.get('location'),
            'media': media_urls,
            'user_id': data.get('user_id'),
            'timestamp': datetime.now().isoformat()
        }
        
        processed_data = ai_processor.process_news(news_data)
        news_data.update(processed_data)
        
        # Store in database
        result = supabase_client.table('news').insert(news_data).execute()
        
        return jsonify({
            "message": "News submitted successfully",
            "data": result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/news', methods=['GET'])
def get_news():
    try:
        # Get query parameters
        location = request.args.get('location')
        date = request.args.get('date')
        truth_index_min = request.args.get('truth_index_min', type=int)
        
        # Build query
        query = supabase_client.table('news').select('*')
        
        if location:
            query = query.eq('location', location)
        if date:
            query = query.eq('date', date)
        if truth_index_min:
            query = query.gte('truth_index', truth_index_min)
            
        result = query.execute()
        
        return jsonify(result.data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-pdf', methods=['GET'])
def create_pdf():
    try:
        # Get news for today
        today = datetime.now().strftime('%Y-%m-%d')
        result = supabase_client.table('news')\
            .select('*')\
            .eq('date', today)\
            .gte('truth_index', 70)\
            .execute()
            
        if not result.data:
            return jsonify({"message": "No news available for today"}), 404
            
        pdf_path = generate_pdf(result.data)
        
        return jsonify({
            "message": "PDF generated successfully",
            "pdf_url": f"{supabase_url}/storage/v1/object/public/pdfs/{pdf_path}"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_news():
    try:
        query = request.args.get('q')
        if not query:
            return jsonify({"error": "Search query is required"}), 400
            
        result = supabase_client.table('news')\
            .select('*')\
            .textSearch('description', query)\
            .execute()
            
        return jsonify(result.data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True)
