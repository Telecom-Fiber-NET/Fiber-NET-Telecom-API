#!/usr/bin/env python3
"""
Parser de extração OLT Huawei MA5608T via SNMP (somente leitura).
FONTE: github.com/Jeremias0618/Huawei-OLT-ONT-SNMP-MIBs
Formato OID: 1.3.6.1.4.1.2011.6.128.1.1.2.<TAB>.1.<COL>.<IDX>.<SUB>
  hwGponOntOpticalInfo (.51): COL.4 = ONU RX (dBm x100), COL.6 = OLT RX,
                              COL.0 = temperatura (graus), outras = TX/tensao/bias
  hwGponOnt (.43): COL.3 = serial (Hex-STRING)
  hwGponDeviceInfo (.21): existencia da ONT
Limite conhecido: a MA5608T expoe via SNMP so a ONT 0 de cada PON (32 ONTs p/ 32 PONs).
"""
import re, json, os
import subprocess

BASE = "/root/fibernet-noc"
SCALE = 100

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
    # remove caracteres de controle (0x00-0x1F) que quebram o XLSX
    return "".join(ch for ch in s if ord(ch) >= 32)

def parse_file(path, pat):
    out = {}
    if not os.path.exists(path):
        return out
    for ln in open(path):
        m = re.search(pat, ln)
        if m:
            yield m
    return out

def main():
    # .51 otica: .51.1.<COL>.<IDX>.<SUB> = INTEGER: val  (arquivo PON-por-PON, todas as ONTs)
    opt = {}
    for m in parse_file(f"{BASE}/t51_pon.txt", r"\.51\.1\.(\d+)\.(\d+)\.(\d+) = INTEGER:\s*(-?\d+)"):
        col, idx, sub, v = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
        opt.setdefault(idx, {}).setdefault(col, {})[sub] = v
    # .43 serial: .43.1.3.<IDX>.<N> = Hex-STRING
    sn = {}
    for m in parse_file(f"{BASE}/t43_sn.txt", r"\.43\.1\.3\.(\d+)\.\d+ = Hex-STRING:\s*(.+)"):
        sn[int(m.group(1))] = hex_sn(m.group(2))

    onts = []
    for idx in sorted(opt):
        f, s, p, o = decode_idx(idx)
        d = opt[idx]
        def primeiro_valido(col):
            for sub, v in d.get(col, {}).items():
                if v not in (2147483647, 0, -2147483648):
                    return v
            return None
        rx_raw = primeiro_valido(4)
        tx_raw = primeiro_valido(6)
        t_raw = primeiro_valido(0)
        rx_val = round(rx_raw / SCALE, 2) if rx_raw is not None else None
        tx_val = round(tx_raw / SCALE, 2) if tx_raw is not None else None
        temp_val = round(t_raw / 10, 1) if t_raw is not None else None
        onts.append({
            "idx": idx, "frame": f, "slot": s, "pon": f"{s}/{p}", "pon_num": p, "ont": o,
            "serial": sn.get(idx, ""),
            "rx_dbm": rx_val, "tx_dbm": tx_val, "temp_c": temp_val,
        })
    json.dump(onts, open(f"{BASE}/onts_snmp.json", "w"), indent=2)
    print(f"{len(onts)} ONTs (ONT-0 de cada PON) parseadas -> onts_snmp.json")
    for x in onts[:8]:
        print(f"  PON {x['pon']} ONT{x['ont']}: RX={x['rx_dbm']} TX={x['tx_dbm']} T={x['temp_c']}C SN={x['serial']}")

if __name__ == "__main__":
    main()
