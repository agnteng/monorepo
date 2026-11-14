#!/usr/bin/env python3
"""Fitness checks: what a healthy repository looks like (docs/adr/0005).

    python3 scripts/fitness.py              repo checks (fast, no network)
    python3 scripts/fitness.py --render     built decks match tests/snapshots/
    python3 scripts/fitness.py --render --update   rewrite the snapshots on purpose
    python3 scripts/fitness.py --live       production answers as it should

Every check exists because its failure happened once. Exit 1 if any fails.

The internal-names check reads its denylist from PUBLIC_DENYLIST (the pattern
text itself, which CI supplies as a secret) or from the workspace this
checkout sits in. The patterns never live in this public repository.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import socket
import struct
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FAILURES: list[str] = []


def fail(check: str, msg: str) -> None:
    FAILURES.append(f"{check}: {msg}")


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True,
                          text=True, check=True).stdout


def tracked() -> list[str]:
    return [p for p in git("ls-files", "-z").split("\0") if p]


# ── internal names (org ADR: public repositories name no infrastructure) ──

GENERIC = [
    r"op://",                                        # secret-store references
    r"\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",            # private IPv4
    r"\b192\.168\.\d{1,3}\.\d{1,3}\b",
    r"\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b",
    r"\b100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b",  # CGNAT / tailnets
    r"/Users/[a-z0-9_-]+/",                          # local home paths
    r"/home/[a-z0-9_-]+/",
]
SKIP_FILES = {"scripts/fitness.py", "pnpm-lock.yaml"}


def denylist() -> list[str]:
    text = os.environ.get("PUBLIC_DENYLIST", "")
    if not text:
        f = ROOT.parent.parent / "private" / "denylist.txt"
        if ROOT.parent.name == "repos" and f.exists():
            text = f.read_text()
    pats = [ln.strip() for ln in text.splitlines()
            if ln.strip() and not ln.lstrip().startswith("#")]
    if not pats:
        print("  note: no private denylist (PUBLIC_DENYLIST or the workspace); "
              "checking generic patterns only", file=sys.stderr)
    return pats


def check_internal_names() -> None:
    rx = re.compile("|".join(f"(?:{p})" for p in GENERIC + denylist()), re.I)

    def scan(where: str, text: str) -> None:
        for m in rx.finditer(text):
            line = text.count("\n", 0, m.start()) + 1
            # Report where, never the matched text: CI logs are public.
            fail("internal-names", f"{where}:{line} matches a denylisted pattern")
            return

    for path in tracked():
        if path in SKIP_FILES:
            continue
        p = ROOT / path
        try:
            scan(path, p.read_text())
        except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError):
            continue
    for sha in git("rev-list", "HEAD").split():
        scan(f"commit {sha[:7]} message", git("log", "-1", "--format=%B", sha))
    extra = os.environ.get("FITNESS_EXTRA_TEXT", "")
    if extra:
        scan("pull request title/body", extra)


# ── media and scratch stay out of git (org ADR: media never enters git) ──

MEDIA_EXT = {".mp4", ".mov", ".mkv", ".m4v", ".avi", ".wav", ".m4a", ".mp3", ".mxf"}
SCRATCH_DIRS = {"raw", "work", "upload", "clips"}
MAX_BYTES = 5_000_000


def check_media() -> None:
    for path in tracked():
        p = Path(path)
        if p.suffix.lower() in MEDIA_EXT:
            fail("media", f"{path} is a media file")
        elif path.startswith("content/") and SCRATCH_DIRS & set(p.parts):
            fail("media", f"{path} is inside a media/scratch folder")
        elif (ROOT / p).is_file() and (ROOT / p).stat().st_size > MAX_BYTES:
            fail("media", f"{path} is over {MAX_BYTES // 1_000_000} MB")


# ── event.json shape (docs/adr/0001) ──

def check_events() -> None:
    public = ROOT / "apps" / "branding" / "public"
    for f in sorted((ROOT / "content").glob("*/event.json")):
        where = f.relative_to(ROOT)
        try:
            e = json.loads(f.read_text())
        except json.JSONDecodeError as err:
            fail("events", f"{where}: not JSON ({err})")
            continue
        if e.get("date") != f.parent.name:
            fail("events", f"{where}: date {e.get('date')!r} is not the folder name")
        for k in ("city", "venue", "tonight"):
            if not isinstance(e.get(k), str) or not e[k]:
                fail("events", f"{where}: needs a non-empty {k!r}")
        if not isinstance(e.get("number"), int):
            fail("events", f"{where}: needs an integer 'number'")
        for k in ("free", "approval"):
            if k in e and not isinstance(e[k], bool):
                fail("events", f"{where}: {k!r} should be true or false")
        if "recap" in e and not str(e["recap"]).startswith("https://"):
            fail("events", f"{where}: recap should be an https URL")
        luma = e.get("luma")
        if luma is not None:
            if not str(luma.get("apiId", "")).startswith("evt-"):
                fail("events", f"{where}: luma.apiId should start with evt-")
            if not str(luma.get("url", "")).startswith("https://"):
                fail("events", f"{where}: luma.url should be an https URL")
            if not re.match(r"\d{4}-\d\d-\d\dT\d\d:\d\d", str(luma.get("startAt", ""))):
                fail("events", f"{where}: luma.startAt should be an ISO timestamp")
        for i, s in enumerate(e.get("speakers", [])):
            if not s.get("name") or not s.get("title"):
                fail("events", f"{where}: speaker {i} needs name and title")
            photo = s.get("photo")
            if photo and not (public / photo.lstrip("/")).is_file():
                fail("events", f"{where}: speaker {i} photo {photo} does not exist")


# ── published talks (org ADR 0007) ──

def check_talks() -> None:
    for f in sorted((ROOT / "content").glob("*/talks/*.json")):
        where = f.relative_to(ROOT)
        if not (f.parent.parent / "event.json").exists():
            fail("talks", f"{where}: no event.json for {f.parent.parent.name}")
        try:
            t = json.loads(f.read_text())
        except json.JSONDecodeError as err:
            fail("talks", f"{where}: not JSON ({err})")
            continue
        for k in ("slug", "title", "speaker", "summary"):
            if not isinstance(t.get(k), str) or not t[k]:
                fail("talks", f"{where}: needs a non-empty {k!r}")
        video = t.get("video")
        if video is not None and not re.fullmatch(r"[\w-]{11}", str(video.get("youtubeId", ""))):
            fail("talks", f"{where}: video.youtubeId is not a YouTube id")
    # Rendered thumbnails beside their talks (production's publish_talks.py).
    for f in sorted((ROOT / "content").glob("*/talks/*.jpg")):
        where, data = f.relative_to(ROOT), f.read_bytes()
        if not f.with_suffix(".json").exists():
            fail("talks", f"{where}: no talk {f.stem}.json beside it")
        elif len(data) > PHOTO_MAX_BYTES or max(jpeg_size(data)) > PHOTO_MAX_EDGE:
            fail("talks", f"{where}: over {PHOTO_MAX_BYTES // 1000} KB or {PHOTO_MAX_EDGE}px")
        elif any(m in data for m in PHOTO_METADATA):
            fail("talks", f"{where}: carries EXIF, XMP or IPTC metadata")


# ── event galleries (org ADR 0008) ──

PHOTO_MAX_BYTES = 600_000
PHOTO_MAX_EDGE = 1600
# EXIF, XMP and IPTC can each carry a location.
PHOTO_METADATA = (b"Exif\x00\x00", b"http://ns.adobe.com/xap/1.0/", b"Photoshop 3.0")


def jpeg_size(data: bytes) -> tuple[int, int]:
    """(width, height) from the first start-of-frame marker."""
    i = 2
    while i + 9 < len(data):
        marker, length = data[i + 1], int.from_bytes(data[i + 2:i + 4], "big")
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            return int.from_bytes(data[i + 7:i + 9], "big"), int.from_bytes(data[i + 5:i + 7], "big")
        i += 2 + length
    return 0, 0


MASK_MAX_BYTES = 100_000
MASK_METADATA = {b"tEXt", b"zTXt", b"iTXt", b"eXIf", b"iCCP"}


def png_chunks(data: bytes) -> dict[bytes, bytes]:
    """Chunk type → data (the first of each type); empty if not a PNG."""
    chunks, i = {}, 8
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return chunks
    while i + 8 <= len(data):
        length, kind = int.from_bytes(data[i:i + 4], "big"), data[i + 4:i + 8]
        chunks.setdefault(kind, data[i + 8:i + 8 + length])
        i += 12 + length
    return chunks


FRAMING = json.loads((ROOT / "apps" / "site" / "src" / "speaker-framing.json").read_text())


def covers(size: list[int], face: list[float]) -> bool:
    """Does a headshot fill its tile with the face at most 5% over size, as the site frames it?"""
    (w, h), (cx, cy, fh) = size, face
    at, aspect = FRAMING["at"], w / h
    need = max(at / cy, (1 - at) / (1 - cy), FRAMING["tile"] / (2 * aspect * min(cx, 1 - cx)))
    return need <= 1.05 * FRAMING["face"] / fh


def check_photos() -> None:
    listed = set()
    for listing in sorted((ROOT / "content").glob("*/photos.json")):
        where = listing.relative_to(ROOT)
        photos = json.loads(listing.read_text())
        listed |= {listing.parent / "photos" / p.get("file", "") for p in photos}
        for p in photos:
            f = listing.parent / "photos" / p.get("file", "")
            if not f.is_file():
                fail("photos", f"{where}: {p.get('file')!r} is missing")
            elif not p.get("alt", "").strip():
                fail("photos", f"{where}: {p['file']} needs alt text")
    for f in sorted((ROOT / "content").glob("*/photos/[!.]*")):
        where, data = f.relative_to(ROOT), f.read_bytes()
        if f.suffix != ".jpg":
            fail("photos", f"{where}: only .jpg web copies go here")
        elif f not in listed:
            fail("photos", f"{where}: not in photos.json, so it has no alt text")
        elif len(data) > PHOTO_MAX_BYTES or max(jpeg_size(data)) > PHOTO_MAX_EDGE:
            fail("photos", f"{where}: over {PHOTO_MAX_BYTES // 1000} KB or {PHOTO_MAX_EDGE}px; use event_photos.py")
        elif any(m in data for m in PHOTO_METADATA):
            fail("photos", f"{where}: still has EXIF, XMP or IPTC metadata (location); use event_photos.py")
    # Photos the site serves straight from the branding app (org ADR 0009).
    public = ROOT / "apps" / "branding" / "public" / "assets"
    for f in sorted([*public.glob("photos/**/*"), *public.glob("speakers/*")]):
        if not f.is_file() or f.name.startswith("."):
            continue
        where, data = f.relative_to(ROOT), f.read_bytes()
        if f.suffix != ".jpg":
            fail("photos", f"{where}: photos are .jpg; convert with photos.py web")
        elif len(data) > PHOTO_MAX_BYTES or max(jpeg_size(data)) > PHOTO_MAX_EDGE:
            fail("photos", f"{where}: over {PHOTO_MAX_BYTES // 1000} KB or {PHOTO_MAX_EDGE}px; run photos.py")
        elif any(m in data for m in PHOTO_METADATA):
            fail("photos", f"{where}: still has EXIF, XMP or IPTC metadata; run photos.py optimize")
    # Speaker masks from production's speaker_masks.py, one per headshot (org ADR 0010).
    masks = public / "speaker-masks"
    sources = json.loads((masks / "sources.json").read_text()) if (masks / "sources.json").exists() else {}
    for photo in sorted(public.glob("speakers/*.jpg")):
        if not (masks / f"{photo.stem}.png").is_file():
            fail("photos", f"{photo.relative_to(ROOT)}: no speaker-masks/{photo.stem}.png; run speaker_masks.py")
        elif not isinstance(entry := sources.get(photo.name), dict) or entry.get("sha256") != hashlib.sha256(photo.read_bytes()).hexdigest():
            fail("photos", f"{photo.relative_to(ROOT)}: its mask was made from another photo; re-run speaker_masks.py")
        elif (face := entry.get("face")) is not None and not (
                len(face) == 3 and all(isinstance(v, (int, float)) and 0 < v < 1 for v in face)):
            fail("photos", f"{photo.relative_to(ROOT)}: face in sources.json should be [x, y, height] fractions; re-run speaker_masks.py")
        elif entry.get("size") != list(jpeg_size(photo.read_bytes())):
            fail("photos", f"{photo.relative_to(ROOT)}: size in sources.json doesn't match; re-run speaker_masks.py")
        elif face and not covers(entry["size"], face):
            fail("photos", f"{photo.relative_to(ROOT)}: ends inside its tile; run extend_headshots.py, then speaker_masks.py")
    for f in sorted(masks.glob("*")):
        if not f.is_file() or f.name.startswith(".") or f.name == "sources.json":
            continue
        where, data = f.relative_to(ROOT), f.read_bytes()
        photo = public / "speakers" / f"{f.stem}.jpg"
        chunks = png_chunks(data) if f.suffix == ".png" else {}
        if b"IHDR" not in chunks:
            fail("photos", f"{where}: masks are .png; make them with speaker_masks.py")
        elif chunks[b"IHDR"][8:10] != b"\x08\x00":
            fail("photos", f"{where}: not 8-bit greyscale (mode L); use speaker_masks.py")
        elif len(data) > MASK_MAX_BYTES:
            fail("photos", f"{where}: over {MASK_MAX_BYTES // 1000} KB; use speaker_masks.py")
        elif chunks.keys() & MASK_METADATA:
            fail("photos", f"{where}: carries text, EXIF or ICC chunks; use speaker_masks.py")
        elif not photo.is_file():
            fail("photos", f"{where}: no speakers/{photo.name} to mask")
        elif jpeg_size(photo.read_bytes()) != struct.unpack(">II", chunks[b"IHDR"][:8]):
            fail("photos", f"{where}: not the size of speakers/{photo.name}; re-run speaker_masks.py")


# ── rendered decks unchanged (refactors must not alter what's on screen) ──

PAGES = ["", "brand-guidelines/", "sponsorship/", "slides/",
         "slides/lisbon-2026-07-29/", "slides/lisbon-2026-08-26/",
         "slides/lisbon-2026-09-23/", "slides/lisbon-2026-11-11/"]
SNAPSHOTS = ROOT / "tests" / "snapshots"
NORMALISE = [
    (re.compile(r"/_astro/[A-Za-z0-9_.-]+"), "/_astro/X"),
    (re.compile(r'astro-island uid="[^"]*"'), "astro-island"),
    (re.compile(r'(component-url|renderer-url|before-hydration-url)="[^"]*"'), r'\1="X"'),
]


def normalise(html: str) -> str:
    for rx, rep in NORMALISE:
        html = rx.sub(rep, html)
    return html


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def check_render(update: bool) -> None:
    entry = ROOT / "apps" / "branding" / "dist" / "server" / "entry.mjs"
    if not entry.exists():
        fail("render", "no build: run `LUMA_API_KEY= pnpm --filter branding build` first")
        return
    port = free_port()
    env = {**os.environ, "HOST": "127.0.0.1", "PORT": str(port), "LUMA_API_KEY": ""}
    srv = subprocess.Popen(["node", str(entry)], env=env, stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=1)
                break
            except OSError:
                time.sleep(0.2)
        SNAPSHOTS.mkdir(parents=True, exist_ok=True)
        for page in PAGES:
            name = (page.strip("/").replace("/", "_") or "index") + ".html"
            html = normalise(urllib.request.urlopen(
                f"http://127.0.0.1:{port}/{page}", timeout=10).read().decode())
            snap = SNAPSHOTS / name
            if update:
                snap.write_text(html)
            elif not snap.exists():
                fail("render", f"no snapshot for /{page}: run with --update")
            elif snap.read_text() != html:
                fail("render", f"/{page} renders differently from tests/snapshots/{name}")
    finally:
        srv.terminate()
        srv.wait()
    if update:
        print(f"  wrote {len(PAGES)} snapshots to {SNAPSHOTS.relative_to(ROOT)}")


# ── production (org ADR: deploys are verified live) ──

def get(url: str) -> tuple[int, bytes]:
    try:
        r = urllib.request.urlopen(urllib.request.Request(
            url, headers={"User-Agent": "agnteng-fitness"}), timeout=20)
        return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""


def check_live() -> None:
    b, s = "https://branding.agnteng.com", "https://sponsors.agnteng.com"
    for page in PAGES:
        code, _ = get(f"{b}/{page}")
        if code != 200:
            fail("live", f"{b}/{page} answered {code}")
    code, body = get(f"{b}/api/audience.json")
    try:
        guests = json.loads(body).get("totalGuests", 0) if code == 200 else 0
    except json.JSONDecodeError:
        guests = 0
    if not guests:
        fail("live", "api/audience.json reports no guests: the build lost LUMA_API_KEY")
    if get(f"{s}/")[0] != 200:
        fail("live", f"{s}/ is not serving the sponsor deck")
    if get(f"{s}/brand-guidelines/")[0] != 404:
        fail("live", f"{s} serves more than the sponsor deck")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--update", action="store_true", help="with --render: rewrite snapshots")
    ap.add_argument("--live", action="store_true")
    args = ap.parse_args()

    if args.live:
        checks = [("live", check_live)]
    elif args.render:
        checks = [("render", lambda: check_render(args.update))]
    else:
        checks = [("internal-names", check_internal_names), ("media", check_media),
                  ("events", check_events), ("talks", check_talks),
                  ("photos", check_photos)]
    for name, fn in checks:
        before = len(FAILURES)
        fn()
        print(f"  {'ok  ' if len(FAILURES) == before else 'FAIL'} {name}")
    for f in FAILURES:
        print(f"  ✗ {f}", file=sys.stderr)
    sys.exit(1 if FAILURES else 0)


if __name__ == "__main__":
    main()
