#!/usr/bin/env python3
"""Gera a arte de catálogo do GameAO (1200x1800) a partir de HTML/SVG.

Uso: python3 scripts/product-art/generate.py [slug ...]
Requer chromium headless e Pillow.
"""
from __future__ import annotations

import html
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT_CATALOG = ROOT / "public" / "assets" / "catalog"
OUT_PRODUCTS = ROOT / "public" / "assets" / "products"
TMP = Path("/tmp/gameao-art")
FONTS = (ROOT / "public" / "assets" / "fonts").as_uri()
CHROME = os.environ.get("CHROME_BIN", "/usr/bin/chromium")

# ---------------------------------------------------------------- motifs


def gem(x: float, y: float, s: float, opacity: float = 1) -> str:
    return f"""
    <g transform="translate({x},{y}) scale({s})" opacity="{opacity}">
      <polygon points="0,-120 150,-10 0,150 -150,-10" fill="url(#gemBody)"/>
      <polygon points="0,-120 150,-10 0,20 -150,-10" fill="#ffffff" opacity=".22"/>
      <polygon points="0,-120 60,-10 0,150 -60,-10" fill="#ffffff" opacity=".16"/>
      <polygon points="-150,-10 0,20 0,150" fill="#000000" opacity=".18"/>
      <polygon points="0,-120 150,-10 0,-10" fill="#ffffff" opacity=".3"/>
      <path d="M-150,-10 L150,-10" stroke="#ffffff" stroke-opacity=".55" stroke-width="4"/>
    </g>"""


def motif_diamonds(slug: str = '') -> str:
    tier = 0
    for key, val in (("5600", 4), ("2180", 3), ("1060", 2), ("520", 1)):
        if key in slug:
            tier = val
            break
    extras = [(120, 520, .62), (590, 150, .5), (150, 210, .34), (600, 520, .3)]
    extra_svg = "".join(
        gem(x, y, sc, .9) for x, y, sc in extras[:tier]
    )
    scale = 1.5 + tier * 0.07
    return f"""
    <svg viewBox="0 0 700 700" class="motif">
      <defs>
        <linearGradient id="gemBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--acc2)"/>
          <stop offset=".55" stop-color="var(--acc)"/>
          <stop offset="1" stop-color="var(--acc3)"/>
        </linearGradient>
      </defs>
      <circle cx="350" cy="330" r="250" fill="var(--acc)" opacity=".13"/>
      {gem(350, 320, scale)}
      {extra_svg}
      <g stroke="#ffffff" stroke-opacity=".8" stroke-width="6" stroke-linecap="round">
        <path d="M120,180 l0,44 M98,202 l44,0"/>
        <path d="M600,470 l0,34 M583,487 l34,0"/>
      </g>
    </svg>"""


def motif_calendar(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 700 700" class="motif">
      <rect x="120" y="150" width="460" height="420" rx="40" fill="var(--acc)" opacity=".14"/>
      <rect x="150" y="180" width="400" height="360" rx="28" fill="#0b0714" opacity=".55"/>
      <rect x="150" y="180" width="400" height="90" rx="28" fill="var(--acc)"/>
      <rect x="150" y="240" width="400" height="30" fill="var(--acc)"/>
      <g fill="#0b0714" opacity=".55">
        <circle cx="230" cy="150" r="18"/><circle cx="470" cy="150" r="18"/>
      </g>
      <g stroke="#ffffff" stroke-opacity=".28" stroke-width="6">
        <path d="M150,340 H550 M150,420 H550 M300,270 V540 M420,270 V540"/>
      </g>
      <path d="M470,470 l60,60 l110,-130" fill="none" stroke="var(--acc2)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>"""


def motif_weapon(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 760 520" class="motif">
      <g fill="#ffffff" opacity=".92">
        <rect x="150" y="220" width="380" height="48" rx="10"/>
        <polygon points="530,220 690,238 690,268 530,268"/>
        <polygon points="150,220 70,258 70,300 175,272"/>
        <rect x="300" y="264" width="78" height="140" rx="12" transform="rotate(-10 339 334)"/>
        <rect x="405" y="264" width="46" height="104" rx="10" transform="rotate(6 428 316)"/>
        <rect x="230" y="176" width="150" height="44" rx="10"/>
        <rect x="470" y="196" width="60" height="24" rx="8"/>
      </g>
      <g stroke="var(--acc)" stroke-width="5" opacity=".85">
        <path d="M170,300 H500"/>
        <path d="M250,320 H430"/>
      </g>
      <circle cx="620" cy="150" r="70" fill="none" stroke="var(--acc2)" stroke-width="6" opacity=".6"/>
      <path d="M620,80 v40 M620,180 v40 M550,150 h40 M650,150 h40" stroke="var(--acc2)" stroke-width="6" opacity=".6"/>
    </svg>"""


def motif_ticket(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 700 700" class="motif">
      <g transform="rotate(-8 350 350)">
        <rect x="90" y="230" width="520" height="270" rx="34" fill="var(--acc)"/>
        <rect x="90" y="230" width="520" height="270" rx="34" fill="url(#shine)"/>
        <circle cx="90" cy="365" r="34" fill="var(--bg1)"/>
        <circle cx="610" cy="365" r="34" fill="var(--bg1)"/>
        <path d="M430,240 V490" stroke="#0b0714" stroke-opacity=".35" stroke-width="6" stroke-dasharray="18 16"/>
        <g fill="#0b0714" opacity=".78">
          <rect x="130" y="280" width="250" height="26" rx="13"/>
          <rect x="130" y="330" width="180" height="20" rx="10" opacity=".7"/>
          <rect x="130" y="380" width="220" height="20" rx="10" opacity=".7"/>
          <rect x="470" y="290" width="90" height="90" rx="16" opacity=".85"/>
        </g>
        <path d="M492,335 l22,22 l40,-48" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>"""


def motif_handheld(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 700 700" class="motif">
      <rect x="180" y="90" width="340" height="520" rx="52" fill="#0b0f1e" stroke="var(--acc)" stroke-width="8"/>
      <rect x="215" y="140" width="270" height="240" rx="14" fill="url(#screen)"/>
      <circle cx="265" cy="470" r="42" fill="#12182c" stroke="#ffffff" stroke-opacity=".5" stroke-width="6"/>
      <circle cx="265" cy="470" r="16" fill="var(--acc)"/>
      <circle cx="435" cy="470" r="42" fill="#12182c" stroke="#ffffff" stroke-opacity=".5" stroke-width="6"/>
      <circle cx="435" cy="470" r="16" fill="var(--acc2)"/>
      <g fill="#ffffff" opacity=".8">
        <rect x="330" y="420" width="16" height="52" rx="4"/><rect x="312" y="438" width="52" height="16" rx="4"/>
        <circle cx="410" cy="425" r="9"/><circle cx="440" cy="445" r="9"/>
      </g>
      <path d="M250,560 h200" stroke="#ffffff" stroke-opacity=".35" stroke-width="8" stroke-linecap="round"/>
    </svg>"""


def motif_gamepad(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 760 560" class="motif">
      <defs>
        <linearGradient id="pad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--acc)"/><stop offset="1" stop-color="var(--acc3)"/>
        </linearGradient>
      </defs>
      <path d="M180,150 C90,150 50,230 62,310 L92,430 C104,486 176,500 206,452 L250,382 H510 L554,452 C584,500 656,486 668,430 L698,310 C710,230 670,150 580,150 C520,150 490,190 380,190 C270,190 240,150 180,150 Z"
            fill="url(#pad)" opacity=".95"/>
      <path d="M180,150 C90,150 50,230 62,310 L92,430 C104,486 176,500 206,452 L250,382 H510 L554,452 C584,500 656,486 668,430 L698,310 C710,230 670,150 580,150 C520,150 490,190 380,190 C270,190 240,150 180,150 Z"
            fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="6"/>
      <g fill="#0b0714" opacity=".72">
        <rect x="170" y="270" width="34" height="110" rx="10"/><rect x="132" y="308" width="110" height="34" rx="10"/>
        <circle cx="560" cy="300" r="22"/><circle cx="612" cy="348" r="22"/>
        <circle cx="512" cy="348" r="22"/><circle cx="560" cy="396" r="22"/>
        <rect x="330" y="300" width="46" height="18" rx="9"/>
        <rect x="392" y="300" width="46" height="18" rx="9"/>
      </g>
    </svg>"""


def motif_canva(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 700 700" class="motif">
      <defs>
        <linearGradient id="canva" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--acc)"/><stop offset="1" stop-color="var(--acc2)"/>
        </linearGradient>
      </defs>
      <circle cx="350" cy="330" r="230" fill="url(#canva)" opacity=".16"/>
      <circle cx="350" cy="330" r="230" fill="none" stroke="url(#canva)" stroke-width="10"/>
      <text x="350" y="440" text-anchor="middle" font-family="Rubik" font-weight="900" font-size="330" fill="url(#canva)">C</text>
      <g fill="var(--acc2)">
        <path d="M560,120 l16,44 l44,16 l-44,16 l-16,44 l-16,-44 l-44,-16 l44,-16z"/>
        <path d="M140,470 l12,32 l32,12 l-32,12 l-12,32 l-12,-32 l-32,-12 l32,-12z" opacity=".8"/>
      </g>
    </svg>"""


def motif_robux(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 700 700" class="motif">
      <defs>
        <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--acc)"/><stop offset="1" stop-color="var(--acc3)"/>
        </linearGradient>
      </defs>
      <g transform="translate(350,340)">
        <polygon points="0,-250 216,-125 216,125 0,250 -216,125 -216,-125" fill="url(#coin)"/>
        <polygon points="0,-250 216,-125 216,125 0,250 -216,125 -216,-125" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="8"/>
        <polygon points="0,-200 174,-100 174,100 0,200 -174,100 -174,-100" fill="#0b1410" opacity=".35"/>
        <text x="0" y="95" text-anchor="middle" font-family="Rubik" font-weight="900" font-size="260" fill="#ffffff">R</text>
      </g>
      <g fill="var(--acc2)" opacity=".9">
        <circle cx="140" cy="150" r="26"/><circle cx="590" cy="520" r="20"/><circle cx="560" cy="170" r="14"/>
      </g>
    </svg>"""


def motif_glove(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 700 700" class="motif">
      <g fill="var(--acc)">
        <rect x="210" y="150" width="86" height="300" rx="43" transform="rotate(-12 253 300)"/>
        <rect x="310" y="120" width="86" height="330" rx="43"/>
        <rect x="410" y="160" width="86" height="290" rx="43" transform="rotate(12 453 305)"/>
        <rect x="180" y="430" width="330" height="130" rx="46"/>
      </g>
      <g fill="#0b0714" opacity=".45">
        <circle cx="253" cy="220" r="9"/><circle cx="253" cy="270" r="9"/><circle cx="253" cy="320" r="9"/>
        <circle cx="353" cy="190" r="9"/><circle cx="353" cy="250" r="9"/><circle cx="353" cy="310" r="9"/>
        <circle cx="453" cy="230" r="9"/><circle cx="453" cy="290" r="9"/><circle cx="453" cy="350" r="9"/>
        <rect x="220" y="470" width="250" height="18" rx="9"/><rect x="220" y="510" width="250" height="18" rx="9"/>
      </g>
      <path d="M300,600 h140" stroke="#ffffff" stroke-opacity=".4" stroke-width="10" stroke-linecap="round"/>
    </svg>"""


def motif_racing(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 760 620" class="motif">
      <g stroke="var(--acc)" stroke-width="10" opacity=".55" stroke-linecap="round">
        <path d="M60,190 h240"/><path d="M40,250 h180"/><path d="M80,310 h140"/>
      </g>
      <path d="M150,520 A210,210 0 0 1 570,520" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="26" stroke-linecap="round"/>
      <path d="M150,520 A210,210 0 0 1 430,326" fill="none" stroke="var(--acc)" stroke-width="26" stroke-linecap="round"/>
      <circle cx="360" cy="520" r="18" fill="#ffffff"/>
      <path d="M360,520 L470,400" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
      <g fill="#ffffff" opacity=".9">
        <rect x="470" y="150" width="34" height="34"/><rect x="538" y="150" width="34" height="34"/>
        <rect x="504" y="184" width="34" height="34"/><rect x="572" y="184" width="34" height="34"/>
        <rect x="470" y="218" width="34" height="34"/><rect x="538" y="218" width="34" height="34"/>
      </g>
      <g fill="var(--acc2)">
        <circle cx="620" cy="420" r="10"/><circle cx="660" cy="360" r="7"/><circle cx="600" cy="320" r="6"/>
      </g>
    </svg>"""


def motif_crosshair(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 700 700" class="motif">
      <circle cx="350" cy="350" r="220" fill="none" stroke="var(--acc)" stroke-width="10" opacity=".9"/>
      <circle cx="350" cy="350" r="120" fill="none" stroke="var(--acc)" stroke-width="6" opacity=".55"/>
      <circle cx="350" cy="350" r="16" fill="var(--acc2)"/>
      <g stroke="var(--acc2)" stroke-width="12" stroke-linecap="round">
        <path d="M350,70 v120 M350,510 v120 M70,350 h120 M510,350 h120"/>
      </g>
      <g fill="var(--acc)" opacity=".22">
        <polygon points="350,190 470,350 350,510 230,350"/>
      </g>
      <g stroke="#ffffff" stroke-opacity=".5" stroke-width="4">
        <path d="M120,120 l60,60 M580,120 l-60,60 M120,580 l60,-60 M580,580 l-60,-60"/>
      </g>
    </svg>"""


def motif_sword(slug: str = '') -> str:
    return """
    <svg viewBox="0 0 700 760" class="motif">
      <defs>
        <linearGradient id="blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
          <stop offset="1" stop-color="var(--acc)" stop-opacity=".85"/>
        </linearGradient>
      </defs>
      <g transform="translate(350,400) scale(1.18) rotate(-32) translate(-350,-400)">
        <polygon points="320,60 380,60 392,470 308,470" fill="url(#blade)"/>
        <polygon points="320,60 350,60 350,470 308,470" fill="#ffffff" opacity=".35"/>
        <circle cx="350" cy="200" r="16" fill="var(--bg1)"/>
        <circle cx="350" cy="280" r="16" fill="var(--bg1)"/>
        <rect x="240" y="470" width="220" height="34" rx="16" fill="#0b0714" opacity=".8"/>
        <rect x="326" y="500" width="48" height="150" rx="20" fill="#0b0714" opacity=".8"/>
        <circle cx="350" cy="670" r="26" fill="var(--acc2)"/>
      </g>
      <circle cx="350" cy="380" r="290" fill="var(--acc)" opacity=".1"/>
      <g fill="var(--acc2)">
        <path d="M560,180 l14,38 l38,14 l-38,14 l-14,38 l-14,-38 l-38,-14 l38,-14z" opacity=".9"/>
        <path d="M150,540 l10,28 l28,10 l-28,10 l-10,28 l-10,-28 l-28,-10 l28,-10z" opacity=".7"/>
      </g>
    </svg>"""


def motif_motocross(slug: str = '') -> str:
    import math

    cells = []
    cols, rows, size = 5, 4, 74
    for r in range(rows):
        for c in range(cols):
            x = 200 + c * size
            y = 170 + r * size + math.sin((c / cols) * 2.4) * 10
            if (r + c) % 2 == 0:
                cells.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{size}" height="{size}" fill="#ffffff" opacity=".95"/>')
            else:
                cells.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{size}" height="{size}" fill="#0b0714" opacity=".8"/>')
    flag = "".join(cells)
    return f"""
    <svg viewBox="0 0 760 620" class="motif">
      <rect x="168" y="120" width="22" height="430" rx="11" fill="#ffffff" opacity=".85"/>
      <g>{flag}</g>
      
      <g fill="var(--acc2)" opacity=".9">
        <circle cx="150" cy="560" r="16"/><circle cx="230" cy="585" r="9"/><circle cx="640" cy="540" r="12"/>
      </g>
      <g stroke="var(--acc2)" stroke-width="8" stroke-linecap="round" opacity=".65">
        <path d="M60,120 h120"/><path d="M40,180 h90"/><path d="M620,90 h110"/>
      </g>
    </svg>"""


MOTIFS = {
    "diamonds": motif_diamonds,
    "calendar": motif_calendar,
    "weapon": motif_weapon,
    "ticket": motif_ticket,
    "handheld": motif_handheld,
    "gamepad": motif_gamepad,
    "canva": motif_canva,
    "robux": motif_robux,
    "glove": motif_glove,
    "racing": motif_racing,
    "crosshair": motif_crosshair,
    "sword": motif_sword,
    "motocross": motif_motocross,
}

THEMES = {
    "ice":    ("#04101f", "#0b2f52", "#38e1ff", "#8b5cf6", "#1d7fff", "rgba(56,225,255,.45)"),
    "violet": ("#120726", "#2c1055", "#ffcc4d", "#ff5fa2", "#7c3aed", "rgba(255,95,162,.42)"),
    "ember":  ("#170808", "#3a1010", "#ff6b35", "#ffd166", "#ff2d55", "rgba(255,107,53,.45)"),
    "jade":   ("#04140f", "#0c3a2b", "#4ade80", "#facc15", "#0ea5e9", "rgba(74,222,128,.4)"),
    "cobalt": ("#050c22", "#16265e", "#6ea8ff", "#a78bfa", "#2563eb", "rgba(110,168,255,.45)"),
    "lime":   ("#07160c", "#12351f", "#7cf03d", "#22d3ee", "#15803d", "rgba(124,240,61,.4)"),
    "royal":  ("#060a24", "#1a1f4d", "#4f8bff", "#22d3ee", "#4338ca", "rgba(79,139,255,.45)"),
    "canva":  ("#0b0920", "#241a4d", "#00c4cc", "#7d2ae8", "#22d3ee", "rgba(0,196,204,.42)"),
    "steel":  ("#0d0f12", "#1f2429", "#e2e8f0", "#22c55e", "#64748b", "rgba(226,232,240,.35)"),
    "amber":  ("#140f08", "#2c2116", "#f59e0b", "#fbbf24", "#b45309", "rgba(245,158,11,.4)"),
    "sunset": ("#08131f", "#123b52", "#ff7a18", "#00d4ff", "#ff2d55", "rgba(255,122,24,.45)"),
    "olive":  ("#0b0f0b", "#20281d", "#b6ff3c", "#f8fafc", "#4d7c0f", "rgba(182,255,60,.35)"),
    "mako":   ("#04120f", "#0b2f27", "#38f2c8", "#a3e635", "#0d9488", "rgba(56,242,200,.4)"),
    "dirt":   ("#160c05", "#3a1d0b", "#ff8a00", "#fde047", "#b45309", "rgba(255,138,0,.45)"),
}

# slug, theme, motif, kicker, title lines, value, note
CATALOG = [
    ("100-diamantes-free-fire", "ice", "diamonds", "DIAMANTES", ["FREE FIRE"], "100", "ENTREGA IMEDIATA"),
    ("310-diamantes-free-fire", "ice", "diamonds", "DIAMANTES", ["FREE FIRE"], "310", "ENTREGA IMEDIATA"),
    ("520-diamantes-free-fire", "ice", "diamonds", "DIAMANTES", ["FREE FIRE"], "520", "ENTREGA IMEDIATA"),
    ("1060-diamantes-free-fire", "ice", "diamonds", "DIAMANTES", ["FREE FIRE"], "1060", "ENTREGA IMEDIATA"),
    ("2180-diamantes-no-free-fire", "ice", "diamonds", "DIAMANTES", ["FREE FIRE"], "2180", "ENTREGA IMEDIATA"),
    ("5600-diamantes-no-free-fire", "ice", "diamonds", "DIAMANTES", ["FREE FIRE"], "5600", "ENTREGA IMEDIATA"),
    ("promocao-de-200-dimas", "ice", "diamonds", "PROMOÇÃO", ["200 DIMAS"], "200", "OFERTA LIMITADA"),
    ("assinatura-semanal-ff", "violet", "calendar", "ASSINATURA FF", ["SEMANAL"], "", "BOOYAH PASS"),
    ("assinatura-mensal-ff", "violet", "calendar", "ASSINATURA FF", ["MENSAL"], "", "30 DIAS"),
    ("assinatura-economica-ff", "violet", "calendar", "ASSINATURA FF", ["ECONÓMICA"], "", "POUPANÇA"),
    ("armas-evolutivas-por-3-dias", "ember", "weapon", "ARMAS EVOLUTIVAS", ["3 DIAS"], "", "SKIN TEMPORÁRIA"),
    ("armas-evolutivas-7-dias", "ember", "weapon", "ARMAS EVOLUTIVAS", ["7 DIAS"], "", "SKIN TEMPORÁRIA"),
    ("armas-evolutivas-por-30-dias", "ember", "weapon", "ARMAS EVOLUTIVAS", ["30 DIAS"], "", "SKIN TEMPORÁRIA"),
    ("passe-booyah", "jade", "ticket", "CÓDIGO DIGITAL", ["PASSE", "BOOYAH"], "", "TEMPORADA ATUAL"),
    ("codiguin-snicker", "jade", "ticket", "CODIGUIN", ["COELHÃO", "SNICKER"], "", "RESGATE RÁPIDO"),
    ("psvita", "cobalt", "handheld", "CONSOLA PORTÁTIL", ["PS VITA"], "", "SONY PLAYSTATION"),
    ("desbloqueio-psvita", "cobalt", "handheld", "SERVIÇO TÉCNICO", ["DESBLOQUEIO", "PS VITA"], "", "SEM PERDA DE DADOS"),
    ("jogos-xbox", "lime", "gamepad", "MÍDIA DIGITAL", ["JOGOS", "XBOX"], "", "ONE · SERIES X|S"),
    ("fc-26-ps4-ps5", "royal", "gamepad", "MÍDIA DIGITAL", ["FC 26"], "", "PS4 · PS5"),
    ("call-of-duty-modern-warfare", "olive", "crosshair", "MÍDIA DIGITAL", ["MODERN", "WARFARE"], "", "PS4 · PS5"),
    ("god-of-war-ps4-ps5", "royal", "sword", "MÍDIA DIGITAL", ["GOD OF WAR"], "", "PS4 · PS5"),
    ("jogos-digital-ps4ps5", "royal", "gamepad", "MÍDIA DIGITAL", ["JOGOS", "PS4 · PS5"], "", "ENTREGA NA CONTA"),
    ("canva-pro-30-dias", "canva", "canva", "DESIGN PRO", ["CANVA PRO"], "", "30 DIAS"),
    ("robux", "steel", "robux", "MOEDAS ROBLOX", ["ROBUX"], "", "ENTREGA RÁPIDA"),
    ("robux-gif-card", "steel", "robux", "GIFT CARD", ["ROBUX"], "", "CÓDIGO DIGITAL"),
    ("luvinha-gamer", "amber", "glove", "ACESSÓRIO GAMER", ["LUVINHA"], "", "ANTIDERRAPANTE"),
]

GAMES = [
    ("forza-horizon-5", "sunset", "racing", "XBOX · PC", ["FORZA", "HORIZON 5"], "", "MUNDO ABERTO"),
    ("call-of-duty-black-ops", "olive", "crosshair", "PC · PLAYSTATION · XBOX", ["BLACK OPS"], "", "CALL OF DUTY"),
    ("final-fantasy-vii-remake", "mako", "sword", "PC · PLAYSTATION", ["FINAL", "FANTASY VII"], "", "REMAKE"),
    ("motocross-2020", "dirt", "motocross", "PC · PLAYSTATION · XBOX", ["MOTOCROSS"], "", "2020"),
]

CSS = """
@font-face{font-family:'Rubik';src:url('__FONT__/rubik-400.woff2') format('woff2');font-weight:400}
@font-face{font-family:'Rubik';src:url('__FONT__/rubik-700.woff2') format('woff2');font-weight:700}
@font-face{font-family:'Rubik';src:url('__FONT__/rubik-900.woff2') format('woff2');font-weight:900}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:1800px}
body{
  font-family:'Rubik',sans-serif;color:#fff;overflow:hidden;position:relative;
  background:
    radial-gradient(900px 700px at 78% 12%, var(--glow), transparent 70%),
    radial-gradient(800px 800px at 8% 78%, var(--glow), transparent 72%),
    linear-gradient(158deg, var(--bg1) 0%, var(--bg2) 62%, var(--bg1) 100%);
}
.grid{position:absolute;inset:0;
  background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px);
  background-size:100px 100px;mask-image:radial-gradient(circle at 50% 35%,#000 30%,transparent 85%);}
.streak{position:absolute;width:1400px;height:220px;transform:rotate(-24deg);background:linear-gradient(90deg,transparent,var(--glow),transparent);opacity:.35;top:38%;left:-120px;filter:blur(6px)}
.noise{position:absolute;inset:0;opacity:.5;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='180' height='180' filter='url(%23n)' opacity='.35'/></svg>");}
.vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,transparent 45%,rgba(0,0,0,.55) 100%)}
.frame{position:absolute;inset:44px;border:1px solid rgba(255,255,255,.14)}
header{position:absolute;top:78px;left:82px;right:82px;display:flex;align-items:center;justify-content:space-between;z-index:3}
.brand{display:flex;align-items:baseline;gap:4px;font-weight:900;font-size:40px;letter-spacing:-1px}
.brand i{width:12px;height:12px;background:var(--acc);border-radius:50%;display:inline-block;margin-left:6px}
.brand small{font-size:20px;font-weight:700;letter-spacing:5px;opacity:.55;margin-left:14px}
.chip{border:1px solid rgba(255,255,255,.35);padding:10px 18px;font-size:19px;font-weight:700;letter-spacing:3px;border-radius:100px;backdrop-filter:blur(4px)}
.art{position:absolute;top:225px;left:0;right:0;height:730px;display:grid;place-items:center;z-index:2}
.motif{height:700px;width:auto;filter:drop-shadow(0 30px 70px rgba(0,0,0,.55))}
.copy{position:absolute;left:82px;right:82px;bottom:176px;z-index:3}
.kicker{font-size:26px;font-weight:700;letter-spacing:9px;color:var(--acc);text-transform:uppercase;margin-bottom:14px}
.value{font-weight:900;font-size:var(--vsize,420px);line-height:.86;letter-spacing:-12px;color:#fff;text-shadow:0 18px 60px rgba(0,0,0,.45);margin-bottom:4px}
.title{font-weight:900;font-size:var(--tsize,104px);line-height:.9;letter-spacing:-3px;text-transform:uppercase}
.title span{display:block}
.title span+span{color:var(--acc)}
.note{margin-top:22px;display:flex;gap:10px;flex-wrap:wrap}
.note b{font-weight:700;font-size:19px;letter-spacing:2px;padding:10px 16px;border:1px solid rgba(255,255,255,.28);border-radius:6px;background:rgba(255,255,255,.06)}
.note b:first-child{border-color:var(--acc);color:var(--acc)}
footer{position:absolute;left:82px;right:82px;bottom:78px;display:flex;justify-content:space-between;align-items:center;font-size:19px;letter-spacing:3px;color:rgba(255,255,255,.6);z-index:3;border-top:1px solid rgba(255,255,255,.16);padding-top:22px;font-weight:700}
"""



CHIPS = {
    "DIAMANTES": "FREE FIRE", "PROMOÇÃO": "FREE FIRE", "ASSINATURA FF": "FREE FIRE",
    "ARMAS EVOLUTIVAS": "FREE FIRE", "CÓDIGO DIGITAL": "FREE FIRE", "CODIGUIN": "FREE FIRE",
    "CONSOLA PORTÁTIL": "PS VITA", "SERVIÇO TÉCNICO": "PS VITA", "DESIGN PRO": "CANVA",
    "MOEDAS ROBLOX": "ROBLOX", "GIFT CARD": "ROBLOX", "ACESSÓRIO GAMER": "GAMER",
}


def chip_for(slug: str, kicker: str, lines: list[str]) -> str:
    if kicker == "MÍDIA DIGITAL":
        joined = " ".join(lines)
        if "XBOX" in joined:
            return "XBOX"
        return "PLAYSTATION"
    return CHIPS.get(kicker, kicker.split(" · ")[0])


def poster(slug: str, theme: str, motif: str, kicker: str, lines: list[str], value: str, note: str) -> str:
    bg1, bg2, acc, acc2, acc3, glow = THEMES[theme]
    # tamanhos dinâmicos para caber sempre
    if value:
        n = len(value)
        vsize = {2: 520, 3: 450, 4: 372, 5: 306}.get(n, 280)
        tsize = 92
    else:
        vsize = 100
        longest = max(len(x) for x in lines)
        tsize = 168 if longest <= 7 else 132 if longest <= 10 else 108
    style = (
        f"--bg1:{bg1};--bg2:{bg2};--acc:{acc};--acc2:{acc2};--acc3:{acc3};--glow:{glow};"
        f"--vsize:{vsize}px;--tsize:{tsize}px"
    )
    title_html = "".join(f"<span>{html.escape(line)}</span>" for line in lines)
    value_html = f'<div class="value">{html.escape(value)}</div>' if value else ""
    return f"""<!doctype html><html lang="pt"><head><meta charset="utf-8"><style>{CSS.replace('__FONT__', FONTS)}</style></head>
<body style="{style}">
  <div class="grid"></div><div class="streak"></div>
  <div class="art">{MOTIFS[motif](slug)}</div>
  <div class="vignette"></div><div class="noise"></div><div class="frame"></div>
  <header><div class="brand">GAME<span class="brand-ao">AO</span><small>LOJA DIGITAL</small></div><div class="chip">{html.escape(chip_for(slug, kicker, lines))}</div></header>
  <div class="copy">
    <p class="kicker">{html.escape(kicker)}</p>
    {value_html}
    <div class="title">{title_html}</div>
    <div class="note"><b>{html.escape(note)}</b><b>ANGOLA</b></div>
  </div>
  <footer><span>GAMEÃO · LOJA DIGITAL ANGOLA</span><span>COMPRA SEGURA</span></footer>
</body></html>"""


def render(item: tuple) -> tuple[str, str]:
    slug, theme, motif, kicker, lines, value, note, out_dir = item
    TMP.mkdir(parents=True, exist_ok=True)
    html_path = TMP / f"{slug}.html"
    png_path = TMP / f"{slug}.png"
    html_path.write_text(poster(slug, theme, motif, kicker, lines, value, note), encoding="utf-8")
    cmd = [
        CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", "--window-size=1200,1800",
        f"--screenshot={png_path}", html_path.as_uri(),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / f"{slug}.jpg"
    Image.open(png_path).convert("RGB").save(target, "JPEG", quality=88, optimize=True, progressive=True)
    # miniatura 2:3 para cartões
    card = out_dir / f"{slug}-card.jpg"
    Image.open(png_path).convert("RGB").resize((600, 900), Image.LANCZOS).save(
        card, "JPEG", quality=84, optimize=True, progressive=True
    )
    return slug, str(target)


def main() -> None:
    only = set(sys.argv[1:])
    jobs = []
    for slug, theme, motif, kicker, lines, value, note in CATALOG:
        jobs.append((slug, theme, motif, kicker, lines, value, note, OUT_CATALOG))
    for slug, theme, motif, kicker, lines, value, note in GAMES:
        jobs.append((slug, theme, motif, kicker, lines, value, note, OUT_PRODUCTS))
    if only:
        jobs = [j for j in jobs if j[0] in only]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for slug, path in pool.map(render, jobs):
            print(f"ok {slug} -> {path}")


if __name__ == "__main__":
    main()
