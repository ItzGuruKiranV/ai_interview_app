import cv2
import numpy as np
from keras.models import load_model

# Load the emotion recognition model
model = load_model("_mini_XCEPTION.102-0.66.hdf5", compile=False)

# Load Haar cascade for face detection
face_cascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

# Emotion class labels (as per model training)
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Map emotions to scores (customize these if you like)
emotion_scores = {
    'Happy': 10,
    'Surprise': 8,
    'Neutral': 5,
    'Fear': 4,
    'Sad': 2,
    'Angry': 1,
    'Disgust': 0
}

# List to track all scores during the session
session_scores = []

# Start webcam capture
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

        roi_gray = gray[y:y+h, x:x+w]
        roi_gray = cv2.resize(roi_gray, (64, 64))  # match model input
        roi = roi_gray.astype("float") / 255.0
        roi = np.expand_dims(roi, axis=-1)
        roi = np.expand_dims(roi, axis=0)

        predictions = model.predict(roi, verbose=0)[0]
        max_index = np.argmax(predictions)
        emotion = emotion_labels[max_index]

        # Record emotion score
        score = emotion_scores.get(emotion, 0)  # fallback to 0
        session_scores.append(score)

        # Show emotion on screen
        cv2.putText(frame, f"{emotion} ({score}/10)", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX,
                    0.9, (0, 255, 0), 2)

    cv2.imshow("Emotion Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

# Show average emotion score after session
if session_scores:
    avg_score = sum(session_scores) / len(session_scores)
    print(f"\n🔎 Average Emotion Score: {avg_score:.2f} (out of 10)")
else:
    print("\nNo emotions were detected during this session.")
