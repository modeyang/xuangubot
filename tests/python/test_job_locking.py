from scripts.ingest.common import acquire_lock, release_lock


def test_file_lock_prevents_overlap(tmp_path):
    lock_path = tmp_path / "job.lock"
    assert acquire_lock(lock_path) is True
    assert acquire_lock(lock_path) is False
    release_lock(lock_path)
    assert acquire_lock(lock_path) is True

