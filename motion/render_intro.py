"""Render the 18-second Anna Diyanova portfolio film from local project assets."""

from functools import lru_cache
from pathlib import Path
import argparse
import math
import shutil
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent
W, H, FPS, DURATION = 1920, 1080, 60, 18
INK = (10, 13, 14)
PAPER = (240, 243, 239)
MINT = (71, 255, 170)
CYAN = (94, 215, 246)
MUTED = (148, 160, 156)
STARTS = (0, 3.65, 7.4, 13.55)
TRANSITION = 0.7
PROJECTS = (
    ("FAMILY SUBSCRIPTION", "MOBILE / GAZPROM BONUS", "GazpromBonus_Family Subscription.png"),
    ("TAXI BOOKING", "MOBILE / SERVICE DESIGN", "Taxi.png"),
    ("BRIDGE.TRAVEL", "MOBILE / MARKETPLACE", "BridgeTravel.png"),
)


def clamp(x):
    return max(0.0, min(1.0, x))


def ease(x):
    x = clamp(x)
    return x * x * x * (x * (6 * x - 15) + 10)


def mix(a, b, p):
    return a + (b - a) * p


@lru_cache(maxsize=96)
def font(size, bold=False, sans=False):
    name = "/System/Library/Fonts/Supplemental/Arial.ttf" if sans else str(ROOT / ("formula-bold.otf" if bold else "formula.otf"))
    return ImageFont.truetype(name, size)


@lru_cache(maxsize=128)
def lettering(text, size, color, bold=True, sans=False):
    f = font(size, bold, sans)
    box = f.getbbox(text)
    img = Image.new("RGBA", (math.ceil(f.getlength(text)) + 4, box[3] - box[1] + 6))
    ImageDraw.Draw(img).text((0, -box[1]), text, font=f, fill=color)
    return img


def label(img, text, xy, size=24, color=MUTED, bold=False, sans=True):
    tile = lettering(text, size, color, bold, sans)
    img.paste(tile, tuple(map(round, xy)), tile)


def reveal(img, text, xy, size, color, progress, delay=0):
    p = ease((progress - delay) / 0.75)
    tile = lettering(text, size, color)
    height = tile.height
    panel = Image.new("RGBA", tile.size)
    panel.paste(tile, (0, round((1 - p) * (height + 16))), tile)
    img.paste(panel, tuple(map(round, xy)), panel)


def rule(img, y, color, progress=1, left=100, right=1820):
    ImageDraw.Draw(img).line((left, y, mix(left, right, ease(progress)), y), fill=color, width=2)


def corner(img, number, text, color):
    label(img, "ANNA DIYANOVA", (100, 76), 26, color)
    label(img, f"{number:02d} / {text}", (1390, 76), 22, color)


def opening(t):
    img = Image.new("RGB", (W, H), INK)
    corner(img, 1, "THE QUESTION", PAPER)
    rule(img, 134, (52, 63, 59), t / 0.9)
    reveal(img, "EVERY PRODUCT", (100, 254), 152, PAPER, t)
    reveal(img, "STARTS WITH", (100, 426), 152, PAPER, t, 0.18)
    reveal(img, "A QUESTION.", (100, 598), 152, MINT, t, 0.36)
    # The question mark becomes the visual anchor for the next scene.
    tile = lettering("?", 620, MINT)
    x = 1500 + 90 * (1 - ease(t / 1.5))
    y = 228 + 9 * math.sin(t * 1.6)
    img.paste(tile, (round(x), round(y)), tile)
    label(img, "What should this make easier?", (104, 923), 30, MUTED)
    rule(img, 1010, MINT, t / 3.8)
    return img


def system(t):
    img = Image.new("RGB", (W, H), MINT)
    corner(img, 2, "THE PROCESS", INK)
    rule(img, 134, (22, 170, 111))
    reveal(img, "I TURN", (100, 263), 158, INK, t)
    reveal(img, "COMPLEXITY", (100, 440), 158, INK, t, 0.14)
    reveal(img, "INTO CLARITY.", (100, 617), 158, INK, t, 0.28)
    p = ease((t - 0.55) / 1.7)
    draw = ImageDraw.Draw(img)
    # Independent pieces converge into an ordered interface, not a decorative UI.
    for i in range(6):
        col, row = i % 2, i // 2
        tx, ty = 1170 + col * 300, 270 + row * 172
        sx = tx + (95 if i % 2 else -70)
        sy = ty + (50 if i % 3 else -65)
        x, y = mix(sx, tx, p), mix(sy, ty, p)
        width, height = 265, 138
        draw.rounded_rectangle((x, y, x + width, y + height), radius=8, fill=INK)
        label(img, ("QUESTION", "CONTEXT", "STRUCTURE", "SYSTEM", "INTERACTION", "PRODUCT")[i], (x + 22, y + 23), 18, PAPER)
        for j in range(2):
            length = (width - 44) * (0.9 - j * 0.26)
            draw.line((x + 22, y + 79 + j * 15, x + 22 + length, y + 79 + j * 15), fill=(71, 102, 88), width=4)
    label(img, "Understand. Structure. Design.", (104, 923), 30, INK)
    rule(img, 1010, INK, t / 3.8)
    return img


@lru_cache(maxsize=3)
def project_asset(i):
    return Image.open(ROOT / "img" / PROJECTS[i][2]).convert("RGB")


def work(t):
    img = Image.new("RGB", (W, H), PAPER)
    corner(img, 3, "THE PRODUCTS", INK)
    rule(img, 134, (190, 199, 190))
    reveal(img, "FROM FIRST IDEA", (100, 197), 126, INK, t)
    reveal(img, "TO REAL PRODUCTS.", (100, 342), 126, INK, t, 0.16)
    for i in range(3):
        p = ease((t - 0.22 - i * 0.16) / 1.0)
        x = 100 + i * 582
        y = round(536 + 175 * (1 - p))
        width, height = 556, 401
        panel = project_asset(i).resize((width, height), Image.Resampling.LANCZOS)
        panel = Image.blend(Image.new("RGB", panel.size, PAPER), panel, p)
        img.paste(panel, (x, y))
        # A moving outline ties the project reel to the earlier system modules.
        active = clamp((t - 1.2 - i * 1.25) / 0.7)
        ImageDraw.Draw(img).line((x, y + height + 10, x + width * active, y + height + 10), fill=INK, width=4)
        label(img, PROJECTS[i][0], (x, y + height + 27), 23, INK)
    return img


def closing(t):
    img = Image.new("RGB", (W, H), INK)
    corner(img, 4, "LET'S BUILD", PAPER)
    rule(img, 134, (52, 63, 59))
    reveal(img, "ANNA", (100, 256), 234, PAPER, t, 0.05)
    reveal(img, "DIYANOVA", (100, 501), 234, MINT, t, 0.2)
    p = ease((t - 0.65) / 0.9)
    label(img, "FOUNDING PRODUCT DESIGNER", (108, 798), 34, tuple(round(v * p) for v in PAPER))
    label(img, "From the first question to the final detail.", (108, 875), 27, tuple(round(v * p) for v in MUTED))
    # A single directional mark resolves the film with forward movement.
    draw = ImageDraw.Draw(img)
    end = mix(1410, 1785, ease((t - 0.7) / 1.0))
    draw.line((1410, 565, end, 565), fill=CYAN, width=10)
    if t > 0.7:
        q = ease((t - 0.7) / 1.0)
        draw.line((end - 95 * q, 565 - 95 * q, end, 565, end - 95 * q, 565 + 95 * q), fill=CYAN, width=10)
    label(img, "annadiyanova.site", (108, 989), 25, PAPER)
    label(img, "IDEA / SYSTEM / PRODUCT", (1410, 989), 21, MUTED)
    return img


SCENES = (opening, system, work, closing)


def frame(t):
    index = max(i for i, start in enumerate(STARTS) if t >= start)
    local = t - STARTS[index]
    current = SCENES[index](local)
    if index and local < TRANSITION:
        previous = SCENES[index - 1](t - STARTS[index - 1])
        p = ease(local / TRANSITION)
        # Soft directional match-wipe; both scenes remain in motion throughout.
        edge = int(mix(-220, W + 220, p))
        ramp = np.clip((edge - np.arange(W) + 140) / 280, 0, 1)
        mask = Image.fromarray(np.tile((ramp * 255).astype(np.uint8), (H, 1)))
        current = Image.composite(current, previous, mask)
    return current


def storyboard():
    times = (1.8, 3.95, 5.7, 8.0, 10.8, 12.7, 14.5, 16.6)
    sheet = Image.new("RGB", (960, 4 * 300), (28, 31, 33))
    draw = ImageDraw.Draw(sheet)
    for i, t in enumerate(times):
        x, y = i % 2 * 480, i // 2 * 300
        sheet.paste(frame(t).resize((480, 270), Image.Resampling.LANCZOS), (x, y))
        draw.text((x + 12, y + 277), f"{t:04.1f}s", font=font(16, sans=True), fill=PAPER)
    sheet.save(OUT / "storyboard.jpg", quality=93)
    frame(16.6).save(OUT / "poster.jpg", quality=95)


def soundtrack():
    sr = 48000
    time = np.arange(sr * DURATION) / sr
    stereo = np.zeros((time.size, 2))
    rng = np.random.default_rng(18)
    # Original synthesized score. No sampled or third-party music.
    for beat in np.arange(0, DURATION - 1, 60 / 110):
        start = int(beat * sr)
        length = min(int(0.26 * sr), time.size - start)
        x = np.arange(length) / sr
        kick = np.sin(2 * np.pi * (49 * x + 3.5 * (1 - np.exp(-30 * x)))) * np.exp(-20 * x) * 0.17
        stereo[start:start + length] += kick[:, None]
    for i, start_time in enumerate(np.arange(0.25, 16.8, 60 / 110 / 2)):
        start = int(start_time * sr)
        length = min(int(0.65 * sr), time.size - start)
        x = np.arange(length) / sr
        note = (57, 60, 64, 67, 64, 60, 69, 67)[i % 8]
        frequency = 440 * 2 ** ((note - 69) / 12)
        env = (1 - np.exp(-100 * x)) * np.exp(-6 * x)
        tone = (np.sin(2 * np.pi * frequency * x) + 0.2 * np.sin(2 * np.pi * 2 * frequency * x)) * env * 0.075
        pan = 0.3 + 0.4 * (i % 3) / 2
        stereo[start:start + length, 0] += tone * (1 - pan)
        stereo[start:start + length, 1] += tone * pan
    for start_time in STARTS[1:]:
        start = int((start_time - 0.2) * sr)
        length = int(0.65 * sr)
        noise = rng.normal(0, 0.016, length)
        noise = np.convolve(noise, np.ones(12) / 12, mode="same")
        noise *= np.sin(np.linspace(0, np.pi, length)) ** 2
        stereo[start:start + length] += noise[:, None]
    fade = np.minimum(np.clip(time / 0.7, 0, 1), np.clip((DURATION - time) / 1.3, 0, 1))
    stereo *= fade[:, None]
    stereo *= 0.7 / max(0.7, np.abs(stereo).max())
    with wave.open(str(OUT / "soundtrack.wav"), "wb") as stream:
        stream.setnchannels(2)
        stream.setsampwidth(2)
        stream.setframerate(sr)
        stream.writeframes((stereo * 32767).astype("<i2").tobytes())


def render(ffmpeg, fps):
    silent = OUT / "Anna-Diyanova-18s-Silent.mp4"
    command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(silent)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for n in range(DURATION * fps):
            process.stdin.write(frame(n / fps).tobytes())
            if n % fps == 0:
                print(f"Rendered {n // fps}/{DURATION}s", flush=True)
    except Exception:
        process.kill()
        raise
    finally:
        process.stdin.close()
        result = process.wait()
    if result:
        raise RuntimeError(f"FFmpeg returned {result}")
    soundtrack()
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(silent), "-i", str(OUT / "soundtrack.wav"), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(DURATION), "-movflags", "+faststart", str(OUT / "Anna-Diyanova-18s.mp4")], check=True)
    print("Both MP4 versions are ready.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg"))
    parser.add_argument("--storyboard-only", action="store_true")
    parser.add_argument("--fps", type=int, default=FPS)
    args = parser.parse_args()
    storyboard()
    if not args.storyboard_only:
        if not args.ffmpeg:
            parser.error("Pass --ffmpeg /path/to/ffmpeg or use --storyboard-only")
        render(args.ffmpeg, args.fps)
