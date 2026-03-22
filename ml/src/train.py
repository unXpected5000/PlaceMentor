import json

from common import train_models


def main():
    result = train_models()
    print(json.dumps({
        "success": True,
        "message": "Models trained successfully.",
        **result,
    }))


if __name__ == "__main__":
    main()
