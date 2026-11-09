"""Optional maintainer tool: python3-fonttools + python3-brotli, after prepare:audit.

Normal builds use the checked-in subset, with no Python dependency.
Only remove glyphs; preserve Monda's original outlines and 400–700 variation axis.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
font = TTFont(root / 'generated/public/fonts/monda-latin-ext.woff2')
options = subset.Options()
options.flavor = 'woff2'
subsetter = subset.Subsetter(options=options)
subsetter.populate(text='ąćęłńśźżĄĆĘŁŃŚŹŻ')  # ó/Ó are already in latin.
subsetter.subset(font)
font.save(root / 'src/fonts/monda-polish.woff2')
