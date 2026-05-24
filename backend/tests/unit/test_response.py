import pytest
from common.response import success, error, paginate


class TestSuccess:
    def test_with_data(self):
        result = success({'id': '123', 'name': 'test'})
        assert result['code'] == 0
        assert result['message'] == 'success'
        assert result['data']['id'] == '123'

    def test_without_data(self):
        result = success()
        assert result['code'] == 0
        assert result['data'] is None

    def test_custom_message(self):
        result = success(message='创建成功')
        assert result['message'] == '创建成功'


class TestError:
    def test_default(self):
        result, status = error()
        assert result['code'] == -1
        assert result['data'] is None
        assert status == 400

    def test_custom_code(self):
        result, status = error(code=1001)
        assert result['code'] == 1001

    def test_custom_message(self):
        result, status = error(message='参数错误')
        assert result['message'] == '参数错误'

    def test_custom_status(self):
        result, status = error(status_code=500)
        assert status == 500


class TestPaginate:
    def test_basic(self):
        data = [{'id': '1'}, {'id': '2'}]
        result = paginate(data, total=10, page=1, page_size=2)
        assert result['list'] == data
        assert result['total'] == 10
        assert result['page'] == 1
        assert result['hasMore'] is True

    def test_last_page(self):
        data = [{'id': '1'}]
        result = paginate(data, total=1, page=1, page_size=2)
        assert result['hasMore'] is False
