# AutoReji — PyInstaller runtime hook (config.toml yol düzeltmesi).
#
# NEDEN: sidecar/decide.py CONFIG_PATH'i şöyle çözer:
#     dirname(dirname(__file__))/config/config.toml
#   Kaynaktan çalışırken (sidecar/decide.py) bu = <proje>/config/config.toml ✓
#   Ama FROZEN (PyInstaller) binary'de tüm .py modülleri _MEIPASS köküne açılır →
#   dirname(dirname(_MEIPASS/decide.pyc)) = _MEIPASS'in ÜST klasörü → YANLIŞ.
#
# ÇÖZÜM: config.toml'u build_sidecar.sh `--add-data` ile _MEIPASS/config/config.toml'a
#   gömer; bu hook frozen'da decide.CONFIG_PATH'i o gerçek yola yeniden bağlar.
#   Sidecar modülleri DEĞİŞTİRİLMEDEN kalır (Blueprint köprü mandatı). Çevre değişkeni
#   AUTOREJI_CONFIG verilmişse o öncelik kazanır (test/override için).
#
# Runtime hook'lar bootstrap'tan SONRA, asıl script'ten ÖNCE çalışır; app modüllerini
#   import etmek desteklenir. İdempotent: dosya yoksa sessizce hiçbir şey yapmaz
#   (decide kod-varsayılanlarına düşer; davranış asla bozulmaz).
import os
import sys


def _patch_config_path():
    base = getattr(sys, "_MEIPASS", None)
    if not base:
        return  # frozen değil → hiçbir şey yapma
    override = os.environ.get("AUTOREJI_CONFIG")
    candidate = override or os.path.join(base, "config", "config.toml")
    if not os.path.exists(candidate):
        return  # config gömülü değil → decide güvenli varsayılanlara düşer
    try:
        import decide  # noqa: WPS433  (frozen'da _MEIPASS'ten import edilir)
        decide.CONFIG_PATH = candidate
    except Exception:
        # decide henüz import edilemezse, ortam değişkeniyle iz bırak; build_manifest
        # import sırasında decide'i yükler ve o noktada bu hook zaten çalışmış olur.
        os.environ.setdefault("AUTOREJI_CONFIG", candidate)


_patch_config_path()
