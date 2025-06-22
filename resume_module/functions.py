import fitz  # PyMuPDF
import re
import nltk
from nltk.stem import WordNetLemmatizer
nltk.download('punkt')
nltk.download('wordnet')

lemmatizer = WordNetLemmatizer()

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def extract_multiline_field(start, text):
    pattern = re.compile(rf"{start}:(.*?)(?=\n\w+:|\Z)", re.DOTALL | re.IGNORECASE)
    match = pattern.search(text)
    return match.group(1).strip().replace('\n', ' ') if match else ""

def extract_resume_fields(text):
    return {
        "Education": extract_multiline_field("Education", text),
        "Skills": extract_multiline_field("Skills", text),
        "Projects": extract_multiline_field("Projects", text),
        "Certifications": extract_multiline_field("Certifications", text)
    }

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    tokens = nltk.word_tokenize(text)
    tokens = [lemmatizer.lemmatize(token) for token in tokens]
    return ' '.join(tokens)
