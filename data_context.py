import os
import codecs

# --- הגדרות ---
ROOT_DIRECTORY = '.'  # תיקיית הפרויקט
OUTPUT_FILENAME = 'project_context.txt'
NAMES_FILENAME = 'file_names.txt'  # קובץ חדש לשמות הקבצים
EXCLUDED_DIRS = {'ui','arcive', '.mypy_cache', '.bolt', '.git', '.idea', 'venv', '.venv', '__pycache__', 'node_modules', 'build', 'dist', 'env', '.env', 'db', 'log'}
EXCLUDED_FILES = {
    'bun.lockb', 'package-lock.json', 'README.md', 'LICENSE', 'requirements.txt', 'setup.py', 
    'data_context.py', 'project_context.txt', 'file_names.txt'  # הוספת קובץ השמות לרשימה
}
EXCLUDED_EXTENSIONS = {
    '.pyc', '.pem', '.stl','.pyo', '.pyd', '.dll', '.exe', '.so', '.o', '.a', '.lib', '.jar', '.class',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.tiff', '.mp3', '.wav', '.ogg', '.flac',
    '.mp4', '.avi', '.mov', '.wmv', '.mkv', '.zip', '.rar', '.tar', '.gz', '.7z',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.db', '.sqlite', '.sqlite3',
    '.pkl', '.joblib', '.h5', '.pth', '.onnx', '.ipynb_checkpoints'
}

def is_likely_text_file(filepath):
    """
    בודק אם קובץ הוא כנראה קובץ טקסט על סמך הסיומת שלו.
    """
    _, ext = os.path.splitext(filepath)
    return ext.lower() not in EXCLUDED_EXTENSIONS

def main():
    if not os.path.isdir(ROOT_DIRECTORY):
        print(f"שגיאה: תיקיית הבסיס '{ROOT_DIRECTORY}' אינה קיימת או אינה תיקייה.")
        return

    absolute_output_path = os.path.abspath(os.path.join(ROOT_DIRECTORY, OUTPUT_FILENAME))
    absolute_names_path = os.path.abspath(os.path.join(ROOT_DIRECTORY, NAMES_FILENAME))

    print(f"מחפש קבצים בתיקייה: {os.path.abspath(ROOT_DIRECTORY)}")
    print(f"כותב פלט לקובץ: {absolute_output_path}")
    print(f"כותב שמות קבצים לקובץ: {absolute_names_path}")

    try:
        with codecs.open(absolute_output_path, 'w', encoding='utf-8') as outfile, \
             codecs.open(absolute_names_path, 'w', encoding='utf-8') as namesfile:
            for dirpath, dirnames, filenames in os.walk(ROOT_DIRECTORY, topdown=True):
                dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
                print(f"\nסורק תיקייה: {dirpath}")

                for filename in filenames:
                    full_path = os.path.join(dirpath, filename)
                    absolute_full_path = os.path.abspath(full_path)

                    if absolute_full_path in [absolute_output_path, absolute_names_path]:
                        print(f"  [-] מדלג על קובץ הפלט: {filename}")
                        continue

                    if filename in EXCLUDED_FILES:
                        print(f"  [-] מדלג על קובץ מוחרג: {filename}")
                        continue

                    if is_likely_text_file(full_path):
                        relative_path = os.path.relpath(full_path, ROOT_DIRECTORY)
                        try:
                            with codecs.open(full_path, 'r', encoding='utf-8', errors='ignore') as infile:
                                content = infile.read()

                            if content.strip():
                                print(f"  [+] מוסיף את הקובץ: {relative_path}")
                                # כתיבה לקובץ התוכן
                                outfile.write(f"--- Filename: {relative_path} ---\n")
                                outfile.write(content)
                                outfile.write("\n\n---\n\n")
                                # כתיבה לקובץ השמות
                                namesfile.write(f"{relative_path}\n")
                            else:
                                print(f"  [-] מדלג על קובץ ריק: {relative_path}")

                        except Exception as e:
                            print(f"  [!] שגיאה בקריאת הקובץ {relative_path}: {e}")
                    else:
                        print(f"  [-] מדלג על קובץ עם סיומת לא רצויה: {filename}")

            print(f"\nהתהליך הושלם. התוכן נשמר בקובץ: {absolute_output_path}")
            print(f"שמות הקבצים נשמרו בקובץ: {absolute_names_path}")

    except IOError as e:
        print(f"שגיאה בכתיבה לקבצים: {e}")
    except Exception as e:
        print(f"שגיאה לא צפויה: {e}")

if __name__ == "__main__":
    main()