import openai
from datetime import datetime
import re

class NewsProcessor:
    def __init__(self, api_key):
        openai.api_key = api_key
        
    def process_news(self, data):
        title = data.get('title', '')
        description = data.get('description', '')
        location = data.get('location', '')
        media_present = bool(data.get('media'))
        user_id = data.get('user_id')
        
        # Generate summary using OpenAI
        summary = self._generate_summary(description)
        
        # Calculate truth index
        truth_index = self._calculate_truth_index(
            description=description,
            media_present=media_present,
            user_id=user_id,
            location=location
        )
        
        return {
            'summary': summary,
            'truth_index': truth_index,
            'processed_at': datetime.now().isoformat()
        }
    
    def _generate_summary(self, text):
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a news summarizer. Create a concise summary of the following news story."},
                    {"role": "user", "content": text}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            # Fallback to basic summary if API fails
            return ' '.join(text.split()[:50]) + '...'
    
    def _calculate_truth_index(self, description, media_present, user_id, location):
        score = 50  # Base score
        
        # Length factor (0-20 points)
        word_count = len(description.split())
        score += min(20, word_count // 10)
        
        # Media presence (0-15 points)
        if media_present:
            score += 15
        
        # Location specificity (0-10 points)
        if location and len(location.split(',')) >= 2:
            score += 10
        
        # User reputation (0-5 points)
        if user_id:
            score += 5  # In a real implementation, this would check user history
        
        # Content quality indicators (0-10 points)
        quality_indicators = [
            r'\d{1,2}:\d{2}',  # Time mentions
            r'\d{1,2}/\d{1,2}/\d{4}',  # Date mentions
            r'witness|saw|observed|reported',  # First-hand account indicators
        ]
        
        for pattern in quality_indicators:
            if re.search(pattern, description, re.IGNORECASE):
                score += 3
        
        return min(100, score)

# Initialize with your OpenAI API key
processor = NewsProcessor(api_key="your-api-key-here")
