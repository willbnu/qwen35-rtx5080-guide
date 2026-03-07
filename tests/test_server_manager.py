"""Unit tests for server_manager command construction."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from config.config_loader import get_config
from server_manager import build_server_command


def test_build_server_command_uses_server_config_builder():
    """Keep server_manager command generation aligned with ServerConfig."""
    config = get_config()
    server = config.get_server("coding")
    assert server is not None

    assert build_server_command(server) == server.to_llama_command(config.llama_dir)
