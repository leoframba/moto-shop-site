import pytest
from pydantic import ValidationError

from schemas import PartCreate


class TestPartCreate:
    def test_normalizes_part_number_to_uppercase(self):
        part = PartCreate(
            part_number="chain-001",
            description="520 chain",
            base_price=139.99,
        )
        assert part.part_number == "CHAIN-001"

    def test_blank_part_number_becomes_none(self):
        part = PartCreate(
            part_number="   ",
            description="Shop rag",
            base_price=2.5,
        )
        assert part.part_number is None

    def test_omitted_part_number_is_none(self):
        part = PartCreate(description="Shop rag", base_price=2.5)
        assert part.part_number is None

    def test_null_part_number_is_none(self):
        part = PartCreate(
            part_number=None,
            description="Shop rag",
            base_price=2.5,
        )
        assert part.part_number is None

    def test_strips_description(self):
        part = PartCreate(
            description="  Rear brake pads  ",
            base_price=49.99,
        )
        assert part.description == "Rear brake pads"

    def test_rejects_non_string_part_number(self):
        with pytest.raises(ValidationError):
            PartCreate(
                part_number=123,
                description="Invalid type",
                base_price=1.0,
            )
