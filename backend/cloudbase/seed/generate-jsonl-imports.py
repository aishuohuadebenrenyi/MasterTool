from pathlib import Path
import json


ROOT = Path(__file__).resolve().parent
OUTPUT_ROOT = ROOT / "importable-jsonl"
SEED_PATH = ROOT / "cloudbase-seed.json"

FILE_GROUPS = {
    "direct-import": {
        "participants.json": "participants",
        "interaction_submissions.json": "interaction_submissions",
        "feedback.json": "feedback",
    },
    "need-user-id": {
        "templates.json": "templates",
        "plans.json": "plans",
        "activities.json": "activities",
        "live_sessions.json": "live_sessions",
        "interactions.json": "interactions",
    },
}


def to_jsonl_text(array_data):
    return "".join(json.dumps(item, ensure_ascii=False) + "\n" for item in array_data)


def main():
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    for folder, file_map in FILE_GROUPS.items():
        target_dir = OUTPUT_ROOT / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        for file_name, collection_name in file_map.items():
            target_path = target_dir / file_name
            data = seed.get(collection_name, [])
            target_path.write_text(to_jsonl_text(data), encoding="utf-8")
            print(f"generated {target_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
