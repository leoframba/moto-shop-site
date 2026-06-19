from voice_note import (
    VoiceNoteSummary,
    append_voice_note_to_mechanic_notes,
    format_voice_note_block,
    interactions_audio_mime_type,
    is_auth_api_key,
    normalize_audio_mime_type,
)


class TestNormalizeAudioMimeType:
    def test_strips_codec_parameters(self):
        assert normalize_audio_mime_type("audio/webm;codecs=opus") == "audio/webm"
        assert normalize_audio_mime_type("audio/ogg;codecs=opus") == "audio/ogg"

    def test_maps_common_aliases(self):
        assert normalize_audio_mime_type("audio/mp3") == "audio/mpeg"
        assert normalize_audio_mime_type("audio/x-wav") == "audio/wav"


class TestAuthApiKeyDetection:
    def test_detects_aq_prefix(self):
        assert is_auth_api_key("AQ.test-key") is True
        assert is_auth_api_key("AIzaSy-test") is False


class TestInteractionsAudioMimeType:
    def test_maps_webm_to_ogg(self):
        assert interactions_audio_mime_type("audio/webm;codecs=opus") == "audio/ogg"

    def test_maps_mp4_to_m4a(self):
        assert interactions_audio_mime_type("audio/mp4") == "audio/m4a"


class TestSummarizeVoiceNoteRouting:
    def test_auth_key_uses_interactions_api(self, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "AQ.test-key")

        interaction = type(
            "Interaction",
            (),
            {
                "status": "completed",
                "output_text": '{"transcript":"hi","summaryBullets":["a"]}',
            },
        )()

        class FakeInteractions:
            def create(self, **kwargs):
                assert "api_version" not in kwargs
                assert kwargs["input"][1]["type"] == "audio"
                assert isinstance(kwargs["input"][1]["data"], str)
                return interaction

        class FakeClient:
            interactions = FakeInteractions()

        monkeypatch.setattr("google.genai.Client", lambda **kwargs: FakeClient())

        summary = __import__("voice_note").summarize_voice_note("aGk=", "audio/webm")
        assert summary.transcript == "hi"
        assert summary.summaryBullets == ["a"]


class TestAppendVoiceNoteToMechanicNotes:
    def test_appends_block_to_existing_notes(self):
        result = append_voice_note_to_mechanic_notes(
            "Existing note.",
            VoiceNoteSummary(
                transcript="Changed the oil filter.",
                summaryBullets=["Replaced oil filter", "Checked chain tension"],
            ),
        )

        assert "Existing note." in result
        assert "- Replaced oil filter" in result
        assert "- Checked chain tension" in result


class TestFormatVoiceNoteBlock:
    def test_includes_bullets(self):
        block = format_voice_note_block(
            VoiceNoteSummary(
                transcript="Test",
                summaryBullets=["Oil change complete"],
            )
        )

        assert block.startswith("--- Voice note (")
        assert "- Oil change complete" in block
