import json
import sys

from common import analyze_resume, build_prediction_payload


def main():
    request = json.loads(sys.stdin.read() or "{}")
    request_type = request.get("type")
    payload = request.get("payload", {})

    if request_type == "prediction":
        result = build_prediction_payload(payload)
    elif request_type == "resume_analysis":
        result = analyze_resume(payload["filePath"])
    else:
        raise ValueError("Unknown request type. Use 'prediction' or 'resume_analysis'.")

    print(json.dumps(result))


if __name__ == "__main__":
    main()
