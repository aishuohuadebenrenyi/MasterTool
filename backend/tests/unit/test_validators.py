import pytest
from common.validators import (
    validate_required,
    validate_range,
    validate_max_length,
    validate_enum,
    validate_plan_data,
    validate_activity_data,
    validate_object_id
)


class TestValidateRequired:
    def test_none_value(self):
        valid, msg = validate_required(None, '名称')
        assert valid is False
        assert '名称' in msg

    def test_empty_string(self):
        valid, msg = validate_required('', '名称')
        assert valid is False

    def test_valid_string(self):
        valid, msg = validate_required('test', '名称')
        assert valid is True
        assert msg == ''

    def test_zero_value(self):
        valid, msg = validate_required(0, '数量')
        assert valid is True


class TestValidateRange:
    def test_non_number(self):
        valid, msg = validate_range('abc', 1, 100, '数量')
        assert valid is False

    def test_below_min(self):
        valid, msg = validate_range(0, 1, 100, '数量')
        assert valid is False

    def test_above_max(self):
        valid, msg = validate_range(101, 1, 100, '数量')
        assert valid is False

    def test_in_range(self):
        valid, msg = validate_range(50, 1, 100, '数量')
        assert valid is True

    def test_boundary_min(self):
        valid, msg = validate_range(1, 1, 100, '数量')
        assert valid is True

    def test_boundary_max(self):
        valid, msg = validate_range(100, 1, 100, '数量')
        assert valid is True


class TestValidateMaxLength:
    def test_exceeds_max(self):
        valid, msg = validate_max_length('a' * 101, 100, '名称')
        assert valid is False

    def test_within_max(self):
        valid, msg = validate_max_length('test', 100, '名称')
        assert valid is True

    def test_none_value(self):
        valid, msg = validate_max_length(None, 100, '名称')
        assert valid is True


class TestValidateEnum:
    def test_valid_value(self):
        valid, msg = validate_enum('draft', ['draft', 'confirmed', 'delivered'], '状态')
        assert valid is True

    def test_invalid_value(self):
        valid, msg = validate_enum('invalid', ['draft', 'confirmed', 'delivered'], '状态')
        assert valid is False


class TestValidatePlanData:
    def test_valid_data(self, sample_plan_data):
        errors = validate_plan_data(sample_plan_data)
        assert len(errors) == 0

    def test_missing_name(self):
        errors = validate_plan_data({})
        assert any('方案名称' in e for e in errors)

    def test_invalid_people(self):
        errors = validate_plan_data({'name': 'test', 'people': -1})
        assert any('参与人数' in e for e in errors)

    def test_empty_phases(self):
        errors = validate_plan_data({'name': 'test', 'phases': []})
        assert any('环节' in e for e in errors)


class TestValidateActivityData:
    def test_valid_data(self, sample_activity_data):
        errors = validate_activity_data(sample_activity_data)
        assert len(errors) == 0

    def test_missing_name(self):
        errors = validate_activity_data({})
        assert any('活动名称' in e for e in errors)

    def test_invalid_duration(self):
        errors = validate_activity_data({'name': 'test', 'duration': 500})
        assert any('活动时长' in e for e in errors)


class TestValidateObjectId:
    def test_valid_id(self):
        from bson import ObjectId
        valid, msg = validate_object_id(str(ObjectId()), 'ID')
        assert valid is True

    def test_invalid_id(self):
        valid, msg = validate_object_id('invalid', 'ID')
        assert valid is False

    def test_empty_id(self):
        valid, msg = validate_object_id('', 'ID')
        assert valid is False
