import json
import sys

from common import analyze_resume


def main():
    request = json.loads(sys.stdin.read() or "{}")
    file_path = request.get("filePath")
    if not file_path:
        raise ValueError("filePath is required")

    print(json.dumps(analyze_resume(file_path)))


if __name__ == "__main__":
    main()
