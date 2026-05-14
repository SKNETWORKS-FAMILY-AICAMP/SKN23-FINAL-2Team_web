import unittest
import os

os.environ["USE_SSH_TUNNEL"] = "False"

from backend.models import models
from backend.routers import admin_router


class AdminDocumentHelpersTest(unittest.TestCase):
    def test_standard_document_key_uses_domain_and_document_type_folder(self):
        key, stem = admin_router.build_standard_document_s3_key(
            document_id="doc-123",
            filename="국가 건설기준.pdf",
            domain="arch",
            doc_type="spec",
        )

        self.assertEqual(key, f"standards/arch/spec/{stem}.pdf")
        self.assertTrue(stem.startswith("doc-123_"))

    def test_legacy_category_maps_to_runpod_domain(self):
        self.assertEqual(admin_router.resolve_document_domain(None, "소방"), "fire")
        self.assertEqual(admin_router.resolve_document_domain("전기", None), "elec")

    def test_runpod_payload_uses_existing_schema_fields(self):
        payload = admin_router.build_runpod_document_input(
            file_url="https://example.com/file.pdf",
            doc_type="standard",
            document_id="doc-123",
            doc_name="doc-123_화재안전기준",
            domain="fire",
            effective_date=None,
        )

        self.assertEqual(payload["doc_type"], "regulation")
        self.assertEqual(payload["document_id"], "doc-123")
        self.assertEqual(payload["parent_document_id"], "doc-123")
        self.assertEqual(payload["domain"], "fire")
        self.assertEqual(payload["category"], "standard")
        self.assertNotIn("s3_md_path", payload)
        self.assertNotIn("s3_json_path", payload)

    def test_document_chunk_model_exposes_table_markdown_column(self):
        self.assertIn("table_markdown", models.DocumentChunk.__table__.columns)


if __name__ == "__main__":
    unittest.main()
