#!/usr/bin/env python3
"""
Generate Anahata app icons using the app's orbs theme:
  bg #0e0e1a  violet #7048E8  blue #3B5BDB
  Layered radial glows + a central 'A' lettermark.
"""

import struct, zlib, math, os

BG     = (14,  14,  26,  255)
VIOLET = (112, 72, 232, 255)
BLUE   = (59,  91, 219, 255)
WHITE  = (255, 255, 255, 255)


def blend(src, dst):
    sa = src[3] / 255; da = dst[3] / 255
    oa = sa + da * (1 - sa)
    if oa == 0: return (0, 0, 0, 0)
    r = int((src[0]*sa + dst[0]*da*(1-sa)) / oa)
    g = int((src[1]*sa + dst[1]*da*(1-sa)) / oa)
    b = int((src[2]*sa + dst[2]*da*(1-sa)) / oa)
    return (r, g, b, int(oa * 255))


def radial_glow(cx, cy, pixels, size, r_max, col, peak_alpha=180, feather=None):
    """Paint a soft radial glow centred at (cx,cy)."""
    if feather is None:
        feather = r_max
    x0 = max(0, int(cx - r_max))
    x1 = min(size, int(cx + r_max) + 1)
    y0 = max(0, int(cy - r_max))
    y1 = min(size, int(cy + r_max) + 1)
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = math.hypot(x - cx, y - cy)
            if d >= r_max:
                continue
            t = 1.0 - (d / r_max)
            alpha = int(peak_alpha * t * t)
            c = (*col[:3], alpha)
            pixels[y][x] = blend(c, pixels[y][x])


def aa_ring(cx, cy, r_out, r_in, col, pixels, size, feather=1.5):
    x0 = max(0, int(cx - r_out - feather))
    x1 = min(size, int(cx + r_out + feather) + 1)
    y0 = max(0, int(cy - r_out - feather))
    y1 = min(size, int(cy + r_out + feather) + 1)
    for y in range(y0, y1):
        for x in range(x0, x1):
            d = math.hypot(x - cx, y - cy)
            outer = max(0.0, min(1.0, (r_out + feather - d) / feather))
            inner = max(0.0, min(1.0, (d - r_in + feather) / feather))
            alpha = outer * inner
            if alpha > 0:
                c = (*col[:3], int(col[3] * alpha))
                pixels[y][x] = blend(c, pixels[y][x])


def draw_thick_line(x0, y0, x1, y1, col, thick, pixels, size):
    dx, dy = x1-x0, y1-y0
    length = math.hypot(dx, dy) or 1
    ux, uy = dx/length, dy/length
    nx, ny = -uy, ux
    ix0 = max(0, int(min(x0,x1)-thick-2))
    ix1 = min(size, int(max(x0,x1)+thick+3))
    iy0 = max(0, int(min(y0,y1)-thick-2))
    iy1 = min(size, int(max(y0,y1)+thick+3))
    for py in range(iy0, iy1):
        for px in range(ix0, ix1):
            rx, ry = px-x0, py-y0
            along = rx*ux + ry*uy
            perp  = abs(rx*nx + ry*ny)
            if 0 <= along <= length:
                alpha = max(0.0, min(1.0, (thick + 1.5 - perp) / 1.5))
                if alpha > 0:
                    c = (*col[:3], int(col[3] * alpha))
                    pixels[py][px] = blend(c, pixels[py][px])


def lerp(a, b, t):
    return a + (b - a) * t


def render(size):
    pixels = [[BG] * size for _ in range(size)]
    cx = cy = size / 2
    s = size / 512

    # ── outermost halo (violet, very soft) ───────────────────────
    radial_glow(cx, cy, pixels, size, 240*s, VIOLET, peak_alpha=70)

    # ── blue mid glow ─────────────────────────────────────────────
    radial_glow(cx, cy, pixels, size, 190*s, BLUE, peak_alpha=100)

    # ── violet inner glow ─────────────────────────────────────────
    radial_glow(cx, cy, pixels, size, 140*s, VIOLET, peak_alpha=140)

    # ── bright white-violet core ──────────────────────────────────
    radial_glow(cx, cy, pixels, size, 72*s, (180, 160, 255), peak_alpha=220)

    # ── ring 1: outer border (violet) ─────────────────────────────
    aa_ring(cx, cy, 210*s, 202*s, (*VIOLET[:3], 160), pixels, size, feather=2*s)

    # ── ring 2: inner ring (blue) ─────────────────────────────────
    aa_ring(cx, cy, 168*s, 162*s, (*BLUE[:3], 180), pixels, size, feather=2*s)

    # ── small orbiting dot at top (decorative) ────────────────────
    for angle, r_dot, col in [
        (-math.pi/2,        186*s, BLUE),
        (-math.pi/2 + 2.4,  186*s, VIOLET),
        (-math.pi/2 - 2.4,  186*s, VIOLET),
    ]:
        dx_ = cx + r_dot * math.cos(angle)
        dy_ = cy + r_dot * math.sin(angle)
        dot_r = 7*s
        radial_glow(dx_, dy_, pixels, size, dot_r*2.5, col, peak_alpha=200, feather=dot_r*2.5)

    # ── 'A' lettermark ────────────────────────────────────────────
    stroke = max(1, int(17*s))
    # apex
    ax, ay   = cx,       cy - 90*s
    # bottom-left / bottom-right
    bLx, bLy = cx - 68*s, cy + 72*s
    bRx, bRy = cx + 68*s, cy + 72*s

    # left stroke
    draw_thick_line(ax, ay, bLx, bLy, WHITE, stroke, pixels, size)
    # right stroke
    draw_thick_line(ax, ay, bRx, bRy, WHITE, stroke, pixels, size)
    # crossbar at 45% down
    t = 0.46
    cLx = lerp(ax, bLx, t); cLy = lerp(ay, bLy, t)
    cRx = lerp(ax, bRx, t); cRy = lerp(ay, bRy, t)
    draw_thick_line(cLx, cLy, cRx, cRy, WHITE, int(stroke*0.75), pixels, size)

    # ── tiny violet dot at apex for style ─────────────────────────
    radial_glow(ax, ay, pixels, size, 12*s, VIOLET, peak_alpha=255, feather=12*s)

    return pixels


def write_png(pixels, size, path):
    raw = b''
    for row in pixels:
        raw += b'\x00'
        for r, g, b, a in row:
            raw += bytes([r, g, b, a])
    ihdr = struct.pack('>II', size, size) + bytes([8, 6, 0, 0, 0])
    idat = zlib.compress(raw, 6)

    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', idat)
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print(f'  {size:4d}px  →  {path}')


def scale(pixels, src, dst):
    if src == dst:
        return pixels
    ratio = src / dst
    out = []
    for y in range(dst):
        row = []
        for x in range(dst):
            x0, x1_ = x*ratio, (x+1)*ratio
            y0, y1_ = y*ratio, (y+1)*ratio
            rs = gs = bs = as_ = n = 0
            for sy in range(int(y0), min(int(y1_)+1, src)):
                for sx in range(int(x0), min(int(x1_)+1, src)):
                    r,g,b,a = pixels[sy][sx]
                    rs+=r; gs+=g; bs+=b; as_+=a; n+=1
            row.append((rs//n, gs//n, bs//n, as_//n) if n else BG)
        out.append(row)
    return out


# ── paths ─────────────────────────────────────────────────────────
ROOT = os.path.join(os.path.dirname(__file__), '..')
ICONS    = f'{ROOT}/client/public/icons'
ANDROID  = f'{ROOT}/client/android/app/src/main/res'
IOS_ICON = f'{ROOT}/client/ios/App/App/Assets.xcassets/AppIcon.appiconset'
IOS_SPLASH = f'{ROOT}/client/ios/App/App/Assets.xcassets/Splash.imageset'

os.makedirs(ICONS, exist_ok=True)

print('Rendering master 512px...')
m512 = render(512)
cache = {512: m512}

def get(sz):
    if sz not in cache:
        print(f'  scaling {sz}px...')
        cache[sz] = scale(m512, 512, sz)
    return cache[sz]

targets = [
    (f'{ICONS}/icon-512.png',   512),
    (f'{ICONS}/icon-192.png',   192),
    (f'{ICONS}/icon-32.png',    32),
    (f'{ANDROID}/mipmap-xxxhdpi/ic_launcher.png',            192),
    (f'{ANDROID}/mipmap-xxxhdpi/ic_launcher_foreground.png', 192),
    (f'{ANDROID}/mipmap-xxxhdpi/ic_launcher_round.png',      192),
    (f'{ANDROID}/mipmap-xxhdpi/ic_launcher.png',             144),
    (f'{ANDROID}/mipmap-xxhdpi/ic_launcher_foreground.png',  144),
    (f'{ANDROID}/mipmap-xxhdpi/ic_launcher_round.png',       144),
    (f'{ANDROID}/mipmap-xhdpi/ic_launcher.png',              96),
    (f'{ANDROID}/mipmap-xhdpi/ic_launcher_foreground.png',   96),
    (f'{ANDROID}/mipmap-xhdpi/ic_launcher_round.png',        96),
    (f'{ANDROID}/mipmap-hdpi/ic_launcher.png',               72),
    (f'{ANDROID}/mipmap-hdpi/ic_launcher_foreground.png',    72),
    (f'{ANDROID}/mipmap-hdpi/ic_launcher_round.png',         72),
    (f'{ANDROID}/mipmap-mdpi/ic_launcher.png',               48),
    (f'{ANDROID}/mipmap-mdpi/ic_launcher_foreground.png',    48),
    (f'{ANDROID}/mipmap-mdpi/ic_launcher_round.png',         48),
]

for path, sz in targets:
    write_png(get(sz), sz, path)

# iOS App Store icon (1024px — native render for sharpness)
print('Rendering 1024px for App Store...')
m1024 = render(1024)
write_png(m1024, 1024, f'{IOS_ICON}/AppIcon-512@2x.png')

# Splash screens: dark bg + centred 256px logo
print('Generating splash screens...')
logo = get(256)

def splash(logo_px, logo_sz, total_sz):
    px = [[BG]*total_sz for _ in range(total_sz)]
    off = (total_sz - logo_sz) // 2
    for y in range(logo_sz):
        for x in range(logo_sz):
            py2, px2 = y+off, x+off
            if 0 <= py2 < total_sz and 0 <= px2 < total_sz:
                px[py2][px2] = blend(logo_px[y][x], px[py2][px2])
    return px

for name in ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']:
    sp = splash(logo, 256, 2732)
    write_png(sp, 2732, f'{IOS_SPLASH}/{name}')

print('\nDone!')
