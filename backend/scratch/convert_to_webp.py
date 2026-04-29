from PIL import Image
import os
import sys

def convert_to_webp(input_path, output_path):
    try:
        img = Image.open(input_path)
        img.save(output_path, "WEBP", quality=90)
        print(f"Successfully converted {input_path} to {output_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert.py <input> <output>")
        sys.exit(1)
    convert_to_webp(sys.argv[1], sys.argv[2])
