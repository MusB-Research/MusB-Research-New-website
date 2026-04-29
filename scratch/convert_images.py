from PIL import Image
import os

def convert_webp_to_jpg(path):
    if not os.path.exists(path):
        print(f"File {path} not found")
        return
    img = Image.open(path).convert("RGB")
    new_path = path.replace(".webp", ".jpg")
    img.save(new_path, "JPEG", quality=95)
    print(f"Converted {path} to {new_path}")

team_dir = "backend/media/team"
for filename in os.listdir(team_dir):
    if filename.endswith(".webp"):
        convert_webp_to_jpg(os.path.join(team_dir, filename))
