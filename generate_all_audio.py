import asyncio
import edge_tts
import os
import json
import random
import re

# 1. Setup paths
output_dir = "public/audio"
json_path = "src/data/content.json"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 2. Load Data
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 3. Voices (2 Female, 2 Male)
VOICES = [
    "en-US-AriaNeural", 
    "en-US-GuyNeural", 
    "en-US-JennyNeural", 
    "en-US-ChristopherNeural"
]

async def generate_audio(text, filename, voice, rate="-10%"):
    file_path = os.path.join(output_dir, filename)
    
    # SMART CHECK: Skip generation if the file already exists
    if os.path.exists(file_path):
        return

    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(file_path)
    print(f"✅ Generated [{voice}]: {filename}")

async def main():
    print("🎙️ Starting Smart Audio Sync...\n")
    
    # 1. Sync Passages (Smooth Reading Fix!)
    for passage in data.get("passages", []):
        filename = f"passage_level{passage['levelIndex'] + 1}.mp3"
        
        # STRIP THE BRACKETS so Azure reads it naturally!
        smooth_text = passage["text"].replace("{", "").replace("}", "")
        
        # Pick a random voice for the passage
        passage_voice = random.choice(VOICES)
        
        await generate_audio(smooth_text, filename, passage_voice, rate="+0%")
    
    # 2. Sync Words, Definitions, and Sentences (Voice Binding!)
    for word_obj in data.get("realWords", []):
        word = word_obj["word"].lower()
        definition = word_obj["def"]
        sentence = word_obj["sent"]
        
        # BINDING: Pick one random voice to use for all 3 files for this specific word
        bound_voice = random.choice(VOICES)
        
        await generate_audio(word, f"word_{word}.mp3", bound_voice)
        await generate_audio(definition, f"def_{word}.mp3", bound_voice)
        await generate_audio(sentence, f"sentence_{word}.mp3", bound_voice)

    print("\n🎉 Audio sync complete! Only new content was generated.")

if __name__ == "__main__":
    asyncio.run(main())