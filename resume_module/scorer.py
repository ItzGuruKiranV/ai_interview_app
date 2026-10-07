import os
import re
from pathlib import Path
from io import BytesIO
from resume_module.functions import extract_text_from_pdf, extract_multiline_field, clean_text


def score_resume_rule_based(text: str) -> float:
    """
    Fallback rule-based resume scorer.
    Evaluates presence and length of key sections.
    Returns a score between 0 and 100.
    """
    score = 0.0

    sections = {
        "Education": 15,
        "Skills": 20,
        "Projects": 25,
        "Experience": 20,
        "Certifications": 10,
        "Achievements": 10,
    }

    for section, weight in sections.items():
        content = extract_multiline_field(section, text)
        if content and len(content.strip()) > 20:
            # Proportional scoring: longer/richer content → closer to full weight
            chars = min(len(content.strip()), 500)
            section_score = weight * (chars / 500)
            score += section_score

    # Bonus points for contact info
    if re.search(r'[\w.+-]+@[\w-]+\.[a-z]{2,}', text, re.I):
        score += 5
    if re.search(r'github\.com', text, re.I):
        score += 5
    if re.search(r'linkedin\.com', text, re.I):
        score += 3
    if re.search(r'(\+?\d[\d\s\-]{8,}\d)', text):
        score += 2

    return min(score, 100.0)


def score_resume_from_bytes(file_bytes: bytes):
    try:
        pdf_stream = BytesIO(file_bytes)
        text = extract_text_from_pdf(pdf_stream)

        if not text.strip():
            print("❌ Extracted text is empty.")
            return None

        print("📄 First 300 characters of resume:\n", text[:300])

        # Try ML model first, fall back to rule-based
        model_path = Path(__file__).resolve().parent / "resume_model.pkl"
        vectorizer_path = Path(__file__).resolve().parent / "vectorizer.pkl"

        if model_path.exists() and vectorizer_path.exists():
            try:
                import pandas as pd
                import joblib

                row = {
                    "Education": extract_multiline_field("Education", text),
                    "Skills": extract_multiline_field("Skills", text),
                    "Projects": extract_multiline_field("Projects", text),
                    "Certifications": extract_multiline_field("Certifications", text),
                    "Experience": extract_multiline_field("Experience", text),
                    "Achievements": extract_multiline_field("Achievements", text),
                }

                columns = list(row.keys())
                import pandas as pd
                df = pd.DataFrame([row], columns=columns)
                for col in df.columns:
                    df[col] = df[col].fillna('').apply(clean_text)

                df["combined_text"] = " ".join([df[col].iloc[0] for col in columns])

                model = joblib.load(str(model_path))
                vectorizer = joblib.load(str(vectorizer_path))
                X = vectorizer.transform(df['combined_text'])
                predicted_score = model.predict(X)[0]
                print("✅ ML Predicted Score:", predicted_score)
                return float(predicted_score)

            except Exception as e:
                print("⚠️ ML model failed, falling back to rule-based scoring:", e)

        # Rule-based fallback
        score = score_resume_rule_based(text)
        print("✅ Rule-based Score:", score)
        return score

    except Exception as e:
        print("❌ Error reading the PDF:", e)
        return None
