import asyncio
import edge_tts
import os

# 1. Ensure the output directory exists in your React public folder
output_dir = "public/audio"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 2. Your vocabulary dictionary. 
# The key will be the filename, the value is the sentence to read.
# Start with your Level 1 words:
dictation_lines = {
    "accurate": "The weather forecast was very accurate.",
    "acquire": "She managed to acquire many new skills at her job.",
    "adequate": "We have an adequate amount of food for the trip.",
    "analyze": "The scientist will analyze the data tomorrow.",
    "anticipate": "We did not anticipate such a large crowd.",
    "appropriate": "Jeans are not appropriate for a formal wedding.",
    "assess": "The teacher will assess the students' reading levels.",
    "benefit": "Eating vegetables has many health benefits.",
    "capacity": "The room has a seating capacity of 50 people.",
    "cease": "The rain will finally cease in the afternoon."
}

# 3. Choose your Azure Voice
# "en-US-AriaNeural" is a highly realistic, professional American female voice.
# "en-US-ChristopherNeural" is a great American male alternative.
VOICE = "en-US-AriaNeural"

# 4. Set the speed. 
# DET dictations are spoken clearly and slightly slower than conversational speed.
# -10% or -15% is usually the sweet spot for ESL learners.
RATE = "-10%"

async def generate_all():
    print(f"Starting generation of {len(dictation_lines)} high-quality audio files...")
    
    for word, sentence in dictation_lines.items():
        file_path = os.path.join(output_dir, f"{word}.mp3")
        
        # Communicate directly with the Azure Edge endpoint
        communicate = edge_tts.Communicate(sentence, VOICE, rate=RATE)
        
        # Save to MP3
        await communicate.save(file_path)
        print(f"✅ Generated: {word}.mp3")
        
    print("All audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate_all())