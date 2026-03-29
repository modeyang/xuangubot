from scripts.ingest.common import normalize_symbol


def test_symbol_normalization_preserves_leading_zeroes():
    assert normalize_symbol("000001") == "000001"

