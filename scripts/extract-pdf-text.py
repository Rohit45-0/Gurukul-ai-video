import json
import re
import sys
from collections import Counter
from pathlib import Path

from pypdf import PdfReader

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


STOP_WORDS = {
    "the",
    "and",
    "for",
    "that",
    "with",
    "this",
    "from",
    "have",
    "are",
    "was",
    "were",
    "will",
    "they",
    "their",
    "into",
    "about",
    "which",
    "when",
    "what",
    "where",
    "them",
    "more",
    "than",
    "your",
    "also",
    "some",
    "such",
    "these",
    "there",
    "been",
    "using",
    "used",
    "because",
    "known",
    "other",
    "metal",
    "metals",
    "non",
    "page",
    "chapter",
    "class",
    "science",
}


def normalize_whitespace(text: str) -> str:
    text = text.replace("\x00", " ")
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def pick_title(text: str, fallback: str) -> str:
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        lower = line.lower()
        if lower.startswith("reprint") or lower.startswith("science"):
            continue
        if len(line) < 4 or len(line) > 90:
            continue
        return line
    return fallback


def detect_headings(text: str) -> list[str]:
    headings: list[str] = []
    seen: set[str] = set()

    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if not line or len(line) < 5 or len(line) > 90:
            continue

        lower = line.lower()
        if lower.startswith(("reprint", "figure", "table", "science")):
            continue
        if lower in {"questions", "exercise", "exercises"}:
            continue
        if re.fullmatch(r"\d+\s*chapter", lower.replace(" ", "")):
            continue
        if re.fullmatch(r"(?:[A-Z]\s+){2,}[A-Z]?", line):
            continue
        alpha_count = sum(char.isalpha() for char in line)
        digit_count = sum(char.isdigit() for char in line)
        if alpha_count < 4 or digit_count > alpha_count:
            continue
        if re.fullmatch(r"[A-Za-z0-9()+\-]+", line) and digit_count > 0 and " " not in line:
            continue
        if line.isupper() and len(line.split()) <= 2 and "." not in line:
            continue
        word_counts = Counter(re.findall(r"[a-z]+", lower))
        if word_counts and max(word_counts.values()) > 2:
            continue

        score = 0
        if re.match(r"^\d+\.\d+(\.\d+)*\s", line):
            score += 3
        if line.isupper() and len(line.split()) <= 10:
            score += 2
        if any(
            keyword in lower
            for keyword in (
                "properties",
                "reactivity",
                "oxygen",
                "water",
                "acid",
                "corrosion",
                "alloys",
                "extraction",
                "ionic",
                "conduct",
                "metals",
                "non-metals",
            )
        ):
            score += 1

        cleaned = line.strip(" .:-")
        normalized = cleaned.casefold()
        if score >= 2 and normalized not in seen:
            seen.add(normalized)
            headings.append(cleaned)

    return headings[:18]


def extract_keywords(text: str) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z-]{3,}", text)
    filtered = [word.lower() for word in words if word.lower() not in STOP_WORDS]
    counts = Counter(filtered)
    return [word for word, _ in counts.most_common(16)]


def page_preview(text: str) -> str:
    collapsed = re.sub(r"\s+", " ", text).strip()
    return collapsed[:280]


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python scripts/extract-pdf-text.py <pdf-path>")

    pdf_path = Path(sys.argv[1]).resolve()
    if not pdf_path.exists():
        raise SystemExit(f"PDF not found: {pdf_path}")

    reader = PdfReader(str(pdf_path))
    pages: list[dict] = []
    collected_text: list[str] = []

    for index, page in enumerate(reader.pages, start=1):
        extracted = normalize_whitespace(page.extract_text() or "")
        collected_text.append(extracted)
        pages.append(
            {
                "page": index,
                "preview": page_preview(extracted),
                "characters": len(extracted),
                "words": len(extracted.split()),
            }
        )

    full_text = "\n\n".join(collected_text).strip()
    title = pick_title(full_text, pdf_path.stem.replace("-", " ").replace("_", " ").title())
    headings = detect_headings(full_text)
    keywords = extract_keywords(full_text)

    payload = {
        "title": title,
        "fileName": pdf_path.name,
        "pageCount": len(reader.pages),
        "wordCount": len(full_text.split()),
        "characterCount": len(full_text),
        "headings": headings,
        "keywords": keywords,
        "pagePreviews": pages[:12],
        "text": full_text,
    }

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
