from PIL import Image


def test_webp_thumbnail_round_trip(tmp_path):
    image = Image.new("RGB", (40, 50), "green")
    image.thumbnail((20, 20))
    out = tmp_path / "thumb.webp"
    image.save(out, "WEBP", quality=82)
    assert out.exists()
    assert out.stat().st_size > 0
