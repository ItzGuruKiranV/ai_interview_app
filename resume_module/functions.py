import fitz  # PyMuPDF
import re
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.data import find

# --- Safe download of NLTK resources ---
def safe_nltk_download():
    try:
        find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt', quiet=True)

    try:
        find('corpora/wordnet')
    except LookupError:
        nltk.download('wordnet', quiet=True)

safe_nltk_download()

lemmatizer = WordNetLemmatizer()

def extract_text_from_pdf(pdf_input):
    try:
        if isinstance(pdf_input, (str, bytes)):
            doc = fitz.open(stream=pdf_input, filetype="pdf")
        else:
            doc = fitz.open(stream=pdf_input.read(), filetype="pdf")

        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    except Exception as e:
        print("❌ Failed to open PDF:", e)
        return ""

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
