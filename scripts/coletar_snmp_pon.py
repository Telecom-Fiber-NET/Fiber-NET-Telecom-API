#!/usr/bin/env python3
"""
Coleta potência OLT Huawei MA5608T via SNMP — PON POR PON (32 walks).
Cada PON (slot0/port N) tem OID base 4194304000 + N*256.
O walk de UMA PON retorna TODAS as ONTs dela (diferente do walk da arvore toda que trunca).
"""
import subprocess, os, re, json
from datetime import date

BASE = "/root/fibernet-noc"
OLT = "100.64.200.3"
COMM = "public"
SCALE = 100

PON_BASE = 4194304000  # slot0/port0/ont0

def decode_idx(idx):
    frame = (idx >> 24) & 0xFF
    slot = (idx >> 16) & 0xFF
    port = (idx >> 8) & 0xFF
    ont = idx & 0xFF
    return frame, slot, port, ont

def hex_sn(h):
    h = h.replace("Hex-STRING:", "").strip()
    try:
        s = bytes.fromhex(h.replace(" ", "")).decode("ascii", errors="ignore")
    except Exception:
        s = h.replace(" ", "")
    return "".join(ch for ch in s if ord(ch) >= 32)

def walk_pon(pon_idx, out_file):
    subprocess.run(["snmpwalk", "-v2c", "-c", COMM, "-t90", "-r2", OLT,
                    f"1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.{pon_idx}"],
                   stdout=open(out_file, "w"), stderr=subprocess.DEVNULL, timeout=600)

def main():
    all_txt = f"{BASE}/t51_pon.txt"
    open(all_txt, "w").close()
    for n in range(32):  # 32 PONs (slot0/port0..port31)
        pon_idx = PON_BASE + n * 256
        tmp = f"{BASE}/_pon_{n}.txt"
        walk_pon(pon_idx, tmp)
        with open(tmp) as f, open(all_txt, "a") as g:
            g.write(f.read())
        os.remove(tmp)
        print(f"PON {n}: coletado (idx {pon_idx})")
    print("Coleta PON-por-PON concluida ->", all_txt)

if __name__ == "__main__":
    main()
