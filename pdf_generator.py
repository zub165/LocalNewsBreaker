from fpdf import FPDF
from datetime import datetime
import os

class NewsPDF(FPDF):
    def header(self):
        # Logo
        self.image('logo.png', 10, 8, 33)
        # Arial bold 15
        self.set_font('Arial', 'B', 15)
        # Move to the right
        self.cell(80)
        # Title
        self.cell(30, 10, 'Local NewsBreaker', 0, 0, 'C')
        # Line break
        self.ln(20)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('Arial', 'I', 8)
        # Page number
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')

def generate_pdf(news_list):
    pdf = NewsPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Title
    pdf.set_font('Arial', 'B', 24)
    pdf.cell(0, 10, 'Daily News Report', 0, 1, 'C')
    pdf.ln(10)
    
    # Date
    pdf.set_font('Arial', 'I', 12)
    pdf.cell(0, 10, datetime.now().strftime('%B %d, %Y'), 0, 1, 'C')
    pdf.ln(10)
    
    # Group news by location
    locations = {}
    for news in news_list:
        loc = news.get('location', 'General')
        if loc not in locations:
            locations[loc] = []
        locations[loc].append(news)
    
    # Sort locations by number of stories
    sorted_locations = sorted(locations.items(), key=lambda x: len(x[1]), reverse=True)
    
    for location, stories in sorted_locations:
        # Location header
        pdf.set_font('Arial', 'B', 16)
        pdf.set_text_color(44, 62, 80)  # Dark blue
        pdf.cell(0, 10, location, 0, 1, 'L')
        pdf.ln(5)
        
        for story in stories:
            # Story title
            pdf.set_font('Arial', 'B', 12)
            pdf.set_text_color(0, 0, 0)
            pdf.multi_cell(0, 10, story['title'])
            
            # Truth Index
            truth_index = story.get('truth_index', 0)
            pdf.set_font('Arial', 'I', 10)
            if truth_index >= 80:
                pdf.set_text_color(39, 174, 96)  # Green
            elif truth_index >= 60:
                pdf.set_text_color(243, 156, 18)  # Orange
            else:
                pdf.set_text_color(231, 76, 60)  # Red
            pdf.cell(0, 10, f'Truth Index: {truth_index}', 0, 1, 'L')
            
            # Summary
            pdf.set_font('Arial', '', 11)
            pdf.set_text_color(0, 0, 0)
            pdf.multi_cell(0, 10, story.get('summary', ''))
            
            # Media indicator
            if story.get('media'):
                pdf.set_font('Arial', 'I', 10)
                pdf.cell(0, 10, '📷 Media available', 0, 1, 'L')
            
            pdf.ln(5)
    
    # Save the PDF
    output_dir = 'pdfs'
    os.makedirs(output_dir, exist_ok=True)
    filename = f'daily_news_{datetime.now().strftime("%Y%m%d")}.pdf'
    output_path = os.path.join(output_dir, filename)
    pdf.output(output_path)
    
    return filename
