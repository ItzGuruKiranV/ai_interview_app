import os
import pandas as pd
import joblib
from resume_module.functions import extract_text_from_pdf, extract_multiline_field, clean_text
from io import BytesIO

def score_resume_from_bytes(file_bytes: bytes):
    pdf_data = []

    try:
        # Read PDF from memory (no file path needed)
        pdf_stream = BytesIO(file_bytes)
        text = extract_text_from_pdf(pdf_stream)

        if not text.strip():
            print("❌ Extracted text is empty.")
            return None

        print("📄 First 300 characters of resume:\n", text[:300])

        row = {
            "Education": extract_multiline_field("Education", text),
            "Skills": extract_multiline_field("Skills", text),
            "Projects": extract_multiline_field("Projects", text),
            "Certifications": extract_multiline_field("Certifications", text),
            "Experience": extract_multiline_field("Experience", text),
            "Achievements": extract_multiline_field("Achievements", text)
        }
        pdf_data.append(row)

    except Exception as e:
        print("❌ Error reading the PDF:", e)
        return None

    # Ensure all required columns exist
    columns = ["Education", "Skills", "Projects", "Certifications", "Experience", "Achievements"]
    raw_row = pdf_data[0]
    pdf_row = {col: raw_row.get(col, '') for col in columns}

    df = pd.DataFrame(columns=columns)
    df = pd.concat([df, pd.DataFrame([pdf_row])], ignore_index=True)

    # Clean and prepare text
    for col in df.columns:
        df[col] = df[col].fillna('').apply(clean_text)

    df["combined_text"] = (
        df["Education"] + " " +
        df["Skills"] + " " +
        df["Projects"] + " " +
        df["Certifications"] + " " +
        df["Experience"] + " " +
        df["Achievements"]
    )

    print("📄 Combined text used for prediction:\n", df["combined_text"].values[0][:300])

    try:
        # Load model and vectorizer
        model = joblib.load("resume_module/resume_model.pkl")
        vectorizer = joblib.load("resume_module/vectorizer.pkl")
    except Exception as e:
        print("❌ Failed to load model/vectorizer:", e)
        return None

    # Vectorize input
    try:
        X = vectorizer.transform(df['combined_text'])
        print("📊 Feature Shape:", X.shape)
        print("📊 Non-zero values in vector:", X.nnz)
    except Exception as e:
        print("❌ Vectorization failed:", e)
        return None

    try:
        predicted_score = model.predict(X)[0]
        print("✅ Final Predicted Score:", predicted_score)
    except Exception as e:
        print("❌ Prediction failed:", e)
        return None

    return predicted_score
