import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

import build_ballot


def test_flat_removes_punctuation_and_roman_numerals():
    assert build_ballot.flat("Aba North") == "abanorth"
    assert build_ballot.flat("Ikeja II") == "ikeja"


def test_slug_builds_url_segments():
    assert build_ballot.slug("Aba North/Aba South") == "aba-north-aba-south"


def test_party_code_normalises_spaces():
    assert build_ballot.party_code("S D P") == "SDP"
    assert build_ballot.party_code(" apc ") == "APC"


def test_title_keeps_roman_numerals():
    assert build_ballot.title("aba north") == "Aba North"
    assert build_ballot.title("Ikeja II") == "Ikeja II"


def test_level_reads_common_qualifications():
    assert build_ballot.level("B.Sc") == "degree"
    assert build_ballot.level("FSLC") == "primary"
    assert build_ballot.level("WASC") == "secondary"


def test_assembly_constituency_matches_its_lga():
    assert build_ballot.match_assembly_lga("Aba North", "01")["id"] == "01-01"
    assert build_ballot.match_assembly_lga("Ikeja II", "24")["id"] == "24-11"
