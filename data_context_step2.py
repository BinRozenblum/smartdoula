import os
import codecs

# --- הגדרות ---
ROOT_DIRECTORY = '.'  # תיקיית הפרויקט
NAMES_FILENAME = 'file_names.txt'  # קובץ עם שמות הקבצים
OUTPUT_FILENAME = 'filtered_project_context.txt'

def main():
    # ודא שתיקיית הבסיס קיימת
    if not os.path.isdir(ROOT_DIRECTORY):
        print(f"שגיאה: תיקיית הבסיס '{ROOT_DIRECTORY}' אינה קיימת או אינה תיקייה.")
        return

    # קבל נתיב אבסולוטי לקובץ הפלט
    absolute_output_path = os.path.abspath(os.path.join(ROOT_DIRECTORY, OUTPUT_FILENAME))
    absolute_names_path = os.path.abspath(os.path.join(ROOT_DIRECTORY, NAMES_FILENAME))

    # בדוק אם קובץ השמות קיים
    if not os.path.isfile(absolute_names_path):
        print(f"שגיאה: קובץ השמות '{NAMES_FILENAME}' לא קיים.")
        return

    print(f"קורא שמות קבצים מקובץ: {absolute_names_path}")
    print(f"כותב פלט לקובץ: {absolute_output_path}")

    # פתח את קובץ הפלט לכתיבה ואת קובץ השמות לקריאה
    try:
        with codecs.open(absolute_names_path, 'r', encoding='utf-8') as namesfile, \
             codecs.open(absolute_output_path, 'w', encoding='utf-8') as outfile:
            # קרא את שמות הקבצים
            file_paths = [line.strip() for line in namesfile if line.strip()]
            
            for relative_path in file_paths:
                full_path = os.path.join(ROOT_DIRECTORY, relative_path)
                
                # בדוק אם הקובץ קיים
                if not os.path.isfile(full_path):
                    print(f"  [-] קובץ לא קיים: {relative_path}")
                    continue
                
                try:
                    # קרא את תוכן הקובץ
                    with codecs.open(full_path, 'r', encoding='utf-8', errors='ignore') as infile:
                        content = infile.read()
                    
                    # בדוק אם התוכן לא ריק
                    if content.strip():
                        print(f"  [+] מוסיף את הקובץ: {relative_path}")
                        # כתוב לקובץ הפלט
                        outfile.write(f"--- Filename: {relative_path} ---\n")
                        outfile.write(content)
                        outfile.write("\n\n---\n\n")
                    else:
                        print(f"  [-] מדלג על קובץ ריק: {relative_path}")
                
                except Exception as e:
                    print(f"  [!] שגיאה בקריאת הקובץ {relative_path}: {e}")

        print(f"\nהתהליך הושלם. התוכן נשמר בקובץ: {absolute_output_path}")

    except IOError as e:
        print(f"שגיאה בכתיבה לקבצים: {e}")
    except Exception as e:
        print(f"שגיאה לא צפויה: {e}")

if __name__ == "__main__":
    main()