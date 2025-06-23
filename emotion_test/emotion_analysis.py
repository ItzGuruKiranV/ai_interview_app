import cv2
import numpy as np
import os
from keras.models import load_model

# ✅ Load the emotion recognition model using dynamic path
model_path = os.path.join(os.path.dirname(__file__), "_mini_XCEPTION.102-0.66.hdf5")
model = load_model(model_path, compile=False)

# ✅ Load Haar cascade using OpenCV's built-in path
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Emotion class labels (as per model training)
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Map emotions to scores
emotion_scores = {
    'Happy': 10,
    'Surprise': 8,
    'Neutral': 5,
    'Fear': 4,
    'Sad': 2,
    'Angry': 1,
    'Disgust': 0
}

# Track scores
session_scores = []

# Start webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Error: Webcam not accessible.")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Error: Frame not captured.")
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

    for (x, y, w, h) in faces:
        # Draw face box
        cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)

        roi_gray = gray[y:y + h, x:x + w]
        roi_gray = cv2.resize(roi_gray, (64, 64))
        roi = roi_gray.astype("float32") / 255.0
        roi = np.expand_dims(roi, axis=-1)
        roi = np.expand_dims(roi, axis=0)

        # Predict emotion
        predictions = model.predict(roi, verbose=0)[0]
        max_index = np.argmax(predictions)
        emotion = emotion_labels[max_index]
        score = emotion_scores.get(emotion, 0)
        session_scores.append(score)

        # Display result
        cv2.putText(frame, f"{emotion} ({score}/10)", (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    # Show webcam feed
    cv2.imshow("🧠 Emotion Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

# Final summary
if session_scores:
    avg_score = sum(session_scores) / len(session_scores)
    print(f"\n🔎 Average Emotion Score: {avg_score:.2f} / 10")
else:
    print("\n⚠ No emotions were detected.")