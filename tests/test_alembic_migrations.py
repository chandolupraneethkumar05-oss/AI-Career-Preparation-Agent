"""
Alembic Migrations Verification & Downgrade/Upgrade Lifecycle Test
AI Career Preparation Agent
"""

import os
import sys
import unittest
from alembic import command
from alembic.config import Config
from sqlalchemy import text

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.core.config import settings
from app.db.database import SessionLocal, init_db, engine
from app.db.models import User


class TestAlembicMigrations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        ini_path = os.path.join(backend_path, "alembic.ini")
        cls.alembic_cfg = Config(ini_path)
        cls.alembic_cfg.set_main_option("script_location", os.path.join(backend_path, "alembic"))
        cls.alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

    def _cleanup_tmp_tables(self):
        try:
            with engine.connect() as conn:
                tmp_tables = [
                    r[0] for r in conn.execute(
                        text("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '_alembic_tmp_%'")
                    ).fetchall()
                ]
                for t in tmp_tables:
                    conn.execute(text(f"DROP TABLE IF EXISTS {t}"))
                conn.commit()
        except Exception:
            pass

    def test_01_alembic_upgrade_head_and_version_stamping(self):
        """Verifies that alembic upgrade head applies all migrations cleanly."""
        self._cleanup_tmp_tables()
        try:
            command.upgrade(self.alembic_cfg, "head")
        except Exception as exc:
            self.fail(f"Alembic upgrade head failed: {exc}")

    def test_02_alembic_downgrade_and_reupgrade_cycle(self):
        """Verifies rollback capability to base and re-upgrade without data loss."""
        self._cleanup_tmp_tables()
        # 1. Insert a test user
        with SessionLocal() as db:
            if not db.query(User).filter(User.id == "migration_test_user").first():
                db.add(User(
                    id="migration_test_user",
                    email="migrator@example.com",
                    name="Migration Test User",
                    target_role="Software Engineer"
                ))
                db.commit()

        # 2. Downgrade to base
        try:
            command.downgrade(self.alembic_cfg, "base")
        except Exception as exc:
            self.fail(f"Alembic downgrade base failed: {exc}")

        self._cleanup_tmp_tables()

        # 3. Re-upgrade to head
        try:
            command.upgrade(self.alembic_cfg, "head")
        except Exception as exc:
            self.fail(f"Alembic re-upgrade head failed: {exc}")

        # 4. Assert user data was preserved across migrations
        with SessionLocal() as db:
            user = db.query(User).filter(User.id == "migration_test_user").first()
            self.assertIsNotNone(user, "User data was lost during migration upgrade/downgrade cycle!")
            self.assertEqual(user.email, "migrator@example.com")


if __name__ == "__main__":
    unittest.main()
